// Shared session-expiry event for native and web; does not depend on DOM globals.
const listeners = new Set<() => void>();
export function onAuthLogout(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function emitAuthLogout() {
  for (const listener of listeners) listener();
}
