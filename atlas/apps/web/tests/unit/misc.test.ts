import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Controller, debounce, frameScheduler } from '../../src/client/lifecycle.ts';
import { effectiveTheme, nextTheme, themeAttribute, themeLabel, toggledTheme } from '../../src/client/theme-model.ts';
import { canonicalPageUrl, safeExternalHref, safeInternalHref, withBase } from '../../src/client/urls.ts';

describe('theme-model', () => {
  test('cycles light → dark → system → light (the shell toggle order)', () => {
    assert.equal(nextTheme('light'), 'dark');
    assert.equal(nextTheme('dark'), 'system');
    assert.equal(nextTheme('system'), 'light');
  });

  test('system follows the platform; the attribute is removed for system', () => {
    assert.equal(effectiveTheme('system', true), 'dark');
    assert.equal(effectiveTheme('light', true), 'light');
    assert.equal(themeAttribute('system'), null);
    assert.equal(themeAttribute('dark'), 'dark');
    assert.equal(themeLabel('system', false), 'system (light)');
  });

  test('"Toggle dark mode" picks the opposite of what is shown', () => {
    assert.equal(toggledTheme('system', true), 'light');
    assert.equal(toggledTheme('system', false), 'dark');
    assert.equal(toggledTheme('dark', false), 'light');
  });
});

describe('urls', () => {
  test('external links: http(s) only', () => {
    assert.equal(safeExternalHref('https://arxiv.org/abs/2309.06180'), 'https://arxiv.org/abs/2309.06180');
    assert.equal(safeExternalHref('javascript:alert(1)'), null);
    assert.equal(safeExternalHref('data:text/html,x'), null);
    assert.equal(safeExternalHref(null), null);
    assert.equal(safeExternalHref('  '), null);
  });

  test('internal links: root-relative paths only', () => {
    assert.equal(safeInternalHref('/papers/p19/'), '/papers/p19/');
    assert.equal(safeInternalHref('//evil.test/x'), null);
    assert.equal(safeInternalHref('/\\evil.test'), null);
    assert.equal(safeInternalHref('javascript:alert(1)'), null);
    assert.equal(safeInternalHref('/a\nb'), null);
    assert.equal(safeInternalHref(undefined), null);
  });

  test('withBase prefixes a deploy base once', () => {
    assert.equal(withBase('/', '/ch05/'), '/ch05/');
    assert.equal(withBase('/atlas/', '/ch05/'), '/atlas/ch05/');
    assert.equal(withBase('/atlas/', '/atlas/ch05/'), '/atlas/ch05/');
  });

  test('canonicalPageUrl drops query and fragment', () => {
    assert.equal(canonicalPageUrl('https://atlas.test/ch05/05-2/?depth=overview#eq-5-4'), 'https://atlas.test/ch05/05-2/');
  });
});

describe('Controller', () => {
  test('dispose aborts listeners, runs cleanups in reverse order once, and cancels timers', async () => {
    const ctl = new Controller();
    const target = new EventTarget();
    let events = 0;
    target.addEventListener(
      'ping',
      () => {
        events += 1;
      },
      { signal: ctl.signal },
    );
    const order: string[] = [];
    ctl.defer(() => order.push('first'));
    ctl.defer(() => {
      throw new Error('a failing cleanup must not stop the others');
    });
    ctl.defer(() => order.push('last'));
    let fired = false;
    ctl.timeout(() => {
      fired = true;
    }, 5);
    let disconnected = 0;
    ctl.observe({
      disconnect: () => {
        disconnected += 1;
      },
    });

    target.dispatchEvent(new Event('ping'));
    ctl.dispose();
    ctl.dispose();
    target.dispatchEvent(new Event('ping'));
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(events, 1);
    assert.deepEqual(order, ['last', 'first']);
    assert.equal(fired, false);
    assert.equal(disconnected, 1);
    assert.equal(ctl.signal.aborted, true);
    assert.equal(ctl.disposed, true);
  });

  test('work registered after dispose is not scheduled; cleanups run immediately', () => {
    const ctl = new Controller();
    ctl.dispose();
    let ran = false;
    ctl.defer(() => {
      ran = true;
    });
    assert.equal(ran, true);
    let fired = false;
    ctl.timeout(() => {
      fired = true;
    }, 0);
    assert.equal(fired, false);
  });

  test('debounce coalesces calls and flush runs the pending call once', async () => {
    const ctl = new Controller();
    let runs = 0;
    const debounced = debounce(
      ctl,
      () => {
        runs += 1;
      },
      10,
    );
    debounced.call();
    debounced.call();
    debounced.call();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(runs, 1);
    debounced.call();
    debounced.flush();
    debounced.flush();
    assert.equal(runs, 2);
    ctl.dispose();
  });

  test('frameScheduler runs at most once per frame (timeout fallback outside browsers)', async () => {
    const ctl = new Controller();
    let runs = 0;
    const schedule = frameScheduler(ctl, () => {
      runs += 1;
    });
    schedule();
    schedule();
    schedule();
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(runs, 1);
    ctl.dispose();
  });
});
