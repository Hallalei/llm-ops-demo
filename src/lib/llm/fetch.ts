export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  let abortListener: (() => void) | undefined;
  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort(init.signal.reason);
    } else {
      abortListener = () => controller.abort(init.signal?.reason);
      init.signal.addEventListener("abort", abortListener);
    }
  }

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (abortListener && init.signal) {
      init.signal.removeEventListener("abort", abortListener);
    }
  }
}
