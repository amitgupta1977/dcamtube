// Browser-side helper: adds the login token to API requests so the server
// knows who is calling. The server never trusts a userId sent in the body or URL.
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('godashreel_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
