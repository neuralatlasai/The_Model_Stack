# Visual Grammar for *The Model Stack*

**Status:** normative for every figure and rail instrument under `docs/`. Edition 1.0, 23 September 2026.
**Authority:** implements `Instruction/UI_UX.md` §10 (context rail), §16 (executable equations), §21 (lineage), §26–27 (systems and training visualisation), §53 (diagram primitives), §54 (tensor visualisation), §55 (systems trace), and §60 (accessibility). It extends `docs/CONTENT_CONTRACT.md` §8 and never overrides it. The machine-checked form of this contract is `atlas/packages/core/src/visual-spec.ts`; if this file and the schema disagree, the schema is fixed to match this file, not the other way round.

Requirements use **MUST**, **MUST NOT**, **SHOULD**, and **MAY** as normative terms.

---

## 1. Why a grammar, and why it is our job

A reader should learn one visual language and then read every page with it. So figures are **authored content**, written by the chapter authors in the same pass as the prose, not decoration added later. The renderer owns the look (typography, colour, stroke, layout); the author owns the *meaning*: which primitives, which quantities, which relation, what to notice.

The guiding rule, taken from UI_UX §90: **the visualisation moves with the argument.** A figure exists because a paragraph needs it. A rail instrument exists because the region being read has a quantity the reader should be able to *operate* (vary T, change bytes per value, switch H_kv) or a structure they should keep in view while reading.

Three things a figure MUST NOT be: an illustration of an idea that the text already states in one sentence; a chart of numbers without a source and context; a picture that is the only place a fact lives (every figure has a text equivalent).

---

## 2. Where figures come from

| Origin | How it is written | What the compiler does |
|---|---|---|
| **Authored figure** | A fenced block with info string `figure` containing YAML (§4) | Validates against the schema, checks formulas and references, numbers it, lays it out, binds rail figures to their region |
| **Concept map** | The chapter page's Mermaid `flowchart` (CONTENT_CONTRACT §3 item 6, §8) | Parses the `[Primitive]` label prefixes into a `diagram` figure and lays it out with the same primitives |
| **Tensor trace** | Fenced `text` block titled `Tensor trace` (CONTENT_CONTRACT §5) | Rendered as a `tensor-flow` visual with an interactive dimension legend |
| **Systems trace** | Fenced `text` block titled `Systems trace` | Rendered as a `systems-trace` visual (stage × latency/memory/compute/communication/failure) |

Existing tensor traces, systems traces, and concept maps stay as written; they already speak the grammar. Authored `figure` blocks add what prose and traces cannot: executable quantities, patterns, comparisons, lineage, topology, cycles.

---

## 3. Primitives

### 3.1 Node primitives (UI_UX §53)

Every node in a `diagram`, `cycle`, or `hierarchy`, and every Mermaid `[Prefix]`, uses exactly one of these kinds. The glyph is fixed across the book.

| Kind | Mermaid prefix | Means | Glyph (renderer) |
|---|---|---|---|
| `node` | `[Node]` | A generic concept or component | Hairline rectangle |
| `process` | `[Process]` | An operation that transforms inputs (GEMM, softmax, sampling, dedup) | Rectangle with a heavier left rule |
| `state` | `[State]` | A condition that persists or changes (step, phase, cache state) | Pill (fully rounded ends) |
| `tensor` | `[Tensor]` | A typed array with a shape | Rectangle with a stacked back layer; shape in mono sub-label |
| `memory` | `[Memory]` | Storage with capacity (HBM, SRAM, KV cache, host RAM) | Rectangle with horizontal banding |
| `dataset` | `[Dataset]` | A corpus, split, or data snapshot | Cylinder |
| `model` | `[Model]` | A parameterised model or checkpoint | Double-rule rectangle |
| `objective` | `[Objective]` | A loss, reward, or training target | Diamond |
| `metric` | `[Metric]` | A measured quantity (TTFT, loss, pass@k) | Rectangle with an underline tick |
| `hardware` | `[Hardware]` | A physical unit (SM, tensor core, GPU, NIC, switch) | Rectangle with corner notches |
| `flow` | `[Flow]` | A named transfer or stream (all-to-all, H2D copy) | Chevron-ended rectangle |
| `dependency` | `[Dependency]` | A required external input or precondition | Dashed rectangle |
| `branch` | `[Branch]` | A decision or fork between alternatives | Small diamond with fork |
| `feedback` | `[Feedback]` | A loop that returns information upstream | Rectangle with a return hook |
| `boundary` | `[Boundary]` | A trust, device, or process boundary | Dashed enclosure label |

### 3.2 Edge primitives

| Kind | Mermaid syntax | Means | Stroke |
|---|---|---|---|
| `flow` | `-->` | Data or control moves forward | Solid hairline, arrowhead |
| `dependency` | `-.->` | Requires / reads / is computed from | Dashed hairline |
| `feedback` | `-->` with target upstream, or `kind: feedback` | Information returns to an earlier stage | Curved return path, arrowhead |
| `emphasis` | `==>` | The argument's main path through the figure | Heavier stroke in the domain accent |

Use `emphasis` for at most one path per figure. If everything is emphasised, nothing is.

### 3.3 Groups

A `group` (diagram) draws a `boundary`: a device, a process, a trust zone, a pipeline stage. Groups MUST NOT nest.

---

## 4. The `figure` block

````markdown
```figure
id: fig-5.4
kind: calculator
title: Score-matrix bytes per layer
caption: >-
  The materialised score matrix grows with T² while every other attention
  tensor grows with T; vary T to see where it overtakes the weights.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-5.8
alt: >-
  Calculator for Eq. 5.8, M = B·H·T²·b. With B = 1, H = 32, T = 8192 and
  b = 2 bytes the score matrix occupies 4 GiB per layer per materialised copy.
spec:
  tex: M_{\text{scores}} = B\,H\,T^{2}\,b
  equation: "5.8"
  inputs:
    - { symbol: B, label: sequences, default: 1, min: 1, max: 64, scale: log2, format: integer }
    - { symbol: H, label: heads, default: 32, min: 1, max: 128, scale: log2, format: integer }
    - { symbol: T, label: sequence length, default: 8192, min: 512, max: 131072, scale: log2, format: tokens }
    - { symbol: b, label: bytes per value, default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: M, label: scores per layer, formula: B*H*T^2*b, format: bytes, emphasis: true }
```
````

### 4.1 Envelope (every kind)

| Field | Required | Rule |
|---|---|---|
| `id` | yes | `fig-<chapter>.<n>`, unique in the book, numbered in reading order within the chapter. Chapter number MUST equal the file's chapter. |
| `kind` | yes | One of the twelve kinds in §5. |
| `title` | yes | 3–120 chars. A noun phrase naming the quantity or structure, not a sentence. |
| `caption` | yes | 10–700 chars. *What to notice.* Never a restatement of the title. |
| `placement` | no | `inline` (default, reading width ≈ 760 px), `wide` (analysis width ≈ 1,100 px), or `rail` (scroll-bound instrument). |
| `anchor` | no | For `rail` figures: the H2 region slug the instrument serves (`formulation`, `mechanism`, `siblings`, …). Default: the region the block sits in. |
| `evidence` | yes | One evidence label for the figure's numbers. `EMPIRICALLY-OBSERVED` is forbidden. |
| `source` | yes | One id or a list: `P19`, `R5.13`, `DERIVED:eq-5.8`, `OD:<doc-id>`. |
| `alt` | yes | 20–1,200 chars. The text equivalent a screen reader gets. States the structure and the key values. |
| `concepts` | no | Node ids the figure illustrates (`ms.section.42.2`); used by the graph and search. |
| `context` | conditional | Required when `evidence` is `PAPER-REPORTED` or `OFFICIAL-DOCUMENTATION` and the figure shows latency, throughput, or utilisation: `hardware`, `model`, `precision`, `sequenceLength`, `ioDistribution`, `concurrency`, `runtimeVersion`, `measurementBoundary`. |
| `spec` | yes | Kind-specific body (§5). |

### 4.2 Formulas

Calculators, charts, stat panels, and memory stacks compute values from **formulas** in a small, safe language: numbers (`8192`, `1e9`), identifiers (`H_kv`, `d_h`, ASCII only, ≤ 24 chars), `+ - * / ^` (`**`, `·`, `×` accepted), parentheses, and the functions `min max abs sqrt exp ln log2 log10 ceil floor round pow clamp`. Every identifier MUST be bound by an input, a `variables` map, or (charts) `x`. The compiler rejects unknown identifiers, bad syntax, and non-finite results at default values.

Write Greek letters and primes as words (`beta`, `Tp`). Keep the formula identical to the equation it executes; if a figure uses an approximation, say so in the caption.

### 4.3 Numbers and evidence (CLAUDE.md §3 applies to figures)

- **Illustrative numbers** (a worked configuration) are `DERIVED` or `MATHEMATICALLY-DERIVED` and cite the equation (`DERIVED:eq-5.8`). The caption or alt says "illustrative configuration, not a named model".
- **Reported numbers** are `PAPER-REPORTED` / `OFFICIAL-DOCUMENTATION`, cite the exact `Pnn`/`Rch.n` key present in the chapter's `references.md`, and carry `context` when they are performance numbers.
- **Never** plot invented benchmark scores, invented hardware specifications, or vendor peak FLOP/s as application throughput. When a value is unknown, the figure shows the relation qualitatively and says `NOT-DISCLOSED` / `UNVERIFIED` in the caption, or the figure is not drawn.

---

## 5. Figure kinds

Each kind has one job. Pick the kind by the question the reader is asking.

| Kind | The reader's question | Typical placement |
|---|---|---|
| `diagram` | What connects to what, and in which direction does information flow? | inline / wide |
| `tensor-flow` | What shape does the data have at each step, and what does each step cost? | inline |
| `systems-trace` | Where do latency, memory, compute, communication, and failure live along a request or step? | inline / wide |
| `memory-stack` | What occupies memory (or FLOPs, or time), and how do the parts compare to a budget? | inline / rail |
| `calculator` | What happens to this equation's value when I change a variable? | rail |
| `stat-panel` | What is the state of the configuration being discussed? | rail |
| `lineage` | Where did this come from, and what is the current frontier? | inline |
| `cycle` | Which stages feed back into which? | inline / wide |
| `matrix` | Which pairs interact (masks, attention patterns, routing, overlap)? | inline / rail |
| `chart` | How does one quantity scale with another? | inline / wide |
| `hierarchy` | Through which physical or logical levels does work descend, at what capacity and bandwidth? | inline / rail |
| `compare` | On a stated evaluation axis, how do alternatives differ? | wide |

### 5.1 `diagram`

```yaml
spec:
  direction: LR            # LR | TB
  nodes:
    - { id: x,   kind: tensor,  label: normalised stream, sub: "[B, T, D]" }
    - { id: qkv, kind: process, label: QKV projection,    sub: "6·D² FLOPs/token" }
    - { id: s,   kind: tensor,  label: scores,            sub: "[B, H, T, T]", emphasis: true }
    - { id: hbm, kind: memory,  label: HBM,               group: dev }
  edges:
    - { from: x, to: qkv }
    - { from: qkv, to: s, kind: emphasis, label: "QKᵀ/√Dh" }
    - { from: s, to: hbm, kind: dependency, label: "B·H·T²·b bytes" }
  groups:
    - { id: dev, label: one accelerator }
```

2–40 nodes, ≤ 80 edges, ≤ 10 groups. Labels ≤ 80 chars; put shapes, byte counts, and versions in `sub` (rendered monospace). Endpoints MUST exist.

### 5.2 `tensor-flow`

```yaml
spec:
  dims: { B: sequences, T: tokens, D: model width, H: heads, Dh: head dimension }
  steps:
    - { shape: "[B, T, D]", label: normalised stream }
    - { shape: "[B, T, 3, H, Dh]", op: packed QKV projection, cost: "6·D² FLOPs/token" }
    - { shape: "[B, H, T, T]", op: "QKᵀ/√Dh", cost: "2·T·D FLOPs/token" }
    - { shape: "[B, H, T, Dh]", op: softmax · V, cost: "2·T·D FLOPs/token" }
    - { shape: "[B, T, D]", op: merge heads · W_O, cost: "2·D² FLOPs/token" }
```

Every dimension symbol used in a shape MUST appear in `dims`. Hovering a dimension highlights it in every shape (UI_UX §54).

### 5.3 `systems-trace`

```yaml
spec:
  columns: [latency, memory, compute, communication, failure]
  stages:
    - { name: cast master→operand, values: { latency: 1 pass over W, memory: "+2 B/param", failure: overflow if unscaled } }
    - { name: GEMM forward, values: { compute: tensor-core bound, memory: activations saved }, emphasis: true }
```

### 5.4 `memory-stack`

```yaml
spec:
  format: bytes
  variables: { N: 7.0e9 }
  bars:
    - label: mixed-precision Adam, per model
      segments:
        - { label: BF16 weights,   kind: tensor, formula: 2*N }
        - { label: BF16 gradients, kind: tensor, formula: 2*N }
        - { label: FP32 master,    kind: memory, formula: 4*N }
        - { label: Adam m, v,      kind: memory, formula: 8*N }
  budget: { label: illustrative 80 GiB device, formula: 80*2^30 }
```

Segments are ordered bottom-to-top. A `budget` draws a hairline across the bars. Give exactly one of `value` or `formula` per segment.

### 5.5 `calculator`

See §4. 1–8 inputs, 1–6 outputs, ≤ 6 presets. Inputs with `options` render as a segmented control; `scale: log2` sliders snap to powers of two. Outputs may reference earlier outputs. A calculator MUST execute a numbered equation of the same section (set `equation:`) unless it composes several, in which case the caption names them.

### 5.6 `stat-panel`

The AI 2040-style instrument: a monospace header, key/value rows with right-aligned values, and an optional glyph.

```yaml
spec:
  header: REFERENCE CONFIG · BF16
  variables: { L: 12, D: 768, V: 50257 }
  rows:
    - { key: layers, value: "12" }
    - { key: non-embedding params, formula: 12*L*D^2, format: params }
    - { key: embedding params, formula: V*D, format: params }
  glyph:
    type: dots          # dots | blocks
    total: 48
    filled: 12
    legend:
      - { marker: filled, label: attention params, value: "4·D²/layer" }
      - { marker: hollow, label: FFN params, value: "8·D²/layer" }
```

`dots` draws a dot matrix (filled vs hollow); `blocks` draws a proportional block glyph from `items: [{label, weight}]`.

### 5.7 `lineage`

```yaml
spec:
  entries:
    - { year: 2017, work: Transformer, cite: P01, relation: conceptual ancestor }
    - { year: 2022, work: FlashAttention, cite: P19, relation: engineering optimization, node: ms.section.27.1 }
    - { year: "2025+", work: hardware-specialised attention kernels, relation: current frontier }
```

Relations are exactly the five words of CONTENT_CONTRACT §3 item 11. Every `cite` MUST exist in the chapter's `references.md`.

### 5.8 `cycle`

```yaml
spec:
  stages:
    - { id: data, label: Data, kind: dataset }
    - { id: pre,  label: Pretrain, kind: process }
    - { id: post, label: Post-train, kind: process }
    - { id: eval, label: Evaluate, kind: metric }
    - { id: dep,  label: Deploy, kind: state }
  edges:
    - { from: data, to: pre }
    - { from: pre, to: post }
    - { from: post, to: eval }
    - { from: eval, to: dep }
    - { from: dep, to: data, kind: feedback, label: usage data }
    - { from: eval, to: pre, kind: feedback, label: ablations }
```

The lifecycle is drawn as a column with feedback arcs on the right (UI_UX §27: cycles, not a static pipeline).

### 5.9 `matrix`

```yaml
spec:
  rows: 8
  cols: 8
  pattern: causal       # causal | full | banded | block-diagonal | prefix | dilated | explicit
  rowLabel: query position i
  colLabel: key position j
  highlight: [{ row: 5, col: 2 }]
  legend: filled = admitted pair (j ≤ i); T(T+1)/2 of T² pairs
```

`banded` uses `parameter` as the window, `block-diagonal` as block size, `prefix` as prefix length, `dilated` as stride. `explicit` requires `cells` (rows × cols intensities in [0, 1]).

### 5.10 `chart`

```yaml
spec:
  type: line            # line | step | scatter | area | bar
  x: { label: sequence length T, scale: log2, format: tokens, domain: [512, 131072] }
  y: { label: bytes per layer, scale: log2, format: bytes }
  variables: { B: 1, H: 32, D: 4096, b: 2 }
  series:
    - { id: scores, label: "scores B·H·T²·b", formula: B*H*x^2*b, sample: { from: 512, to: 131072, count: 9 }, emphasis: true }
    - { id: act, label: "one [B,T,D] tensor", formula: B*x*D*b, sample: { from: 512, to: 131072, count: 9 }, dashed: true }
  annotations:
    - { x: 8192, label: "T/Dh = 64×" }
```

Series come from `points`, from `formula` + `sample`, or (bars) from `values` aligned with `categories`. Hover shows exact values; clicking a legend entry isolates a series; nothing animates (UI_UX §42).

### 5.11 `hierarchy`

```yaml
spec:
  direction: down
  levels:
    - { label: Model, kind: model }
    - { label: Operations, kind: process, note: "GEMM, softmax, norm" }
    - { label: Kernel, kind: process }
    - { label: SM, kind: hardware }
    - { label: SRAM / shared memory, kind: memory, note: on-chip, per SM }
    - { label: HBM, kind: memory, emphasis: true, note: off-chip, device-wide }
    - { label: NVLink / fabric, kind: flow }
```

Capacities, bandwidths, and latencies are optional strings; when present they MUST be sourced (a specific data sheet or paper in `references.md`) or clearly marked illustrative in the caption.

### 5.12 `compare`

```yaml
spec:
  axis: KV bytes per token at fixed d_model and layer count, decode phase
  columns:
    - { id: mha, label: MHA, node: ms.section.14.1 }
    - { id: gqa, label: GQA }
    - { id: mqa, label: MQA }
  rows:
    - { dimension: KV heads, values: { mha: H_q, gqa: "H_kv < H_q", mqa: "1" } }
    - { dimension: KV bytes/token/layer, values: { mha: "2·H_q·d_h·b", gqa: "2·H_kv·d_h·b", mqa: "2·d_h·b" } }
    - { dimension: objective, values: { mha: unchanged, gqa: unchanged, mqa: unchanged } }
```

The axis is mandatory and stated first (CLAUDE.md §3: define the evaluation axis before comparing). Rows whose values differ are emphasised by the renderer; identical rows recede. No row is a ranking.

---

## 6. The context rail

The right rail is an **instrument panel**, not a sidebar. It shows **at most three instruments** for the region crossing the reading threshold, and swaps them as the reader moves (UI_UX §10–11). Native scroll only.

Instruments come from two sources:

1. **Authored** `placement: rail` figures bound to a region by `anchor` (priority).
2. **Derived** instruments the compiler adds to fill remaining slots:

| Region | Derived instrument |
|---|---|
| Formulation, Mechanism | Equation variable inspector for the region's numbered equations |
| Siblings | Differential sibling strip |
| Failure modes | Failure-mode index |
| Observations | Evidence profile (label counts for the region) |
| References, any region with citations | Citation stack |
| Chapter pages, Scope, Why this exists | Position: prerequisites · siblings · downstream |

### 6.1 Live instruments: `states`

A rail figure may carry `states`: the instrument then stays in the rail across every listed region and **changes state as the reader scrolls**, the way the ai-2027 dashboard changes with the story's date. Values recompute and tween, bars grow or shrink, the part of the figure the prose is discussing lights up while the rest steps back, and a one-line note says what the state shows. This is the atlas's main device for making the visual move with the argument (UI_UX §10–11, §90).

```yaml
placement: rail
anchor: formulation
states:
  - { anchor: formulation, label: "T = 1K", variables: { T: 1024 }, highlight: [M], note: "At 1K tokens the scores are 192 MiB per layer." }
  - { anchor: mechanism, label: "T = 8K", variables: { T: 8192 }, highlight: [M], note: "At 8K the same line is 12 GiB: 64× for 8× the tokens." }
  - { anchor: failure-modes, label: "OOM", variables: { T: 32768, B: 8 }, highlight: [M], note: "Where 'score matrix out of memory' comes from." }
```

| Field | Rule |
|---|---|
| `anchor` | An H2 region of the same file (`formulation`, `mechanism`, …). One state per region. |
| `label` | ≤ 40 chars, shown in the instrument header (`T = 8K`, `decode`, `pre-norm`). |
| `variables` | Overrides: calculator input symbols; stat-panel / memory-stack / chart `variables`; for charts, `x` places a cursor. |
| `highlight` | Parts to light: diagram/cycle node ids (edges as `from->to`); chart series ids; stat-panel row keys; memory-stack `bar/segment` labels (or a bar label); hierarchy level labels; tensor-flow step indexes `"0"`, `"1"`…; systems-trace stage names; lineage works; compare dimensions or column ids; calculator symbols. |
| `note` | ≤ 240 chars: what the reader should see in this state, tied to the prose of that region. |

Rules: `states` only on `placement: rail`; the first state is what a reader without JavaScript sees; every state's numbers obey §4.3; states should follow the argument (the same instrument re-read at each step), not repeat it. A section SHOULD have at least one stateful instrument that spans its Formulation → Mechanism → (Failure modes or Siblings) regions.

**Authoring minimums per section file** (sections of chapters with manuscripts):

- at least **one inline or wide figure** that carries the section's central mechanism (diagram, tensor-flow, matrix, chart, hierarchy, cycle, compare, or lineage);
- at least **two rail instruments**, one of which is executable (`calculator`, `chart` with formula series, or `stat-panel`/`memory-stack` with formulas) where the section has any quantitative equation;
- no region with more than three rail instruments (authored + derived).

**Chapter pages** carry the Mermaid concept map (already required) plus a `lineage` figure built from the Lineage list, and, where the chapter describes a loop, a `cycle`.

---

## 7. Style (owned by the renderer, stated here so authors write for it)

The visual reference is the editorial grammar of ai-2027.com and *AI 2040*: an old-style serif reading column with real small caps; a restrained oxblood accent for links, note numbers, and active state; hairline rules instead of boxes; sidenotes aligned in the margin; and a monospace instrument panel in the rail with key/value rows, dot matrices, block glyphs, and dotted-leader legends. Figures follow the quiet engineering-post convention: numbered, titled, captioned, sourced, monospace labels, no gradients, no shadows, no 3D, no animation that slows reading. Domain accents mark only identifiers, emphasis edges, active states, and series.

Authors therefore: keep labels short; put numbers in `sub`, `cost`, or formulas rather than in labels; use `emphasis` once; write captions that tell the reader where to look.

---

## 8. Accessibility

- `alt` is mandatory and MUST state structure and key values in words. The renderer appends a generated description (node/edge lists, series tables) so every figure is navigable as text (UI_UX §60).
- Colour never carries meaning alone: glyphs, dash patterns, and labels do.
- Calculator controls are native `<input type="range">`/radio groups with labels and live output regions.

---

## 9. Authoring checklist (run before reporting a chapter)

1. Every section meets the §6 minimums; every figure has a unique `fig-<ch>.<n>` id in reading order.
2. `evidence`, `source`, and `alt` are present; no `EMPIRICALLY-OBSERVED`; reported performance numbers carry `context`.
3. Every formula identifier is bound; values at the defaults are finite and match the section's worked numbers.
4. Every `cite` and `source` key exists in the chapter's `references.md`; every node id exists in `docs/atlas-manifest.json`.
5. `cd atlas && npm run compile:check` reports no errors for the chapter.
