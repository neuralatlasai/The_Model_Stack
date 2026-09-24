/**
 * Per-page lifecycle. Astro's ClientRouter swaps the <body> on navigation, so
 * every listener, observer, and timer a page registers must be released on
 * `astro:before-swap` and re-created on `astro:page-load`. A `Controller`
 * owns them: listeners take `{ signal: controller.signal }`, everything else
 * registers a cleanup. `dispose()` is idempotent and never throws.
 *
 * Pure with respect to the DOM (uses only EventTarget/AbortController/timers),
 * so it is unit-testable under node:test.
 */

type Timer = ReturnType<typeof setTimeout>;

export class Controller {
  readonly #abort = new AbortController();
  readonly #cleanups: (() => void)[] = [];
  #disposed = false;

  /** Pass as `{ signal }` to addEventListener; aborted on dispose. */
  get signal(): AbortSignal {
    return this.#abort.signal;
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  /** Registers a cleanup. If the controller is already disposed the cleanup runs immediately. */
  defer(cleanup: () => void): void {
    if (this.#disposed) {
      runQuietly(cleanup);
      return;
    }
    this.#cleanups.push(cleanup);
  }

  /** Registers an observer (IntersectionObserver, MutationObserver, …) for disconnection on dispose. */
  observe<T extends { disconnect(): void }>(observer: T): T {
    this.defer(() => {
      observer.disconnect();
    });
    return observer;
  }

  /** setTimeout owned by the page. Returns a cancel function. */
  timeout(fn: () => void, ms: number): () => void {
    if (this.#disposed) return noop;
    let handle: Timer | null = setTimeout(() => {
      handle = null;
      if (!this.#disposed) fn();
    }, ms);
    const cancel = (): void => {
      if (handle !== null) clearTimeout(handle);
      handle = null;
    };
    this.defer(cancel);
    return cancel;
  }

  /** requestAnimationFrame owned by the page (falls back to a 16 ms timeout outside browsers). Returns a cancel function. */
  frame(fn: () => void): () => void {
    if (this.#disposed) return noop;
    const raf = globalThis.requestAnimationFrame as typeof requestAnimationFrame | undefined;
    if (raf === undefined) return this.timeout(fn, 16);
    let handle: number | null = raf(() => {
      handle = null;
      if (!this.#disposed) fn();
    });
    const cancel = (): void => {
      if (handle !== null) cancelAnimationFrame(handle);
      handle = null;
    };
    this.defer(cancel);
    return cancel;
  }

  /** Releases everything in reverse registration order. Safe to call more than once. */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#abort.abort();
    for (let index = this.#cleanups.length - 1; index >= 0; index -= 1) {
      const cleanup = this.#cleanups[index];
      if (cleanup !== undefined) runQuietly(cleanup);
    }
    this.#cleanups.length = 0;
  }
}

function noop(): void {
  // intentionally empty: cancel handle for work that was never scheduled
}

/** Cleanups must not prevent later cleanups from running; a failing one is dropped. */
function runQuietly(fn: () => void): void {
  try {
    fn();
  } catch {
    // A cleanup that throws has nothing left to release; continuing is the recovery.
  }
}

/**
 * Coalesces calls into one run per animation frame (scroll/resize handlers).
 * Returns the scheduler; pending frames are cancelled with the controller.
 */
export function frameScheduler(ctl: Controller, fn: () => void): () => void {
  let pending = false;
  return () => {
    if (pending || ctl.disposed) return;
    pending = true;
    ctl.frame(() => {
      pending = false;
      fn();
    });
  };
}

/** Trailing-edge debounce owned by the controller. `flush()` runs a pending call immediately. */
export function debounce(ctl: Controller, fn: () => void, ms: number): { readonly call: () => void; readonly flush: () => void } {
  let cancel: (() => void) | null = null;
  const run = (): void => {
    cancel = null;
    fn();
  };
  return {
    call: () => {
      cancel?.();
      cancel = ctl.timeout(run, ms);
    },
    flush: () => {
      if (cancel === null) return;
      cancel();
      run();
    },
  };
}
