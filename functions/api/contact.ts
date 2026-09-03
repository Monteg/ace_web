/**
 * Contact form handler. A Cloudflare Pages Function: the file path is the
 * route, so this answers POST /api/contact with no server to run or maintain.
 *
 * The old site had no backend of its own. The form carried method="get" and no
 * action at all, and Webflow's script was the entire mechanism, which meant
 * every lead ever received lived inside that subscription. This keeps them.
 *
 * Environment variables (Cloudflare dashboard -> Settings -> Variables):
 *   RESEND_API_KEY   required, from resend.com (3,000 emails/month free)
 *   CONTACT_TO       where enquiries go, e.g. info@acegames.io
 *   CONTACT_FROM     a verified sender on your domain, e.g. site@acegames.io
 *
 * Without them the visitor lands on /thanks?status=error&reason=unconfigured,
 * which says plainly that the form is not connected yet and offers the direct
 * email address, rather than swallowing the message.
 */

/** Cloudflare passes this object to the handler. Typed here rather than
 *  pulling in @cloudflare/workers-types, whose globals clash with the DOM
 *  types the rest of the project uses. */
interface Context {
  request: Request;
  env: Env;
}

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

const MAX = { name: 120, company: 160, email: 200, message: 5000 };

function clean(value: FormDataEntryValue | null, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

function back(request: Request, params: Record<string, string>): Response {
  const url = new URL('/thanks', request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return Response.redirect(url.toString(), 303);
}

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, { status: 'error', reason: 'unreadable' });
  }

  // Honeypot: a real person never fills a field they cannot see.
  if (clean(form.get('website'), 100)) return back(request, { status: 'ok' });

  const name = clean(form.get('name'), MAX.name);
  const company = clean(form.get('company'), MAX.company);
  const email = clean(form.get('email'), MAX.email);
  const message = clean(form.get('message'), MAX.message);

  if (!name || !company || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return back(request, { status: 'error', reason: 'invalid' });
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('contact: RESEND_API_KEY, CONTACT_TO or CONTACT_FROM is not set');
    return back(request, { status: 'error', reason: 'unconfigured' });
  }

  const body = [
    `Name:    ${name}`,
    `Company: ${company}`,
    `Email:   ${email}`,
    '',
    message || '(no message)',
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `Website enquiry: ${company}`,
      text: body,
      html: `<pre style="font:14px/1.6 ui-monospace,monospace">${escapeHtml(body)}</pre>`,
    }),
  });

  if (!res.ok) {
    console.error('contact: resend returned', res.status, await res.text());
    return back(request, { status: 'error', reason: 'send-failed' });
  }

  return back(request, { status: 'ok' });
};
