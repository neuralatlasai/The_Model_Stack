import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

export interface HeaderVisualContext {
  readonly id: string;
  readonly summary: string;
  readonly footprint: readonly number[];
}

/** Interactive topic illustrations. Geometry conveys a mechanism, never measured performance. */
export default function HeaderInstrument({
  topic,
  page,
  context,
}: {
  readonly topic: string;
  readonly page: string;
  readonly context?: HeaderVisualContext | undefined;
}): JSX.Element {
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [control, setControl] = useState(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPlaying(!preference.matches);
    const changed = (): void => {
      if (preference.matches) setPlaying(false);
    };
    preference.addEventListener('change', changed);
    return () => {
      preference.removeEventListener('change', changed);
    };
  }, []);
  const n = (count: number): number[] => Array.from({ length: count }, (_, i) => i);
  const active = (count: number): number => Math.min(count - 1, Math.floor(((control + 1) / 2) * count));
  const dot = (x: number, y: number, accent = false, r = 4): JSX.Element => (
    <circle class={accent ? 'hi-accent hi-solid' : 'hi-solid'} cx={x} cy={y} r={r} />
  );
  const description: Record<string, string> = {
    library: 'An open book; change the spread of its pages.',
    papers: 'Documents connect to citation trails; select a trail.',
    systems: 'Separated implementation layers; change their spacing.',
    labs: 'A research vessel; change the illustrated fluid boundary.',
    figures: 'An analytic waveform; change its amplitude.',
    equations: 'A parabola and its tangent; move the tangent point.',
    'evaluation-ecosystem': 'Parallel test lanes cross explicit gates; select a lane.',
    'ai-futures': 'A shared path branches into possible futures; select a branch.',
    graph: 'A directed acyclic dependency motif; select a prerequisite path.',
    timeline: 'An ordered event spine; select a milestone.',
    terms: 'Three index keys connect to a shared definition boundary; select a key.',
    compare: 'Two alternatives share a balance; change its angle.',
    'visual-grammar': 'Tensor, flow and metric primitives share a visual language.',
    evidence: 'Evidence passes an admission boundary into distinct outcome states.',
  };
  let artwork: JSX.Element;
  switch (topic) {
    case 'library':
      artwork = (
        <g>
          {n(7).map((i) => {
            const left = 32 + i * (11 + control * 1.6);
            return (
              <g class="hi-sheet" style={{ '--i': i }}>
                <path d={`M140 155C${left + 20} 132 ${left} 94 ${left} 34C${left + 36} 40 118 59 140 82Z`} />
                <path
                  d={`M140 155C${260 - left} 132 ${280 - left} 94 ${280 - left} 34C${244 - left} 40 162 59 140 82Z`}
                />
              </g>
            );
          })}
          <path class="hi-accent" d="M140 82V155" />
        </g>
      );
      break;
    case 'papers':
      artwork = (
        <g>
          {n(3).map((i) => (
            <path
              class={i === active(3) ? 'hi-accent hi-signal' : 'hi-muted'}
              d={`M${119 + i * 25} ${61 + i * 18}C195 ${61 + i * 18} 185 ${44 + i * 43} 232 ${44 + i * 43}`}
            />
          ))}
          {n(3).map((i) => (
            <g transform={`translate(${53 + i * (25 + control * 3)} ${33 + i * 14})`}>
              <path class="hi-paper" d="M0 0H53L66 13V89H0ZM53 0V13H66" />
              <path class="hi-muted" d="M13 30H48M13 43H48M13 56H38M13 69H29" />
            </g>
          ))}
          {n(3).map((i) => (
            <g>{dot(232, 44 + i * 43, i === active(3), 4.5)}</g>
          ))}
        </g>
      );
      break;
    case 'systems': {
      const spacing = 20 + control * 4 + (expanded ? 3 : 0);
      artwork = (
        <g>
          {n(4).map((i) => (
            <g transform={`translate(0 ${(i - 1.5) * spacing - 4})`}>
              <path class="hi-layer-face" d="M48 93L140 55L232 93L140 131Z" />
              <path class={i === active(4) ? 'hi-accent' : undefined} d="M48 93V99L140 137L232 99V93M140 131V137" />
              {dot(140, 93, i === active(4), 3)}
            </g>
          ))}
        </g>
      );
      break;
    }
    case 'labs': {
      const level = 119 - control * 12;
      const left = 122 - ((level - 71) * 44) / 73;
      artwork = (
        <g>
          <path d="M112 28H168M122 28V71L78 144Q70 158 87 158H193Q210 158 202 144L158 71V28" />
          <path
            class="hi-fluid"
            d={`M${left} ${level}Q118 ${level - 8} 140 ${level}T${280 - left} ${level}L202 144Q210 158 193 158H87Q70 158 78 144Z`}
          />
          {[
            [116, 139],
            [140, 128],
            [164, 142],
          ].map(([x, y], i) => (
            <circle class="hi-lab-bubble" style={{ '--i': i }} cx={x} cy={y} r={3.5} />
          ))}
          <path class="hi-muted" d="M129 39V69M87 149H192" />
        </g>
      );
      break;
    }
    case 'figures': {
      const value = (x: number): number => 91 - (32 + control * 12) * Math.sin(((x - 38) / 204) * Math.PI * 2);
      artwork = (
        <g>
          <path class="hi-rule" d="M38 30V151H246" />
          {[89, 140, 191].map((x) => (
            <path class="hi-rule" d={`M${x} ${value(x)}V151`} />
          ))}
          <path
            class="hi-accent hi-signal"
            d={n(65)
              .map((i) => `${i ? 'L' : 'M'}${38 + (i * 204) / 64} ${value(38 + (i * 204) / 64)}`)
              .join('')}
          />
          {[89, 140, 191].map((x) => dot(x, value(x), false, 3.5))}
        </g>
      );
      break;
    }
    case 'equations': {
      const x = 140 + control * 55;
      const y = 43 + 0.006 * (x - 140) ** 2;
      const slope = 0.012 * (x - 140);
      artwork = (
        <g>
          <path class="hi-rule" d="M38 30V151H246" />
          <path
            d={n(49)
              .map((i) => `${i ? 'L' : 'M'}${40 + (i * 200) / 48} ${43 + 0.006 * (40 + (i * 200) / 48 - 140) ** 2}`)
              .join('')}
          />
          <path class="hi-rule" d={`M${x} ${y}V151`} />
          <path class="hi-accent" d={`M${x - 43} ${y - 43 * slope}L${x + 43} ${y + 43 * slope}`} />
          {dot(x, y, true, 4.5)}
        </g>
      );
      break;
    }
    case 'evaluation-ecosystem':
      artwork = (
        <g>
          {n(4).map((i) => {
            const y = 36 + i * 34;
            return (
              <g>
                <path class="hi-rule" d={`M58 ${y}H230`} />
                <path class={i === active(4) ? 'hi-accent hi-signal' : undefined} d={`M58 ${y}H230`} />
                <path class="hi-paper" d={`M43 ${y - 5}H53V${y + 5}H43Z`} />
                <path class="hi-gate" d={`M127 ${y - 10}V${y + 10}M141 ${y - 10}V${y + 10}`} />
                <circle class={i === active(4) ? 'hi-accent' : undefined} cx="230" cy={y} r="5" />
              </g>
            );
          })}
        </g>
      );
      break;
    case 'ai-futures':
      artwork = (
        <g>
          <path d="M30 145C90 145 105 86 143 86" />
          {[31, 69, 112, 154].map((y, i) => (
            <g>
              <path
                class={i === active(4) ? 'hi-accent hi-signal' : undefined}
                d={`M143 86C182 86 194 ${y} 249 ${y}`}
              />
              <circle class={i === active(4) ? 'hi-accent' : undefined} cx="249" cy={y} r="5" />
            </g>
          ))}
          {dot(143, 86, true, 4.5)}
        </g>
      );
      break;
    case 'graph': {
      const vertices: [number, number][] = [
        [42, 89],
        [106, 40],
        [106, 138],
        [178, 40],
        [178, 104],
        [240, 89],
      ];
      const edges: [number, number][] = [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 4],
        [3, 5],
        [4, 5],
        [1, 4],
      ];
      const paths: number[][] = [
        [0, 1, 3, 5],
        [0, 2, 4, 5],
        [0, 1, 4, 5],
      ];
      const selected = paths[active(3)] ?? paths[0] ?? [];
      artwork = (
        <g>
          {edges.map(([a, b]) => {
            const from = vertices[a];
            const to = vertices[b];
            if (!from || !to) return null;
            const [x, y] = from;
            const [u, v] = to;
            const sourceIndex = selected.indexOf(a);
            const highlighted = sourceIndex >= 0 && selected[sourceIndex + 1] === b;
            return (
              <path
                class={highlighted ? 'hi-accent hi-signal' : 'hi-muted'}
                data-edge-from={a}
                data-edge-to={b}
                data-highlighted={highlighted}
                d={`M${x + 7} ${y}C${(x + u) / 2} ${y} ${(x + u) / 2} ${v} ${u - 9} ${v}M${u - 13} ${v - 3}L${u - 9} ${v}L${u - 13} ${v + 3}`}
              />
            );
          })}
          {vertices.map(([x, y], i) => (
            <circle
              class={selected.includes(i) ? 'hi-accent hi-node-face' : 'hi-node-face'}
              data-node={i}
              data-highlighted={selected.includes(i)}
              cx={x}
              cy={y}
              r="6"
            />
          ))}
        </g>
      );
      break;
    }
    case 'timeline':
      artwork = (
        <g>
          <path d="M34 92H249M242 88L249 92L242 96" />
          <path class="hi-accent hi-signal" d="M34 92H249" />
          {n(7).map((i) => (
            <g>
              <path class="hi-muted" d={`M${42 + i * 32} 92V${i % 2 ? 131 : 52}`} />
              {dot(42 + i * 32, 92, i === active(7), i === active(7) ? 5 : 3)}
              <path d={`M${35 + i * 32} ${i % 2 ? 131 : 52}H${49 + i * 32}`} />
            </g>
          ))}
        </g>
      );
      break;
    case 'terms':
      artwork = (
        <g>
          <path class="hi-rule" d="M151 31V151" />
          {n(3).map((i) => {
            const y = 43 + i * 49;
            return (
              <g>
                <circle class={i === active(3) ? 'hi-accent' : undefined} cx="56" cy={y} r="11" />
                <path
                  class={i === active(3) ? 'hi-accent hi-signal' : undefined}
                  d={`M67 ${y}H103V${y + 8}H112V${y}H130Q151 ${y} 151 91H213`}
                />
              </g>
            );
          })}
          <path d="M234 51Q218 51 218 67V77Q218 91 207 91Q218 91 218 105V115Q218 131 234 131" />
        </g>
      );
      break;
    case 'compare':
      artwork = (
        <g>
          <path d="M140 41V154M113 154H167" />
          <g transform={`rotate(${control * 9} 140 63)`}>
            <path d="M58 63H222M76 63L53 113H99ZM204 63L181 113H227Z" />
            <path class="hi-accent" d="M53 113Q76 137 99 113M181 113Q204 137 227 113" />
          </g>
          {dot(140, 63, true, 4.5)}
        </g>
      );
      break;
    case 'visual-grammar':
      artwork = (
        <g>
          <path
            class={active(3) === 0 ? 'hi-accent' : undefined}
            d="M35 69L68 50L101 69L68 88ZM35 69V108L68 127L101 108V69M68 88V127"
          />
          <path
            class={active(3) === 1 ? 'hi-accent hi-signal' : undefined}
            d={`M116 91H${159 + control * 10}M${151 + control * 10} 84L${159 + control * 10} 91L${151 + control * 10} 98`}
          />
          <path class="hi-rule" d="M180 45V132H250" />
          <path class={active(3) === 2 ? 'hi-accent' : undefined} d="M188 120L204 97L218 108L241 64" />
          {dot(241, 64, active(3) === 2, 4)}
        </g>
      );
      break;
    default:
      artwork = (
        <g>
          {n(3).map((i) => (
            <path
              d={`M${42 + i * 26} ${35 + i * 10}H${62 + i * 26}L${70 + i * 26} ${43 + i * 10}V${88 + i * 10}H${42 + i * 26}Z`}
            />
          ))}
          <path d="M122 91H153M147 83V99M159 83V99" />
          {[43, 91, 139].map((y, i) => (
            <g>
              <path
                class={i === active(3) ? 'hi-accent hi-signal' : undefined}
                d={`M159 91C185 91 184 ${y} 222 ${y}`}
              />
              <circle cx="231" cy={y} r="9" />
              {i === 0 ? (
                <path d={`M227 ${y}L230 ${y + 3}L236 ${y - 4}`} />
              ) : i === 1 ? (
                <path d={`M227 ${y}H235`} />
              ) : (
                dot(231, y, false, 2)
              )}
            </g>
          ))}
        </g>
      );
  }
  const title = topic.replaceAll('-', ' ');
  const identityBits =
    context === undefined
      ? []
      : Array.from(new TextEncoder().encode(context.id)).flatMap((byte) =>
          Array.from({ length: 8 }, (_, bit) => (byte >> (7 - bit)) & 1),
        );
  const identityPath = identityBits
    .map(
      (bit, i) =>
        `${i === 0 ? 'M' : 'H'}${28 + (i * 224) / identityBits.length}${i === 0 ? ' ' : 'V'}${174 + bit * 4}H${28 + ((i + 1) * 224) / identityBits.length}`,
    )
    .join('');
  return (
    <div
      class="sh-page-visual hi"
      data-instrument="atlas"
      data-topic={topic}
      data-page={page}
      data-object-id={context?.id}
      data-playing={playing}
      data-expanded={expanded}
      data-control={control}
    >
      <button
        type="button"
        class="hi-stage"
        aria-label={`Explore ${title} illustration. ${description[topic] ?? description['evidence']} ${context === undefined ? '' : `Object ${context.id}. ${context.summary} Chapter counts from Part I through Part XI: ${context.footprint.join(', ')}. The lower seal directly encodes its canonical identifier, not a metric.`} Drag or use arrow keys; Home resets.`}
        onPointerDown={(event) => {
          dragging.current = true;
          moved.current = false;
          start.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging.current || Math.abs(event.clientX - start.current.x) < 5) return;
          moved.current = true;
          const rect = event.currentTarget.getBoundingClientRect();
          setControl(Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1)));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
          moved.current = true;
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            setControl((v) => Math.max(-1, Math.min(1, v + (event.key === 'ArrowRight' ? 0.25 : -0.25))));
          } else if (event.key === 'Home') {
            event.preventDefault();
            setControl(0);
          }
        }}
        onClick={() => {
          if (!moved.current) setControl((v) => (v >= 1 ? -1 : v + 0.5));
          moved.current = false;
        }}
      >
        <svg
          viewBox="0 0 280 180"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <g class="hi-art">
            {context === undefined ? artwork : <g transform="translate(14 2) scale(.9 .82)">{artwork}</g>}
            {context !== undefined && (
              <g class="hi-object-footprint">
                <title>{context.summary}</title>
                {context.footprint.map((count, i) => (
                  <path
                    data-part={i + 1}
                    data-chapter-count={count}
                    class={count > 0 ? 'hi-accent' : 'hi-rule'}
                    d={`M${35 + i * 21} 158V${158 - Math.max(0.5, count * 2.5)}`}
                  />
                ))}
                <path class="hi-identity-seal" data-identity-seal={context.id} d={identityPath}>
                  <title>{`Canonical identifier ${context.id}, encoded directly as UTF-8 bits; not a performance metric.`}</title>
                </path>
              </g>
            )}
          </g>
        </svg>
      </button>
      <div class="hi-controls">
        <button
          type="button"
          class="hi-reset"
          aria-label={`Reset ${title} illustration`}
          onClick={() => {
            setControl(0);
            setExpanded(false);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 11A7 7 0 1 1 7 17M5 5V11H11" />
          </svg>
        </button>
        <button
          type="button"
          class="hi-toggle"
          aria-label={`${playing ? 'Pause' : 'Play'} ${title} illustration`}
          aria-pressed={playing}
          onClick={() => {
            setPlaying((v) => !v);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? <path d="M9 6V18M15 6V18" /> : <path d="M8 5L19 12L8 19Z" />}
          </svg>
        </button>
        <button
          type="button"
          class="hi-explore"
          aria-label={`Change ${title} illustration view`}
          aria-pressed={expanded}
          onClick={() => {
            setExpanded((v) => !v);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 9V5H9M15 5H19V9M19 15V19H15M9 19H5V15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
