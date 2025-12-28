/**
 * Simple event system for cross-component communication.
 * Used to notify dashboard to refresh when data changes on other pages.
 */

export const EVENTS = {
  TRANSACTIONS_UPDATED: "transactions-updated",
} as const;

export function emitTransactionsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTS.TRANSACTIONS_UPDATED));
  }
}

export function onTransactionsUpdated(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(EVENTS.TRANSACTIONS_UPDATED, callback);
  return () =>
    window.removeEventListener(EVENTS.TRANSACTIONS_UPDATED, callback);
}
