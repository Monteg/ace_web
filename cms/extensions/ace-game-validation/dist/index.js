import { defineHook } from '@directus/extensions-sdk';
import { InvalidPayloadError } from '@directus/errors';

const GAME_TYPES = new Set(['slot', 'instant', 'crash', 'table']);
const STATUSES = new Set(['live', 'coming_soon']);
const VOLATILITY = new Set(['low', 'medium', 'high', 'very_high']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  throw new InvalidPayloadError({ reason: message });
}

function validateGame(game) {
  if (game.internal_name !== undefined && String(game.internal_name).trim().length < 2) fail('Game name is required.');
  if (game.slug !== undefined && !SLUG.test(game.slug)) fail('Slug must contain lowercase letters, numbers and hyphens only.');
  if (game.game_type !== undefined && !GAME_TYPES.has(game.game_type)) fail('Invalid game type.');
  if (game.release_status !== undefined && !STATUSES.has(game.release_status)) fail('Invalid release status.');
  if (game.volatility !== undefined && (!Array.isArray(game.volatility) || !game.volatility.length || game.volatility.some((item) => !VOLATILITY.has(item)))) fail('Select at least one valid volatility level.');
  if (game.rtp_mode === 'fixed' || game.rtp !== undefined) {
    const rtp = Number(game.rtp);
    if (!Number.isFinite(rtp) || rtp < 0.8 || rtp > 0.995) fail('Fixed RTP must be between 0.8 and 0.995.');
  }
  const min = game.bet_min == null ? null : Number(game.bet_min);
  const max = game.bet_max == null ? null : Number(game.bet_max);
  if ((min === null) !== (max === null) || (min !== null && max !== null && min > max)) fail('Bet min and max must be supplied together, and min cannot exceed max.');
  if (game.max_win_value != null && !['x', 'coins'].includes(game.max_win_unit)) fail('Max win requires x or coins as its unit.');
  if (!game.demo_enabled) return;
  if (game.demo_mode === 'adapter' && !UUID.test(game.demo_game_id ?? '')) fail('Adapter demo requires a valid game UUID.');
  if (game.demo_mode === 'direct') {
    if (!game.direct_build || !Number.isInteger(Number(game.direct_version)) || Number(game.direct_version) <= 0) fail('Direct demo requires build and a positive integer version.');
    if (game.api_host) {
      try { new URL(game.api_host); } catch { fail('API host must be a valid URL.'); }
    }
  }
  if (!['adapter', 'direct'].includes(game.demo_mode)) fail('Enabled demo requires adapter or direct mode.');
}

export default defineHook(({ filter }, { services, getSchema }) => {
  const { ItemsService } = services;

  filter('items.create', (payload, meta) => {
    if (meta.collection === 'games') validateGame(payload);
    return payload;
  });

  filter('items.update', async (payload, meta, context) => {
    if (meta.collection !== 'games') return payload;
    const schema = await getSchema();
    const service = new ItemsService('games', { schema, accountability: context.accountability });
    const current = await service.readOne(meta.keys[0], { fields: ['*'] });
    const next = { ...current, ...payload };
    if (current.published_slug && payload.slug && payload.slug !== current.published_slug && !context.accountability?.admin) {
      fail('A published slug can only be changed by an Administrator together with a redirect.');
    }
    validateGame(next);
    return payload;
  });
});
