/** Groups requests made during the same render burst into bounded API batches. */
export function createBatchLoader<T>(
  load: (ids: number[]) => Promise<T[]>,
  identify: (row: T) => number,
  delayMs = 80,
  batchSize = 60,
) {
  type Waiter = { resolve: (row: T | null) => void; reject: (error: unknown) => void };
  const accounts = new Map<string, Map<number, Waiter[]>>();

  async function flush(account: string) {
    const pending = accounts.get(account);
    if (!pending) return;
    accounts.delete(account);
    const ids = [...pending.keys()];
    for (let offset = 0; offset < ids.length; offset += batchSize) {
      const batch = ids.slice(offset, offset + batchSize);
      try {
        const rows = new Map((await load(batch)).map(row => [identify(row), row]));
        for (const id of batch) {
          for (const waiter of pending.get(id) ?? []) waiter.resolve(rows.get(id) ?? null);
        }
      } catch (error) {
        for (const id of batch) {
          for (const waiter of pending.get(id) ?? []) waiter.reject(error);
        }
      }
    }
  }

  return (id: number, account: string): Promise<T | null> => new Promise((resolve, reject) => {
    let pending = accounts.get(account);
    if (!pending) {
      pending = new Map();
      accounts.set(account, pending);
      setTimeout(() => { void flush(account); }, delayMs);
    }
    const waiters = pending.get(id) ?? [];
    waiters.push({ resolve, reject });
    pending.set(id, waiters);
  });
}
