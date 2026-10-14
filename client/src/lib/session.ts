/**
 * The one place a dead session is announced.
 *
 * `request()` is plain TypeScript: it has no React and must not learn any, so it
 * cannot reach `useSession`'s state directly. It publishes here instead, and the
 * session hook subscribes. One request notices; every screen reacts.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to "the server says our session is gone". Returns an unsubscribe. */
export function onSessionEnded(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the transport layer when a 401 means the session, not the input. */
export function announceSessionEnded(): void {
  for (const listener of listeners) listener();
}
