/** Responsive geometry, not CSS shrinking, keeps scientific axes readable. */
import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ChartSpec, FigurePlacement } from '@atlas/core';
import { ChartView } from '@atlas/visual/svg';
import { enhanceChart } from '../client/charts.ts';
import { Controller } from '../client/lifecycle.ts';
import { FIGURE_STATE_EVENT, type FigureStateDetail } from '../client/live-instruments.ts';

export interface ResearchChartProps {
  readonly spec: ChartSpec;
  readonly title: string;
  readonly desc: string;
  readonly idPrefix: string;
  readonly placement?: FigurePlacement;
  readonly variables?: Readonly<Record<string, number>>;
  readonly highlight?: readonly string[];
  readonly compact?: boolean;
  readonly figureId?: string;
}

export default function ResearchChart({
  spec,
  title,
  desc,
  idPrefix,
  placement = 'inline',
  variables,
  highlight,
  compact = false,
  figureId,
}: ResearchChartProps): JSX.Element {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(700);
  const [ready, setReady] = useState(false);
  const [liveVariables, setLiveVariables] = useState<Readonly<Record<string, number>> | null>(null);
  const [liveHighlight, setLiveHighlight] = useState<readonly string[] | null>(null);
  const effectiveVariables = liveVariables ?? variables;
  useEffect(() => {
    const host = root.current?.closest('[data-figure]');
    if (host === undefined || host === null || figureId === undefined) return undefined;
    const onState = (event: Event): void => {
      const detail = (event as CustomEvent<FigureStateDetail>).detail;
      if (detail.figureId !== figureId) return;
      setLiveVariables(detail.variables);
      setLiveHighlight(
        [...host.querySelectorAll<HTMLElement>('[data-vg-key].is-lit')].map(
          (element) => element.dataset['vgKey'] ?? '',
        ),
      );
    };
    host.addEventListener(FIGURE_STATE_EVENT, onState);
    return () => {
      host.removeEventListener(FIGURE_STATE_EVENT, onState);
    };
  }, [figureId]);
  useEffect(() => {
    const element = root.current;
    if (element === null) return undefined;
    const resize = (): void => {
      const next = Math.max(320, Math.min(1600, Math.floor(element.getBoundingClientRect().width)));
      setWidth((previous) => (previous === next ? previous : next));
      setReady(true);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    const element = root.current;
    const svg = element?.querySelector<SVGSVGElement>('svg.vg-chart__svg');
    if (element === null || svg === null || svg === undefined) return undefined;
    const ctl = new Controller();
    enhanceChart(ctl, element, svg);
    return () => {
      ctl.dispose();
    };
  }, [spec, width, effectiveVariables]);
  const height = compact
    ? Math.max(280, Math.min(360, Math.round(width * 0.62)))
    : Math.max(320, Math.min(480, Math.round(width * 0.56)));
  return (
    <div
      class={`sc-chart${compact ? ' sc-chart--compact' : ''}`}
      ref={root}
      data-responsive-chart={idPrefix}
      data-chart-ready={ready ? 'true' : undefined}
    >
      <ChartView
        spec={spec}
        title={title}
        desc={desc}
        idPrefix={idPrefix}
        placement={placement}
        dimensions={{ width, height }}
        editorial
        state={{ lit: new Set(liveHighlight ?? highlight ?? []), overrides: effectiveVariables ?? null }}
      />
      <p class="cx-chart-readout" data-chart-readout role="status" aria-live="polite">
        Static plot. Its accessible description follows the figure.
      </p>
      <p class="sc-chart__hint">
        <span class="sc-chart__interactive-hint">
          Point or tap to inspect · ← → values · ↑ ↓ series · select a legend to isolate
        </span>
        <span class="sc-chart__static-hint">Scroll horizontally to inspect the full plot.</span>
      </p>
    </div>
  );
}
