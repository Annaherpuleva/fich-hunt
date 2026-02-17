const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitingForResult(
  predicate: () => Promise<boolean>,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<boolean> {
  const attempts = options.attempts ?? 10;
  const delayMs = options.delayMs ?? 1000;

  for (let i = 0; i < attempts; i += 1) {
    if (await predicate()) {
      return true;
    }
    if (i < attempts - 1) {
      await sleep(delayMs);
    }
  }

  return false;
}
