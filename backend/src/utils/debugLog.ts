// Routine per-request/per-tick informational logging (SSE connects, check
// results, OAuth profile lookups) that's unconditionally noisy in
// production. Gated behind API_DEBUG, mirroring the existing WORKER_DEBUG
// flag elsewhere in the backend. Real errors still use console.error
// directly and are never gated.
export function debugLog(...args: unknown[]) {
  if (process.env.API_DEBUG === 'true') console.log(...args);
}
