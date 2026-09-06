export type CmsContentMode = 'live' | 'release';

export function contentSource(): 'local' | 'cms' {
  return (import.meta.env.CONTENT_SOURCE ?? 'local') === 'cms' ? 'cms' : 'local';
}

export function cmsContentMode(): CmsContentMode {
  if (String(import.meta.env.CMS_LIVE_MODE ?? '').toLowerCase() === 'true') return 'live';
  return (import.meta.env.CMS_CONTENT_MODE ?? 'release') === 'live' ? 'live' : 'release';
}

export function isCmsLiveMode(): boolean {
  return contentSource() === 'cms' && cmsContentMode() === 'live';
}
