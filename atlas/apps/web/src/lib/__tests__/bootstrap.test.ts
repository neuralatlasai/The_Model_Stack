/**
 * The generated inline bootstrap is executed against a minimal fake DOM.
 * `node:vm` compiles and runs the exact string the layout embeds — test-only
 * use of dynamic code, to verify generated output; site code never does this.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import vm from 'node:vm';
import { STORAGE_KEYS } from '@atlas/core';
import { initDepth } from '../../client/depth.ts';
import { Controller } from '../../client/lifecycle.ts';
import type { PageContext } from '../../client/page.ts';
import { createStore } from '../../client/storage.ts';
import { bootstrapScript } from '../bootstrap.ts';

class FakeRoot {
  readonly attributes = new Map<string, string>();
  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
}

interface Harness {
  readonly root: FakeRoot;
  readonly listeners: Map<string, ((event: unknown) => void)[]>;
  run: () => void;
}

function harness(href: string, stored: Record<string, string>, options: { storageThrows?: boolean } = {}): Harness {
  const root = new FakeRoot();
  const listeners = new Map<string, ((event: unknown) => void)[]>();
  const window: Record<string, unknown> = {
    location: { href },
    localStorage: {
      getItem: (key: string): string | null => {
        if (options.storageThrows === true) throw new Error('SecurityError');
        return stored[key] ?? null;
      },
    },
  };
  const document = {
    documentElement: root,
    addEventListener: (type: string, listener: (event: unknown) => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
  };
  const context = vm.createContext({ window, document, URL, JSON });
  const script = new vm.Script(bootstrapScript());
  return {
    root,
    listeners,
    run: (): void => {
      script.runInContext(context);
    },
  };
}

describe('inline bootstrap', () => {
  it('applies a JSON-encoded stored theme and the default depth', () => {
    const h = harness('https://atlas.example/ch05/', { [STORAGE_KEYS.theme]: '"dark"' });
    h.run();
    assert.equal(h.root.attributes.get('data-theme'), 'dark');
    assert.equal(h.root.attributes.get('data-depth'), 'implementation');
  });

  it('accepts a raw stored theme and treats "system" as no attribute', () => {
    const raw = harness('https://atlas.example/', { [STORAGE_KEYS.theme]: 'light' });
    raw.run();
    assert.equal(raw.root.attributes.get('data-theme'), 'light');
    const system = harness('https://atlas.example/', { [STORAGE_KEYS.theme]: '"system"' });
    system.root.setAttribute('data-theme', 'dark');
    system.run();
    assert.equal(system.root.attributes.has('data-theme'), false);
  });

  it('ignores stored values outside the allowed set', () => {
    const h = harness('https://atlas.example/?depth=everything', {
      [STORAGE_KEYS.theme]: '"purple"',
      [STORAGE_KEYS.depth]: '{"depth":"overview"}',
    });
    h.run();
    assert.equal(h.root.attributes.has('data-theme'), false);
    assert.equal(h.root.attributes.get('data-depth'), 'implementation');
  });

  it('prefers the URL depth over the stored depth', () => {
    const h = harness('https://atlas.example/ch05/?depth=research', { [STORAGE_KEYS.depth]: '"overview"' });
    h.run();
    assert.equal(h.root.attributes.get('data-depth'), 'research');
    const stored = harness('https://atlas.example/ch05/', { [STORAGE_KEYS.depth]: '"overview"' });
    stored.run();
    assert.equal(stored.root.attributes.get('data-depth'), 'overview');
  });

  it('survives blocked storage', () => {
    const h = harness('https://atlas.example/?depth=technical', {}, { storageThrows: true });
    h.run();
    assert.equal(h.root.attributes.has('data-theme'), false);
    assert.equal(h.root.attributes.get('data-depth'), 'technical');
  });

  it('shows complete manuscripts at implementation depth despite stored and URL preferences', () => {
    for (const storedDepth of ['overview', 'technical', 'research']) {
      for (const storedValue of [storedDepth, JSON.stringify(storedDepth)]) {
        for (const urlDepth of ['', '?depth=overview', '?depth=technical', '?depth=research']) {
          const stored = { [STORAGE_KEYS.depth]: storedValue };
          const h = harness(`https://atlas.example/ch05/${urlDepth}`, stored);
          h.root.setAttribute('data-reading-mode', 'complete');
          h.run();
          assert.equal(h.root.attributes.get('data-depth'), 'implementation');
          assert.equal(stored[STORAGE_KEYS.depth], storedValue);
        }
      }
    }
  });

  it('shows complete manuscripts when storage is blocked', () => {
    const h = harness('https://atlas.example/ch05/?depth=overview', {}, { storageThrows: true });
    h.root.setAttribute('data-reading-mode', 'complete');
    h.run();
    assert.equal(h.root.attributes.get('data-depth'), 'implementation');
  });

  it('uses the incoming reading mode on swaps and restores ordinary atlas preferences afterward', () => {
    const stored = { [STORAGE_KEYS.depth]: '"overview"' };
    const h = harness('https://atlas.example/graph/', stored);
    h.run();
    assert.equal(h.root.attributes.get('data-depth'), 'overview');
    const swap = h.listeners.get('astro:before-swap')?.[0];
    assert.ok(swap);
    const article = new FakeRoot();
    article.setAttribute('data-reading-mode', 'complete');
    swap({ newDocument: { documentElement: article }, to: new URL('https://atlas.example/ch05/?depth=overview') });
    assert.equal(article.attributes.get('data-depth'), 'implementation');
    const atlas = new FakeRoot();
    swap({ newDocument: { documentElement: atlas }, to: new URL('https://atlas.example/graph/') });
    assert.equal(atlas.attributes.get('data-depth'), 'overview');
    swap({ newDocument: { documentElement: atlas }, to: new URL('https://atlas.example/graph/?depth=research') });
    assert.equal(atlas.attributes.get('data-depth'), 'research');
    assert.equal(stored[STORAGE_KEYS.depth], '"overview"');
  });

  it('re-applies state to the incoming document on ClientRouter swaps, registering once', () => {
    const h = harness('https://atlas.example/', { [STORAGE_KEYS.theme]: '"dark"' });
    h.run();
    h.run();
    const handlers = h.listeners.get('astro:before-swap') ?? [];
    assert.equal(handlers.length, 1);
    const incoming = new FakeRoot();
    handlers[0]?.({
      newDocument: { documentElement: incoming },
      to: new URL('https://atlas.example/ch05/?depth=overview'),
    });
    assert.equal(incoming.attributes.get('data-theme'), 'dark');
    assert.equal(incoming.attributes.get('data-depth'), 'overview');
  });

  it('contains no markup that could end its script element', () => {
    assert.equal(/<\/script/iu.test(bootstrapScript()), false);
  });
});

class FakeDepthControl extends FakeRoot {
  closest(selector: string): FakeDepthControl | null {
    return selector.includes('data-action') ? this : null;
  }
}

interface ClientHarness {
  readonly ctx: PageContext;
  readonly root: FakeRoot;
  readonly stored: Map<string, string>;
  readonly location: { href: string };
  clickDepth: () => boolean;
}

/** Run the real controller with bounded DOM doubles and restore all globals. */
function withClientDepth(complete: boolean, run: (h: ClientHarness) => void): void {
  const root = new FakeRoot();
  root.setAttribute('data-depth', 'overview');
  if (complete) root.setAttribute('data-reading-mode', 'complete');
  const control = new FakeDepthControl();
  control.setAttribute('data-action', 'set-depth');
  control.setAttribute('data-depth-option', 'overview');
  const listeners = new Map<string, ((event: unknown) => void)[]>();
  const doc = {
    documentElement: root,
    querySelectorAll: () => [control],
    addEventListener: (type: string, listener: (event: unknown) => void): void => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    dispatchEvent: (): boolean => true,
  };
  const stored = new Map<string, string>([[STORAGE_KEYS.depth, '"research"']]);
  const store = createStore({
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => {
      stored.set(key, value);
    },
    removeItem: (key) => {
      stored.delete(key);
    },
  });
  const location = { href: 'https://atlas.example/page/?depth=overview#mechanism' };
  const history = {
    state: {},
    replaceState: (_state: unknown, _unused: string, href: string): void => {
      location.href = href;
    },
  };
  const globals = { location, history, Element: FakeDepthControl, HTMLButtonElement: FakeDepthControl };
  const original = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { configurable: true, value });
  const ctl = new Controller();
  const ctx: PageContext = {
    doc: doc as unknown as Document,
    ctl,
    store,
    base: '/',
    article: null,
    nodeId: null,
    announce: () => undefined,
    state: { activeAnchor: null, activeRole: null, progress: 0, depth: 'overview' },
    actions: {},
  };
  try {
    initDepth(ctx);
    run({
      ctx,
      root,
      stored,
      location,
      clickDepth: (): boolean => {
        let prevented = false;
        const event = {
          target: control,
          button: 0,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          preventDefault: (): void => {
            prevented = true;
          },
        };
        for (const listener of listeners.get('click') ?? []) listener(event);
        return prevented;
      },
    });
  } finally {
    ctl.dispose();
    for (const [key, descriptor] of original) {
      if (descriptor === undefined) Reflect.deleteProperty(globalThis, key);
      else Object.defineProperty(globalThis, key, descriptor);
    }
  }
}

describe('complete-reading depth controller', () => {
  it('ignores a legacy URL and control without changing stored preferences or exposing palette depth actions', () => {
    withClientDepth(true, ({ ctx, root, stored, location, clickDepth }) => {
      assert.equal(ctx.state.depth, 'implementation');
      assert.equal(root.getAttribute('data-depth'), 'implementation');
      assert.equal(ctx.actions.setDepth, undefined);
      assert.equal(stored.get(STORAGE_KEYS.depth), '"research"');
      assert.equal(location.href, 'https://atlas.example/page/#mechanism');
      assert.equal(clickDepth(), true);
      assert.equal(root.getAttribute('data-depth'), 'implementation');
      assert.equal(stored.get(STORAGE_KEYS.depth), '"research"');
      assert.equal(ctx.actions.linkTo?.('algorithm'), 'https://atlas.example/page/#algorithm');
    });
  });

  it('preserves URL, persistence, controls, and palette actions on ordinary atlas pages', () => {
    withClientDepth(false, ({ ctx, root, stored, location, clickDepth }) => {
      assert.equal(ctx.state.depth, 'overview');
      assert.equal(stored.get(STORAGE_KEYS.depth), '"overview"');
      assert.ok(ctx.actions.setDepth);
      ctx.actions.setDepth('technical');
      assert.equal(root.getAttribute('data-depth'), 'technical');
      assert.equal(stored.get(STORAGE_KEYS.depth), '"technical"');
      assert.equal(new URL(location.href).searchParams.get('depth'), 'technical');
      assert.equal(clickDepth(), true);
      assert.equal(ctx.state.depth, 'overview');
      assert.equal(stored.get(STORAGE_KEYS.depth), '"overview"');
    });
  });
});
