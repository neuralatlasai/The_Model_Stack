import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/** Subject-specific, illustrative instruments; deliberately not quantitative charts. */
export default function HeaderInstrument({
  topic,
  page,
}: {
  readonly topic: string;
  readonly page: string;
}): JSX.Element {
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [control, setControl] = useState(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  useEffect(() => {
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  const seed = Array.from(page).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const n = (count: number): number[] => Array.from({ length: count }, (_, i) => i);
  const polar = (angle: number, r: number): [number, number] => [140 + Math.cos(angle) * r, 95 + Math.sin(angle) * r];
  const point = (x: number, y: number, r = 3): JSX.Element => <circle cx={x} cy={y} r={r} fill="currentColor" />;
  const line = (x: number, y: number, a: number, b: number): JSX.Element => <path d={`M${x} ${y}L${a} ${b}`} />;
  let artwork: JSX.Element;
  switch (topic) {
    case 'library':
      artwork = (
        <g class="hi-book">
          {n(13).map((i) => (
            <path
              class="hi-leaf"
              style={{ '--i': i }}
              d={`M140 157Q${52 + i * (6 + control)} 119 ${53 + i * (6 + control)} 37Q${94 + i * 3} 49 140 75Q${186 - i * 3} 49 ${227 - i * (6 + control)} 37Q${228 - i * (6 + control)} 119 140 157Z`}
            />
          ))}
          <path d="M140 75V157" />
        </g>
      );
      break;
    case 'papers':
      artwork = (
        <g>
          {n(5).map((i) => (
            <g class="hi-orbit" style={{ '--i': i }}>
              <ellipse
                cx="140"
                cy="95"
                rx={38 + i * 13}
                ry={20 + i * 8}
                transform={`rotate(${i * 31 + (seed % 20)} 140 95)`}
              />
              {point(178 + i * 13, 95, 3)}
            </g>
          ))}
          <path d="M128 77H147L154 84V113H128ZM147 77V85H154M134 92H147M134 99H147M134 106H143" />
        </g>
      );
      break;
    case 'systems':
      artwork = (
        <g>
          {n(6).map((i) => (
            <g
              class="hi-layer"
              style={{ '--i': i }}
              transform={`translate(0 ${i * ((expanded ? 25 : 17) + control * 5) - 48})`}
            >
              <path d="M60 91L140 55L220 91L140 127ZM60 91V97L140 133L220 97V91M140 127V133" />
              {point(140, 91, 2)}
            </g>
          ))}
        </g>
      );
      break;
    case 'labs':
      artwork = (
        <g>
          <path d="M111 28H169M121 28V72L77 145Q70 159 88 159H192Q210 159 203 145L159 72V28M96 122Q121 108 143 122T186 122" />
          {n(9).map((i) => (
            <circle
              class="hi-bubble"
              style={{ '--i': i }}
              cx={111 + ((i * 19 + seed) % 65)}
              cy={139 - (i % 3) * 21 - control * 15}
              r={3 + (i % 3)}
            />
          ))}
        </g>
      );
      break;
    case 'figures':
      artwork = (
        <g>
          <path d="M35 25V160H250M35 94H250" opacity=".3" />
          <path class="hi-trace" d="M35 126C60 126 60 52 85 52S110 135 135 135S160 38 185 38S215 118 250 66" />
          {n(6).map((i) => point(45 + i * 38, 130 - ((i * 29 + seed) % 85), 2))}
        </g>
      );
      break;
    case 'equations':
      artwork = (
        <g>
          <path d="M57 40H223M140 40V150" opacity=".2" />
          <g class="hi-pendulum">
            <path d="M140 40L140 140" />
            <circle cx="140" cy="142" r="16" />
            <circle cx="140" cy="142" r="5" fill="currentColor" />
          </g>
          <path d="M63 143Q140 195 217 143" stroke-dasharray="2 6" />
        </g>
      );
      break;
    case 'evaluation-ecosystem':
      artwork = (
        <g>
          {[27, 49, 72].map((r) => (
            <circle cx="140" cy="95" r={r} opacity=".25" />
          ))}
          {n(6).map((i) => {
            const [x, y] = polar((i * Math.PI) / 3, 72);
            return line(140, 95, x, y);
          })}
          <path d="M140 32L185 69L195 126L140 148L92 123L111 78Z" class="hi-area" />
          <g class="hi-sweep">
            <path d="M140 95L140 23" stroke-width="2" />
            {point(140, 23, 4)}
          </g>
        </g>
      );
      break;
    case 'ai-futures':
      artwork = (
        <g>
          <path d="M30 150C100 150 106 90 143 90S192 31 249 31M143 90C180 90 194 74 249 74M143 90C185 90 191 120 249 120M143 90C180 90 191 161 249 161" />
          {n(4).map((i) => (
            <circle class="hi-future" style={{ '--i': i }} cx="249" cy={[31, 74, 120, 161][i]} r="5" />
          ))}
          <circle class="hi-pulse" cx="143" cy="90" r="8" />
        </g>
      );
      break;
    case 'graph':
      artwork = (
        <g>
          {n(9).map((i) => {
            const [x, y] = polar((i * Math.PI * 2) / 9 + (seed % 31) / 20, 65);
            const [a, b] = polar(((i + 3) * Math.PI * 2) / 9 + (seed % 31) / 20, 65);
            return (
              <g>
                {line(x, y, a, b)}
                {line(x, y, 140, 95)}
                <circle class="hi-node" style={{ '--i': i }} cx={x} cy={y} r={expanded ? 7 : 4} />
              </g>
            );
          })}
          {point(140, 95, 7)}
        </g>
      );
      break;
    case 'timeline':
      artwork = (
        <g>
          <path d="M25 135C70 135 66 95 110 95S159 55 205 55H255" />
          {n(7).map((i) => (
            <g class="hi-node" style={{ '--i': i }}>
              {line(35 + i * 34, 147 - i * 15, 35 + i * 34, 116 - i * 15)}
              {point(35 + i * 34, 116 - i * 15, 4)}
            </g>
          ))}
        </g>
      );
      break;
    case 'terms':
      artwork = (
        <g>
          {n(7).map((i) => (
            <ellipse
              class="hi-petal"
              style={{ '--i': i }}
              cx="140"
              cy="71"
              rx="24"
              ry="48"
              transform={`rotate(${(i * 360) / 7 + (seed % 35)} 140 95)`}
            />
          ))}
          {point(140, 95, 6)}
        </g>
      );
      break;
    case 'compare':
      artwork = (
        <g>
          <path d="M140 48V156M112 156H168" />
          <g class="hi-balance">
            <path d="M64 65H216M78 65L54 119H102ZM202 65L178 119H226Z" />
            <path d="M54 119Q78 145 102 119M178 119Q202 145 226 119" />
          </g>
          {point(140, 65, 5)}
        </g>
      );
      break;
    case 'visual-grammar':
      artwork = (
        <g>
          {n(5).map((i) => (
            <g
              class="hi-node"
              style={{ '--i': i }}
              transform={`translate(${50 + i * 40} ${45 + (i % 2) * 65}) rotate(${i * 18})`}
            >
              <rect x="-15" y="-15" width="30" height="30" />
              <circle r="9" />
              <path d="M-22 24H22" />
            </g>
          ))}
        </g>
      );
      break;
    default:
      artwork = (
        <g>
          {n(4).map((i) => (
            <g class="hi-orbit" style={{ '--i': i }}>
              <ellipse
                cx="140"
                cy="95"
                rx={30 + i * 17}
                ry={65 - i * 8}
                transform={`rotate(${(seed % 180) + i * 43} 140 95)`}
              />
            </g>
          ))}
          {point(140, 95, 7)}
        </g>
      );
  }
  return (
    <div
      class="sh-page-visual hi"
      data-topic={topic}
      data-playing={playing}
      data-expanded={expanded}
      data-control={control}
    >
      <button
        type="button"
        class="hi-stage"
        aria-label={`Explore ${topic.replaceAll('-', ' ')} illustration. Drag or use arrow keys to change it.`}
        onPointerDown={(event) => {
          dragging.current = true;
          moved.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          moved.current = true;
          const rect = event.currentTarget.getBoundingClientRect();
          setControl(Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1)));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            setControl((v) => Math.max(-1, Math.min(1, v + (event.key === 'ArrowRight' ? 0.25 : -0.25))));
          }
        }}
        onClick={() => {
          if (!moved.current) setControl((v) => (v >= 1 ? -1 : v + 0.5));
          moved.current = false;
        }}
      >
        <svg
          viewBox="0 0 280 190"
          fill="none"
          stroke="currentColor"
          stroke-width="1.15"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <g class="hi-art" style={{ '--turn': `${control * 18}deg` }}>
            {artwork}
          </g>
        </svg>
      </button>
      <button
        type="button"
        class="hi-toggle"
        aria-label={`${playing ? 'Pause' : 'Play'} ${topic.replaceAll('-', ' ')} illustration`}
        aria-pressed={playing}
        onClick={() => {
          setPlaying((v) => !v);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          {playing ? <path d="M9 6V18M15 6V18" /> : <path d="M8 5L19 12L8 19Z" />}
        </svg>
      </button>
      <button
        type="button"
        class="hi-explore"
        aria-label={`Change ${topic.replaceAll('-', ' ')} illustration view`}
        aria-pressed={expanded}
        onClick={() => {
          setExpanded((v) => !v);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M5 9V5H9M15 5H19V9M19 15V19H15M9 19H5V15" />
        </svg>
      </button>
    </div>
  );
}
