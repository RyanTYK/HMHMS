// Email HTML bodies interpolate user-controlled values (monitor name/target,
// a registrant's display name) without escaping. Most mail clients strip
// <script>, but unescaped HTML can still break layout or inject markup/links
// into an email the recipient trusts, so escape the same as any other
// HTML-interpolation site.
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
