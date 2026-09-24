/**
 * The generated inline bootstrap is executed against a minimal fake DOM.
 * `node:vm` compiles and runs the exact string the layout embeds — test-only
 * use of dynamic code, to verify generated output; site code never does this.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import vm from 'node:vm';
import { STORAGE_KEYS } from '@atlas/core';
import { bootstrapScript } from '../bootstrap.ts';

class FakeRoot {
  readonly attributes = new Map<string, string>();
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

  it('re-applies state to the incoming document on ClientRouter swaps, registering once', () => {
    const h = harness('https://atlas.example/', { [STORAGE_KEYS.theme]: '"dark"' });
    h.run();
    h.run();
    const handlers = h.listeners.get('astro:before-swap') ?? [];
    assert.equal(handlers.length, 1);
    const incoming = new FakeRoot();
    handlers[0]?.({ newDocument: { documentElement: incoming }, to: new URL('https://atlas.example/ch05/?depth=overview') });
    assert.equal(incoming.attributes.get('data-theme'), 'dark');
    assert.equal(incoming.attributes.get('data-depth'), 'overview');
  });

  it('contains no markup that could end its script element', () => {
    assert.equal(/<\/script/iu.test(bootstrapScript()), false);
  });
});
