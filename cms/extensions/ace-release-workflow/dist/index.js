import { defineEndpoint } from '@directus/extensions-sdk';
import crypto from 'node:crypto';
import {
  assertPublishSelection,
  checksum,
  mergeSelectedRelease,
  normalizeWorkingContent,
  secureEqual,
  signature,
  stableJson,
  validateSnapshot,
} from './release-core.js';

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function splitEmails(value) {
  return String(value ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

async function assertTrustedPublisher(req, database, env) {
  if (!req.accountability?.user) throw httpError(401, 'Authentication is required.');
  if (req.accountability.admin) return;
  const user = await database('directus_users').select('email').where({ id: req.accountability.user }).first();
  const trusted = splitEmails(env.ACE_TRUSTED_PUBLISHERS);
  if (!user?.email || !trusted.includes(String(user.email).toLowerCase())) throw httpError(403, 'This account is not allowed to publish production releases.');
}

async function readWorkingContent(ItemsService, schema, accountability) {
  const service = (collection) => new ItemsService(collection, { schema, accountability });
  const [locales, games, siteStrings, faqItems] = await Promise.all([
    service('locales').readByQuery({ fields: ['*'], filter: { is_active: { _eq: true } }, limit: -1 }),
    service('games').readByQuery({
      fields: ['*', 'translations.*', 'sections.*', 'sections.translations.*', 'sections.items.*', 'sections.items.translations.*', 'gallery.*', 'gallery.translations.*'],
      limit: -1,
    }),
    service('site_strings').readByQuery({ fields: ['*', 'translations.*'], filter: { active: { _eq: true } }, limit: -1 }),
    service('faq_items').readByQuery({ fields: ['*', 'translations.*'], limit: -1 }),
  ]);
  return normalizeWorkingContent({ locales, games, siteStrings, faqItems });
}

async function createRelease(database, payload, createdBy, sourceRelease = null) {
  return database.transaction(async (trx) => {
    await trx.raw('SELECT pg_advisory_xact_lock(?)', [1094927687]);
    const row = await trx('content_releases').max({ latest: 'version' }).first();
    const version = Number(row?.latest ?? 0) + 1;
    const id = crypto.randomUUID();
    await trx('content_releases').insert({
      id,
      version,
      status: 'validating',
      created_at: new Date(),
      created_by: createdBy,
      source_release: sourceRelease,
      is_active: false,
      payload,
      checksum: checksum(payload),
      deploy_status: 'pending',
    });
    return { id, version };
  });
}

async function dispatchRelease(database, env, release, warnings) {
  if (!env.DEPLOY_WEBHOOK_URL || !env.DEPLOY_WEBHOOK_SECRET) {
    const message = 'Deployment is not configured. Set DEPLOY_WEBHOOK_URL and DEPLOY_WEBHOOK_SECRET.';
    await database('content_releases').where({ id: release.id }).update({ status: 'failed', deploy_status: 'not_configured', error_log: message });
    throw httpError(503, message);
  }
  const body = stableJson({ release_id: release.id, version: release.version, checksum: release.checksum, warnings });
  await database('content_releases').where({ id: release.id }).update({ status: 'deploying', deploy_status: 'requested', error_log: null });
  let response;
  try {
    response = await fetch(env.DEPLOY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Ace-Signature': signature(body, env.DEPLOY_WEBHOOK_SECRET) },
      body,
    });
  } catch (error) {
    await database('content_releases').where({ id: release.id }).update({ status: 'failed', deploy_status: 'request_failed', error_log: String(error.message ?? error) });
    throw httpError(502, 'Deployment provider could not be reached. The previous release remains active.');
  }
  const text = await response.text();
  let provider = {};
  try { provider = text ? JSON.parse(text) : {}; } catch { provider = { response: text.slice(0, 2000) }; }
  if (!response.ok) {
    const message = `Deployment provider rejected the release (${response.status}).`;
    await database('content_releases').where({ id: release.id }).update({ status: 'failed', deploy_status: 'rejected', error_log: `${message} ${text}`.slice(0, 10000) });
    throw httpError(502, `${message} The previous release remains active.`);
  }
  await database('content_releases').where({ id: release.id }).update({
    deploy_status: 'building',
    deploy_id: provider.deploy_id ?? provider.id ?? null,
    deploy_url: provider.deploy_url ?? provider.url ?? null,
  });
  return { id: release.id, version: release.version, status: 'deploying', warnings };
}

export default defineEndpoint({
  id: 'ace-releases',
  handler: (router, { services, getSchema, database, env, logger }) => {
  const { ItemsService } = services;

  router.post('/publish', async (req, res, next) => {
    try {
      await assertTrustedPublisher(req, database, env);
      const selections = req.body?.selections ?? {};
      if (!req.body?.publish_all) assertPublishSelection(selections);
      const schema = await getSchema();
      const working = await readWorkingContent(ItemsService, schema, req.accountability);
      const previous = await database('content_releases').select('id', 'payload').where({ is_active: true }).orderBy('version', 'desc').first();
      const payload = req.body?.publish_all || !previous ? working : mergeSelectedRelease(previous.payload, working, selections);
      const { warnings } = validateSnapshot(payload);
      const created = await createRelease(database, payload, req.accountability.user, previous?.id ?? null);
      const release = { ...created, checksum: checksum(payload) };
      res.status(202).json({ data: await dispatchRelease(database, env, release, warnings) });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  });

  router.post('/rollback', async (req, res, next) => {
    try {
      await assertTrustedPublisher(req, database, env);
      const sourceId = String(req.body?.release_id ?? '');
      const source = await database('content_releases').select('id', 'payload', 'status').where({ id: sourceId }).first();
      if (!source || source.status !== 'published') throw httpError(404, 'Only a successful published release can be redeployed.');
      const { warnings } = validateSnapshot(source.payload);
      const created = await createRelease(database, source.payload, req.accountability.user, source.id);
      const release = { ...created, checksum: checksum(source.payload) };
      res.status(202).json({ data: await dispatchRelease(database, env, release, warnings) });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  });

  router.post('/callback', async (req, res, next) => {
    try {
      if (!env.DEPLOY_WEBHOOK_SECRET) throw httpError(503, 'Deployment callback secret is not configured.');
      const expected = signature(req.body ?? {}, env.DEPLOY_WEBHOOK_SECRET);
      const received = String(req.get('X-Ace-Signature') ?? '').replace(/^sha256=/, '');
      if (!secureEqual(expected, received)) throw httpError(401, 'Invalid deployment callback signature.');
      const releaseId = String(req.body?.release_id ?? '');
      const release = await database('content_releases').select('*').where({ id: releaseId }).first();
      if (!release) throw httpError(404, 'Release was not found.');
      if (req.body?.status !== 'success') {
        await database('content_releases').where({ id: releaseId }).update({
          status: 'failed',
          deploy_status: 'failed',
          deploy_id: req.body?.deploy_id ?? release.deploy_id,
          deploy_url: req.body?.deploy_url ?? release.deploy_url,
          error_log: String(req.body?.error_log ?? 'Build failed without an error message.').slice(0, 10000),
        });
        res.json({ data: { id: releaseId, status: 'failed', previous_release_preserved: true } });
        return;
      }
      if (checksum(release.payload) !== release.checksum) throw httpError(409, 'Release checksum changed after creation.');
      validateSnapshot(release.payload);
      await database.transaction(async (trx) => {
        await trx('content_releases').where({ is_active: true }).whereNot({ id: releaseId }).update({ is_active: false });
        await trx('content_releases').where({ id: releaseId }).update({
          status: 'published',
          is_active: true,
          deploy_status: 'success',
          deploy_id: req.body?.deploy_id ?? release.deploy_id,
          deploy_url: req.body?.deploy_url ?? release.deploy_url,
          error_log: null,
        });
        for (const game of release.payload.games) {
          await trx('games').where({ id: game.id }).whereNull('published_slug').update({ published_slug: game.slug });
        }
      });
      res.json({ data: { id: releaseId, version: release.version, status: 'published', is_active: true } });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  });
  },
});
