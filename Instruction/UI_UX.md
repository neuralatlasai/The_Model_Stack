# Product, Information Architecture, UI/UX and Interaction Specification

### Design brief for the principal UI/UX designer and frontend architect

---

# 0. THE PRODUCT WE ARE ACTUALLY BUILDING

This is not a blog.

This is not a documentation portal.

This is not a collection of articles.

This is not a conventional online book.

This is not an academic-paper repository.

This is not a dashboard.

It should be designed as a new category:

**an interactive technical research atlas that combines the continuity of a book, the recursive structure of a knowledge graph, the evidence density of a research paper, and the exploratory behavior of a scientific instrument.**

A user should be able to enter through a chapter and read linearly for forty minutes, enter through a paper and recursively discover its methodological ancestry, enter through a technical concept and descend through every layer of its implementation, or enter through a system such as LLM training and visually traverse:

`Training → Data → Pretraining → Post-training → RL → Distillation → Optimization → Distributed Systems → Hardware → Kernels → Inference → Serving → Evaluation`

without feeling that they have left the same intellectual environment.

The principal design objective is therefore:

> **Turn a very large body of state-of-the-art AI research into a coherent spatial and cognitive system.**

The reference AI 2027 is valuable because it demonstrates that extremely long technical narratives can remain engaging when text, timeline, data, diagrams, supplementary explanations and scroll state are coordinated. AI 2027 also exposes forecasts, supplemental research, multiple media formats and a branching ending instead of treating the page as static prose.

Our product must take that idea much further.

AI 2027 is fundamentally a narrative with supporting data.

**Research Atlas must be a navigable research system with narrative as one of several representations.**

---

# 1. DESIGN PRINCIPLE: INFORMATION ARCHITECTURE BEFORE DECORATION

Do not begin by designing cards, buttons, gradients, illustrations or a landing-page hero.

Begin with the topology of the knowledge.

The UI must expose five simultaneous relationships for every research object:

1. **Where am I?**
2. **What does this depend on?**
3. **What sits beside it?**
4. **What follows from it?**
5. **What evidence supports it?**

Every concept must therefore exist within a graph rather than merely inside a page.

Consider:

```text
LLM Training
│
├── Data
│   ├── Acquisition
│   ├── Deduplication
│   ├── Filtering
│   ├── Mixture construction
│   ├── Curriculum
│   └── Synthetic data
│
├── Pretraining
│   ├── Objective
│   ├── Tokenization
│   ├── Optimization
│   ├── Scaling laws
│   ├── Parallelism
│   └── Checkpointing
│
├── Post-training
│   ├── SFT
│   ├── Preference optimization
│   ├── RL
│   ├── Verifiable rewards
│   ├── Process supervision
│   └── Distillation
│
└── Runtime
    ├── Kernels
    ├── Quantization
    ├── KV cache
    ├── Scheduling
    ├── Speculative decoding
    ├── Parallel serving
    └── Distributed inference
```

These are not simply headings.

Each node is an addressable research object with:

```text
parent
children
siblings
prerequisites
dependents
related concepts
papers
implementations
benchmarks
systems
labs
authors
equations
algorithms
datasets
experiments
failure modes
open questions
historical lineage
```

The design must make these relationships perceptible without dumping all of them into the reader's visual field simultaneously.

This requirement should drive the entire UX.

---

# 2. CORE EXPERIENCE

The experience should feel like reading a beautifully typeset research monograph while operating a technical observatory.

The page must remain calm when the information underneath it is extremely complex.

The visual identity should communicate:

**precision
research
depth
seriousness
technical craft
intellectual curiosity
continuity**

Avoid the visual language currently overused in AI websites:

```text
neon gradients
purple-blue blobs
glassmorphism
oversized rounded cards
generic AI illustrations
floating particles
animated neural networks
huge marketing typography
dashboard grids everywhere
excessive badges
3D decoration
```

Nothing should look like an AI startup landing page.

The page should instead feel closer to a synthesis of:

```text
scientific monograph
research notebook
technical journal
knowledge graph
interactive paper
laboratory instrument
```

---

# 3. VISUAL DNA TO RETAIN FROM THE REFERENCE

Do not clone AI 2027.

Retain the design philosophy behind it.

The reference uses a restrained editorial presentation in which the narrative receives the majority of visual attention while supporting information remains adjacent rather than replacing the narrative. Its main page integrates dates, long-form sections, external evidence, figures, explanatory subsections and later a user-selectable branch.

We should preserve five characteristics.

### 3.1 Editorial seriousness

The text must visually dominate.

Typography is an interface.

Paragraph rhythm, mathematical layout, figures and section boundaries matter more than decorative UI.

### 3.2 Persistent contextual visualization

AI 2027's own project announcement describes a scenario-statistics visualization that changes automatically as the reader scrolls.

Our equivalent should be substantially more capable.

The contextual rail should continuously respond to the research section currently in the viewport.

### 3.3 Progressive disclosure

The reader should not be forced to consume every derivation, implementation detail, paper criticism or historical note.

The page begins coherent and readable.

Depth appears on demand.

### 3.4 Strong chronology and progression

Even nonchronological topics need intellectual progression.

For example:

```text
Problem
   ↓
Primitive mechanism
   ↓
Mathematical formulation
   ↓
Algorithm
   ↓
Implementation
   ↓
Scaling behavior
   ↓
Observed failure
   ↓
Modern improvement
```

The reader should continually know what changed and why the next concept exists.

### 3.5 Branching knowledge

AI 2027 explicitly presents alternative branches.

For Research Atlas, branching becomes a general mechanism:

```text
Dense Attention
├── MHA
├── MQA
├── GQA
├── MLA
└── Sparse / Hybrid Attention
```

A reader should be able to branch temporarily, inspect an alternative, and return to the main conceptual path without losing position.

---

# 4. THE PRIMARY DESKTOP FRAME

At ≥1440 px, use a deliberate three-region architecture.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         GLOBAL NAVIGATION                                    │
├───────────────┬──────────────────────────────────────┬───────────────────────┤
│               │                                      │                       │
│ KNOWLEDGE     │            RESEARCH TEXT             │ CONTEXT / RESEARCH    │
│ TREE          │                                      │ RAIL                  │
│               │                                      │                       │
│ 260–300 px    │             720–860 px               │ 300–380 px            │
│               │                                      │                       │
│               │                                      │                       │
└───────────────┴──────────────────────────────────────┴───────────────────────┘
```

Do not treat these as three independent panels.

They are three projections of the same research state.

When the central reader moves from:

`Attention → KV Cache → PagedAttention`

the left tree should update its active position and the right rail should transition from mathematical attention primitives to memory-layout/runtime information.

The browser should feel aware of what the user is currently reasoning about.

---

# 5. LEFT RAIL — THE RECURSIVE KNOWLEDGE TREE

This is one of the most important pieces of the product.

It must not behave like a documentation sidebar containing a flat list of links.

It represents the recursive topology of the field.

Example:

```text
Inference
│
├─ Model execution
│  ├─ Prefill
│  ├─ Decode
│  └─ Forward-pass anatomy
│
├─ Memory
│  ├─ Weights
│  ├─ Activations
│  └─ KV cache
│     ├─ Layout
│     ├─ Paging
│     ├─ Compression
│     ├─ Quantization
│     └─ Eviction
│
├─ Scheduling
│  ├─ Static batching
│  ├─ Continuous batching
│  ├─ Chunked prefill
│  └─ Request scheduling
│
└─ Decoding
   ├─ Greedy
   ├─ Sampling
   ├─ Speculative
   └─ Multi-token prediction
```

Requirements:

* recursive depth must be visually obvious;
* active branch expands automatically;
* unrelated branches collapse softly;
* current page receives the strongest emphasis;
* ancestors remain visible;
* siblings remain one interaction away;
* clicking a caret expands without navigation;
* clicking the label navigates;
* keyboard traversal must work;
* current reading progress should be visible within the node;
* deeply nested concepts should not generate visual chaos.

A subtle vertical lineage line is preferred over nested boxes.

Do not put every node in a card.

Tree indentation itself should encode hierarchy.

---

# 6. CENTER COLUMN — THE RESEARCH READER

Target approximately 70–85 characters per line for prose.

The main body should be exceptionally quiet.

The content hierarchy should be much richer than conventional Markdown.

We need first-class renderers for at least:

```text
Narrative prose
Definition
Claim
Assumption
Observation
Theorem / proposition
Equation
Derivation
Algorithm
Pseudo-code
Code
Diagram
Architecture
Experiment
Benchmark
Ablation
Dataset
Example
Counterexample
Failure mode
Implementation note
Systems note
Research note
Historical note
Open question
Paper evidence
Author quote
Caveat
Warning
Further reading
```

Do not render them all as colored callout boxes.

That destroys information hierarchy.

Each object should have its own typographic grammar.

---

# 7. CONTENT OBJECT MODEL

The design should assume structured content from day one.

A research node should conceptually support:

```yaml
id: paged-attention
title: PagedAttention

parent:
  - kv-cache-management

siblings:
  - static-kv-allocation
  - kv-cache-offloading
  - kv-cache-compression

prerequisites:
  - transformer-decoding
  - kv-cache
  - virtual-memory

downstream:
  - continuous-batching
  - prefix-caching

type:
  - systems
  - inference

papers: []
implementations: []
benchmarks: []
equations: []
figures: []
authors: []
labs: []

evidence:
  strength:
  sources:
  reproduced:

status:
  mature:
  disputed:
  emerging:

updated_at:
```

The frontend must be designed around this semantic structure rather than extracting relationships from arbitrary HTML later.

---

# 8. PAGE ANATOMY

A technical chapter should follow this general rhythm.

```text
CHAPTER IDENTITY

One-sentence thesis

Concept map

Why this exists

Problem

Intuition

Formalization

Mechanism

Algorithm

Implementation

Systems behavior

Empirical evidence

Ablations

Failure modes

Alternatives

Current frontier

Open problems

Connections

References
```

Not every chapter requires every section.

The important requirement is consistency of reasoning, not forced template conformity.

---

# 9. CHAPTER HEADER

Do not create a giant marketing hero.

The chapter header should be compact and research-oriented.

Example:

```text
INFERENCE / MEMORY SYSTEMS / 07

KV Cache

The runtime memory substrate that converts autoregressive
decoding from repeated recomputation into incremental execution.

12 concepts · 31 papers · 8 implementations · updated Sep 2026
```

Below it:

```text
[ Read ] [ Map ] [ Papers ] [ Implementations ] [ Compare ]
```

Then immediately enter the content.

Do not waste the first viewport.

---

# 10. RIGHT RAIL — CONTEXTUAL RESEARCH INSTRUMENT

This is where we extend AI 2027's scroll-reactive side visualization into a general research mechanism.

The rail changes according to the section currently being read.

It should contain a maximum of two or three active instruments at any one moment.

Possible instruments:

```text
Concept map
Equation variable inspector
Architecture fragment
Training-stage indicator
Paper lineage
Benchmark plot
Hardware hierarchy
Memory footprint
Compute decomposition
Model comparison
Citation stack
Experiment state
Implementation stack
Glossary
```

Example.

When reading:

`Attention → KV Cache`

the rail could show:

```text
Per-layer KV memory
        2 × L × H_kv × D_h × T × bytes

L      layers
H_kv   KV heads
D_h    head dimension
T      sequence length
```

Hovering `H_kv` in the equation highlights its corresponding representation in the diagram.

When the reader scrolls into GQA, the rail updates:

```text
MHA       Hq = Hkv
GQA       Hkv < Hq
MQA       Hkv = 1
```

Now the visualization explains why memory changes.

This synchronization is critical.

---

# 11. SCROLL AS A RESEARCH CONTROL SIGNAL

Do not use scrolling only to move vertically.

Use it as a state signal.

Each major semantic section receives a stable identifier.

As sections cross the reading threshold:

```text
activeSection = section.id
```

the application updates:

```text
left-tree selection
right-rail visualization
URL hash
chapter progress
concept minimap
equation context
reference context
```

Do not use flashy scroll-jacking.

Native scroll physics must remain untouched.

No forced snapping.

No artificial full-screen storytelling transitions.

Scrolling remains a reading action; the environment simply responds intelligently.

---

# 12. RESEARCH MINIMAP

For long technical chapters, introduce a vertical semantic minimap.

It should not merely represent page percentage.

Instead encode content topology.

Example:

```text
│ Problem
│ Intuition
│
█ Formulation
│
│ Algorithm
├ Implementation
│
● Benchmark
│
│ Limitations
│ Open Problems
```

Special markers can identify:

```text
equations
figures
experiments
papers
code
open questions
```

Clicking a marker jumps to the exact semantic location.

---

# 13. CONCEPT GRAPH MODE

Every chapter needs a `Map` mode.

Do not generate a giant generic force-directed graph.

Those become unusable rapidly.

Use a constrained semantic graph.

Central node:

```text
PagedAttention
```

Left:

```text
PREREQUISITES
KV cache
Virtual memory
Autoregressive decoding
```

Horizontal:

```text
SIBLINGS
Static allocation
Cache offload
Cache compression
```

Right:

```text
ENABLES
Continuous batching
Higher utilization
Long-context serving
```

Bottom:

```text
IMPLEMENTATIONS
vLLM
TensorRT-LLM
SGLang
...
```

Nodes expand recursively only when requested.

Graph navigation should behave like spatial browsing through research.

---

# 14. SIBLING EXPLORATION

This is fundamental.

When the user is studying one mechanism, they should immediately see alternatives.

Example:

```text
Preference Optimization

       ┌─ PPO
       ├─ DPO
       ├─ IPO
       ├─ KTO
       ├─ GRPO
       └─ Verifiable-reward RL
```

The UI should answer:

```text
Why does this sibling exist?
What assumption changed?
What objective changed?
What problem did it solve?
What new failure mode did it introduce?
```

Hovering a sibling should show a short differential explanation rather than a generic definition.

For example:

```text
DPO
────────────────────────────────
Removes the explicit online RL loop
and learns directly from preference pairs.

Changed primitive:
policy optimization → classification-like objective
```

That is far more useful than another link.

---

# 15. COMPARE MODE

Any compatible research objects should support comparison.

Examples:

```text
MHA vs GQA vs MQA vs MLA

PPO vs DPO vs GRPO

Tensor Parallel vs Pipeline Parallel vs Expert Parallel

vLLM vs SGLang vs TensorRT-LLM

BF16 vs FP8 vs FP4

RAG vs Long Context vs External Memory
```

Comparison is not a table pasted into an article.

It should be a dedicated research mode.

Rows are evaluation dimensions.

For inference systems:

```text
Architecture
Scheduler
KV management
Prefix caching
Parallelism
Quantization
Structured output
Speculative decoding
Distributed execution
Hardware targets
TTFT characteristics
TPOT characteristics
Operational complexity
```

Differences should receive stronger visual emphasis than identical fields.

---

# 16. EQUATIONS

Mathematics is not a foreign object pasted into prose.

It should be interactive.

Example:

$$
M_{KV}
=
2 L T H_{KV} D_h b
$$

Hover or tap a term:

```text
T
Sequence length
Shape contribution: linear
Increasing T from 32K → 128K produces 4× KV memory.
```

Where useful, provide:

```text
[derive]
[inspect dimensions]
[example]
[implementation]
```

The derivation expands inline.

Numerical examples should be executable where feasible.

Variables can be adjusted in the contextual rail.

The result updates immediately.

---

# 17. ALGORITHMS

Pseudo-code should be treated as an intellectual representation, not just monospaced text.

Example structure:

```text
Algorithm 4 — Continuous Batching

INPUT
  waiting requests Q
  active sequences A
  token budget B

1   admit(Q, A, B)
2   while A ≠ ∅
3       batch ← schedule(A)
4       logits ← model(batch)
5       update_cache(batch)
6       emit_tokens(batch)
7       remove_finished(A)
8       admit(Q, A, B)
```

Requirements:

* line numbers;
* referenced lines can be highlighted from prose;
* variable definitions;
* complexity metadata;
* implementation link;
* expandable real-code equivalent.

---

# 18. CODE

Code should support three conceptual levels.

```text
Pseudo-code
    ↓
Reference implementation
    ↓
Production implementation
```

Example:

```text
Attention equation
    ↓
PyTorch implementation
    ↓
FlashAttention kernel
```

The user must understand how mathematical representation changes as it descends toward hardware.

Where applicable, illustrate:

```text
Algorithm
→ tensor shapes
→ operation graph
→ kernel
→ memory traffic
→ GPU execution
```

This is particularly important for systems-oriented research.

---

# 19. PAPER OBJECTS

Papers should not appear merely as citations.

Every important paper becomes a structured research object.

Hovering a citation should show:

```text
FlashAttention
Dao et al., 2022

Contribution
IO-aware exact attention.

Key mechanism
Tiling Q/K/V through SRAM to reduce HBM traffic.

Evidence
Wall-clock improvements across representative attention workloads.

[Open paper] [Research node] [Methods] [Implementations]
```

Clicking should not necessarily navigate away.

Default behavior should open a side inspector.

The reader remains anchored to the paragraph.

---

# 20. CLAIM-LEVEL PROVENANCE

Citations must attach to claims rather than merely paragraphs.

Every important technical statement should be capable of exposing:

```text
source
publication
year
evidence type
benchmark
scope
reproduction status
confidence
```

Potential indicators:

```text
OFFICIAL
PAPER
REPRODUCED
EMPIRICAL
DERIVED
ASSUMPTION
DISPUTED
```

Do not produce a screen full of badges.

Use them only when provenance materially matters.

---

# 21. RESEARCH LINEAGE

For important ideas, show how the concept evolved.

Example:

```text
2017  Transformer
        │
2019  Transformer-XL
        │
2022  FlashAttention
        │
2023  FlashAttention-2
        │
2024  FlashAttention-3
        │
2025+ Hardware-specialized attention
```

Lineage should distinguish:

```text
conceptual ancestor
engineering optimization
alternative branch
superseded approach
current frontier
```

This is more valuable than a simple chronological list.

---

# 22. LAB VIEW

Research can also be navigated institutionally.

A lab page is not company marketing.

Example:

```text
Anthropic
OpenAI
Google DeepMind
Meta AI
DeepSeek
Qwen
Z.ai
NVIDIA
Microsoft Research
Stanford
Berkeley
...
```

Each lab node can expose:

```text
papers
models
technical reports
systems
benchmarks
research themes
authors
research lineage
```

This produces another projection of the same knowledge graph.

---

# 23. AUTHOR VIEW

Author objects should answer:

```text
What ideas has this researcher contributed to?
What papers connect those ideas?
Which research threads recur?
Which concepts were subsequently extended?
```

Do not turn this into LinkedIn.

This is intellectual lineage, not profile networking.

---

# 24. BENCHMARK VIEW

Benchmarks need first-class pages.

A benchmark page should explain:

```text
what capability is measured
task construction
metric
dataset
contamination risks
evaluation protocol
known limitations
leaderboard results
papers using it
whether comparisons are actually comparable
```

The design should make benchmark comparability explicit.

A number without methodology is not evidence.

---

# 25. DATASET VIEW

Dataset nodes should include:

```text
source
size
language/domain distribution
license
deduplication
filtering
quality signals
synthetic proportion
contamination considerations
usage
known models trained on it
```

Large dataset relationships can be represented as mixture diagrams.

---

# 26. HARDWARE / SYSTEMS VISUALIZATION

For hardware topics, the visual language must shift from conceptual graphs toward execution topology.

Example:

```text
Model
↓
Operations
↓
Kernel
↓
SM
↓
Tensor Core
↓
SRAM
↓
HBM
↓
NVLink / Fabric
```

We should visually connect algorithmic decisions to physical costs.

Example:

```text
Attention implementation
    ↓
FLOPs
    ↓
HBM reads/writes
    ↓
Arithmetic intensity
    ↓
kernel occupancy
    ↓
latency
```

This lets a reader understand why systems techniques exist rather than memorizing their names.

---

# 27. TRAINING VISUALIZATION

Training deserves a lifecycle view:

```text
DATA
  ↓
PRETRAIN
  ↓
MIDTRAIN
  ↓
SFT
  ↓
PREFERENCE / RL
  ↓
DISTILLATION
  ↓
EVALUATION
  ↓
DEPLOYMENT
  ↓
DATA / FEEDBACK LOOP
```

The important feature is that this lifecycle is not purely linear.

Feedback arrows should reveal:

```text
deployment → data
evaluation → training
teacher model → student
synthetic generation → pretraining
reward model → policy
```

The visualization should therefore support cycles.

Do not force everything into a static pipeline.

---

# 28. MULTI-REPRESENTATION READING

A concept should be inspectable through several representations.

For a topic such as speculative decoding:

```text
NARRATIVE
Why it exists.

INTUITION
Generate cheaply, verify expensively.

MATHEMATICS
Expected accepted-token speedup.

ALGORITHM
Draft → verify → accept/reject.

SYSTEMS
Memory and scheduling interaction.

VISUAL
Token tree / acceptance path.

IMPLEMENTATION
Pseudo-code and runtime architecture.

EVIDENCE
Measured TTFT/TPOT/throughput.

LIMITATIONS
Acceptance-rate collapse and scheduling overhead.
```

These are not separate articles.

They are synchronized views of the same concept.

---

# 29. DEPTH CONTROL

Readers have different intentions.

Provide a subtle depth mechanism.

For example:

```text
Overview
Technical
Research
Implementation
```

This must not mean four separately authored pages.

It should control visibility of optional layers.

`Overview`

shows narrative, intuition and principal diagrams.

`Technical`

adds equations and algorithms.

`Research`

adds experimental evidence, papers, ablations and controversies.

`Implementation`

adds code, systems constraints and production details.

The URL should preserve selected depth.

---

# 30. INLINE EXPANSION

Use inline expansion heavily but precisely.

Example:

```text
Why does GQA reduce KV-cache memory?   ▸
```

Expansion should occur in-place.

No modal.

No routing to another page.

No context loss.

Expanded content can itself contain structured objects.

If it becomes very large, expose:

`Open as concept →`

This creates recursive depth without destroying the main narrative.

---

# 31. FOOTNOTES AND REFERENCES

Do not make users travel to the bottom of a 15,000-word page.

Footnote interactions:

Desktop:

`hover → preview`

Click:

`pin in right rail`

Mobile:

`tap → bottom sheet`

Each citation needs a stable anchor.

Back-navigation returns exactly to the source sentence.

---

# 32. SEARCH

Search is a primary navigation primitive.

Keyboard:

`⌘K / Ctrl-K`

Search across:

```text
concepts
papers
authors
labs
equations
algorithms
benchmarks
models
datasets
implementations
chapters
```

Results must identify object type.

Example:

```text
PagedAttention
CONCEPT · Inference / KV Cache

PagedAttention
PAPER · Kwon et al.

vLLM
SYSTEM · Inference Engine
```

Semantic search can be added, but deterministic lexical retrieval should remain available.

---

# 33. COMMAND PALETTE

Power users need direct commands.

Examples:

```text
Go to concept
Find paper
Open graph
Compare concepts
Copy citation
Open implementation
Show prerequisites
Show descendants
Toggle depth
Toggle dark mode
Open equation inspector
```

---

# 34. BREADCRUMBS

Breadcrumbs must represent conceptual hierarchy.

Example:

```text
LLM Systems
/
Inference
/
Memory
/
KV Cache
/
PagedAttention
```

Each ancestor is interactive.

Do not allow breadcrumbs to become a second navigation bar.

Keep them quiet.

---

# 35. THE TOP NAVIGATION

Suggested top-level topology:

```text
ATLAS
LIBRARY
PAPERS
SYSTEMS
BENCHMARKS
LABS
TIMELINE
GRAPH
```

Global search belongs toward the right.

Secondary utilities:

```text
Reading list
Theme
Repository
About
```

The global nav should remain compact.

The actual intellectual navigation occurs in the knowledge topology.

---

# 36. HOME PAGE

The home page should not begin with:

> “Welcome to the future of AI research.”

No marketing copy.

Instead immediately expose the knowledge universe.

Possible structure:

```text
RESEARCH ATLAS

A living technical map of modern AI systems.

──────────────────────────────────────────

TRAINING
Data · Pretraining · Post-training · RL · Distillation

ARCHITECTURES
Attention · MoE · Memory · Reasoning · Multimodality

INFERENCE
Serving · KV Cache · Quantization · Scheduling · Kernels

SYSTEMS
Parallelism · Compilers · Networking · Hardware

AGENTS
Planning · Tools · Memory · Computer Use · Multi-agent

ROBOTICS
VLA · World Models · Control · Simulation

EVALUATION
Benchmarks · Safety · Reasoning · Agents

──────────────────────────────────────────

LATEST RESEARCH THREADS
...
```

The homepage is a map into research.

It should not be a magazine feed.

---

# 37. DOMAIN LANDING PAGE

Example:

`Inference`

The domain page needs:

```text
1. domain thesis
2. dependency map
3. major conceptual families
4. canonical papers
5. modern systems
6. benchmark landscape
7. current research frontier
8. open problems
```

A newcomer sees a path.

An expert sees the topology.

---

# 38. READING PATHS

Offer curated intellectual paths without turning the site into a course platform.

Examples:

```text
Understand modern LLM training
Inference engineering
Reasoning-model training
Mixture-of-Experts systems
GPU kernel optimization
Long-context systems
Agent architecture
VLA systems
```

A path is simply an ordered traversal through existing research nodes.

No duplicate content.

---

# 39. RESEARCH FRONTIER

The platform should distinguish foundational material from frontier material.

Possible markers:

```text
FOUNDATIONAL
ESTABLISHED
ACTIVE
EMERGING
OPEN
```

The `Frontier` view should answer:

> Which research questions are actively changing?

For each:

```text
problem
current approaches
recent papers
contradictory evidence
remaining bottleneck
```

---

# 40. “WHY THIS EXISTS” AS A FIRST-CLASS PATTERN

Modern AI literature often becomes a catalog of techniques.

Avoid that.

Every major concept begins by answering:

```text
What failed before?
What bottleneck appeared?
Which constraint became dominant?
What changed in the solution?
```

For example:

```text
PagedAttention does not begin with its implementation.

It begins with:
KV-cache memory is dynamically sized and conventional contiguous
allocation causes fragmentation and poor utilization.

Then:
virtual-memory-style paging.

Then:
block tables and execution.
```

The design should reinforce causality.

---

# 41. OBSERVATION LAYER

Every major methodology page should distinguish:

```text
WHAT THE PAPER CLAIMS

WHAT THE EVIDENCE SHOWS

WHAT WE INFER

WHAT REMAINS UNKNOWN
```

These can be represented as subtle semantic labels.

This prevents scientific commentary from being visually indistinguishable from source evidence.

---

# 42. EXPERIMENT VIEW

Experiments should have a consistent representation.

```text
Hypothesis

Setup

Independent variables

Controlled variables

Dataset / workload

Hardware

Metrics

Baselines

Result

Ablation

Interpretation

Threats to validity
```

Charts should expose source data where possible.

Hover gives precise values.

Clicking a legend should isolate a series.

Avoid chart animation that slows analysis.

---

# 43. PERFORMANCE METRICS

For inference work, support standardized representations of:

```text
TTFT
TPOT
ITL
E2E latency
p50
p95
p99
requests/sec
tokens/sec
tokens/sec/GPU
GPU utilization
HBM utilization
KV-cache utilization
batch size
concurrency
cost/token
```

A benchmark figure should expose context such as:

```text
hardware
model
precision
sequence length
input/output distribution
concurrency
runtime version
```

Otherwise the comparison is misleading.

---

# 44. MODEL / SYSTEM COMPARISON

Do not display generic leaderboard numbers without an evaluation axis.

The UI should require comparison context:

```text
Capability-sensitive
Latency-sensitive
Throughput-sensitive
Cost-sensitive
Long-context
Agentic
Code
Mathematics
Open-weight
On-device
```

Comparison surfaces should adapt dimensions accordingly.

---

# 45. VISUAL LANGUAGE

Use a warm neutral substrate rather than pure white where appropriate.

The reference screenshot itself demonstrates how an off-white editorial surface can reduce the “web app” feeling and make the content resemble an authored publication.

Suggested direction:

```text
background      warm paper-neutral
primary text    near-black
secondary       graphite
rules           low-contrast gray
code            slightly differentiated neutral
accent          domain dependent
links           restrained, unmistakable
```

No high-chroma interface unless information semantics demand it.

---

# 46. DOMAIN COLORS

Color can encode research domain.

For example:

```text
Training       one accent family
Inference      another
Hardware       another
Agents         another
Robotics       another
Evaluation     another
```

Do not paint whole pages.

Use accents for:

```text
section identifiers
graph edges
active states
small markers
visualization series
```

The content should remain predominantly neutral.

---

# 47. TYPOGRAPHY

Use three functional families at most.

### Editorial serif

Use for:

```text
major headings
selected long-form body sections if readability testing supports it
quotations
```

### Technical sans

Use for:

```text
navigation
metadata
UI controls
labels
tables
captions
```

### Monospace

Use for:

```text
code
tensor shapes
variables
paths
system identifiers
hardware notation
```

Do not use monospace simply to make something “technical.”

Typography should encode information type.

---

# 48. TYPE SCALE

Avoid exaggerated modern landing-page scales.

Approximate desktop system:

```text
Display       42–52 px
H1            36–42
H2            28–32
H3            21–24
Body          17–19
Technical     14–16
Metadata      12–13
Code          13–15
```

Body line-height approximately:

`1.55–1.70`

depending on typeface.

Dense tables can be tighter.

---

# 49. SPACING

Whitespace should separate intellectual units rather than decorate the page.

Large gap:

`new conceptual section`

Medium gap:

`new argument`

Small gap:

`related material`

The spacing system should therefore correspond to semantic hierarchy.

Avoid arbitrary 64-pixel gaps between everything.

---

# 50. BORDERS AND CONTAINERS

Use hairline rules extensively.

Use filled cards sparingly.

Good:

```text
──────── Section boundary
│ Context lineage
┌── expanded mechanism
```

Bad:

```text
rounded card
rounded card
rounded card
rounded card
```

When everything is contained, nothing has hierarchy.

---

# 51. TABLES

Research tables should support:

```text
sticky column
sticky header
column visibility
sort
filter
citation inspection
horizontal scroll
CSV export when appropriate
```

Large tables require full-width breakout from the normal prose column.

---

# 52. FIGURES

Figures must be treated as research objects.

Every figure needs:

```text
figure number
title
caption
source
data context
relevant concept links
fullscreen inspection
```

Do not enlarge an image through a generic modal.

Use an analytical figure viewer where details matter.

---

# 53. DIAGRAM SYSTEM

We need a reusable grammar rather than custom art for every page.

Core primitives:

```text
Node
Process
State
Tensor
Memory
Dataset
Model
Objective
Metric
Hardware
Flow
Dependency
Branch
Feedback loop
Boundary
```

If these primitives share consistent semantics, a reader gradually learns the visual language.

---

# 54. TENSOR VISUALIZATION

For model architecture content, tensor shape changes should be inspectable.

Example:

```text
[B, T, D]
    ↓ QKV projection
[B, T, 3, H, Dh]
    ↓ attention
[B, H, T, Dh]
```

Hover on dimensions:

```text
B   batch
T   sequence
H   heads
Dh  head dimension
```

This should integrate with equations and code.

---

# 55. SYSTEMS TRACE

For implementation-heavy pages, allow the reader to move through:

```text
request
→ tokenizer
→ scheduler
→ prefill batch
→ model executor
→ kernel
→ KV write
→ decode
→ sampler
→ stream
```

Selecting a stage reveals:

```text
latency
memory
compute
communication
failure mode
```

This becomes a systems-level explanatory primitive.

---

# 56. MOBILE

Do not simply stack the desktop columns.

Mobile should become:

```text
TOP BAR
CONTENT
CONTEXT BOTTOM SHEET
```

Left knowledge tree becomes a slide-in navigator.

Right rail becomes an inspectable sheet.

Equation inspectors and citation previews use sheets.

Figures should support pinch/zoom only where genuinely useful.

Main reading width remains comfortable.

---

# 57. TABLET

Tablet can use:

```text
collapsible left navigator
main content
context overlay
```

Do not squeeze three columns into 1024 px.

---

# 58. INTERACTION TIMING

Motion is functional only.

Suggested durations:

```text
hover           80–120 ms
small state     120–160 ms
panel           160–220 ms
graph transition 200–300 ms
```

Use motion to preserve object continuity.

Do not animate normal text entering the viewport.

Do not use scroll-triggered fade-ups for paragraphs.

Do not use decorative parallax.

---

# 59. DARK MODE

Dark mode should be designed independently.

Do not invert the palette mechanically.

Requirements:

```text
low glare
high code readability
clear mathematical notation
graph edges remain distinguishable
chart series remain accessible
syntax highlighting remains restrained
```

---

# 60. ACCESSIBILITY

Target WCAG 2.2 AA minimum.

Particularly test:

```text
keyboard traversal
focus visibility
tree navigation
graph alternatives
diagram descriptions
table navigation
math accessibility
code blocks
contrast
reduced motion
citation previews
mobile targets
```

Graphs cannot be the sole representation of information.

Every graph requires a navigable textual representation.

---

# 61. URLs AND DEEP LINKING

Every meaningful intellectual object needs a stable URL.

Examples:

```text
/training/pretraining/scaling-laws
/inference/kv-cache/paged-attention
/papers/flashattention
/benchmarks/swe-bench
/labs/deepseek
/systems/vllm
```

Individual headings need anchors.

Equations, figures and algorithms should be independently linkable where valuable.

A researcher should be able to send someone directly to:

> Equation 7 in the KV-cache section.

---

# 62. READING STATE

Persist locally:

```text
chapter progress
expanded details
selected depth
bookmarks
recent concepts
comparison state
```

Logged-in accounts can later synchronize these states.

Do not require authentication for reading.

---

# 63. READING LIST

A researcher should be able to save:

```text
concept
paper
equation
figure
chapter
open question
```

Saved material should preserve its surrounding context.

A saved paragraph detached from its concept is not useful.

---

# 64. ANNOTATION

Potential later capability:

```text
highlight
private note
link concepts
export notes
```

Do not allow annotation UX to pollute the core reading surface.

---

# 65. VERSIONING

Research changes.

Every article needs:

```text
published
last reviewed
last updated
revision history
```

For substantive changes, provide:

`View changes`

Technical knowledge should not silently mutate.

---

# 66. FRONTIER UPDATE MECHANISM

New papers should connect to existing concepts rather than appearing only in a chronological feed.

Example:

```text
New paper
    ↓
affects
    ↓
KV Compression
    ↓
modifies evidence for
    ↓
Long-context inference
```

The product becomes a living graph.

---

# 67. CITATION ARCHITECTURE

Internally use canonical research entities.

Do not manually repeat bibliographic text everywhere.

For example:

```text
paper_id → metadata
claim_id → paper_id
figure_id → claim_id
concept_id → claim_ids[]
```

This enables:

```text
citation consistency
automatic bibliography
source updates
paper pages
citation counts within the Atlas
claim tracing
```

---

# 68. FRONTEND CONTENT ARCHITECTURE

Recommended conceptual stack:

```text
React / server-rendered web framework
MDX or structured research content
typed content schema
KaTeX
Shiki
graph rendering layer
interactive visualization layer
search index
citation registry
research entity database
```

Do not store the entire intellectual structure as arbitrary HTML.

Content should compile into typed research objects.

---

# 69. COMPONENT SYSTEM

Build domain-specific primitives rather than only generic UI components.

Required families include:

```text
<ResearchArticle>
<ConceptHeader>
<KnowledgeTree>
<ContextRail>
<ConceptGraph>
<ConceptRelation>
<Equation>
<EquationInspector>
<Derivation>
<Algorithm>
<CodeExample>
<TensorDiagram>
<SystemTrace>
<ArchitectureDiagram>
<Experiment>
<Benchmark>
<Ablation>
<PaperCitation>
<PaperInspector>
<Claim>
<Evidence>
<FailureMode>
<OpenQuestion>
<ResearchLineage>
<CompareView>
<Figure>
<DataTable>
<GlossaryTerm>
<InlineExpansion>
<ResearchMinimap>
```

These components are the true design system.

Buttons and cards are secondary.

---

# 70. CONTENT WIDTH BEHAVIOR

Not all content should obey the prose measure.

Three widths:

```text
READING WIDTH
~760 px

ANALYSIS WIDTH
~1050–1200 px

FULL BLEED
available viewport within shell
```

Prose remains in reading width.

Large equations, tables, timelines and architectures can break outward gracefully.

Do not force technical diagrams into a narrow column.

---

# 71. PAGE TRANSITIONS

Navigation should preserve intellectual continuity.

Moving from:

`KV Cache → PagedAttention`

should not feel like entering another website.

Prefer:

```text
instant route transition
preserved shell
tree remains
context changes
main content replaces
scroll resets intelligently
```

The site shell should remain stable.

---

# 72. PERFORMANCE

This platform may eventually contain thousands of research objects.

Do not solve visual richness by shipping an enormous client-side application.

Internal performance targets should be stricter than public Core Web Vitals thresholds.

Aim approximately for:

```text
LCP          < 1.8 s on representative broadband desktop
INP          < 150 ms
CLS          < 0.05

navigation   perceptually immediate
search       < 100 ms after local index is loaded
tree update  < 16 ms frame budget where practical
```

Heavy graph/layout code should load only when required.

Static research content should remain highly cacheable.

---

# 73. VISUALIZATION PERFORMANCE

Do not render a thousand-node graph in the DOM because the underlying knowledge graph contains a thousand objects.

Render the local neighborhood.

Progressive exploration:

```text
current
+ parents
+ siblings
+ children
+ selected relations
```

Expand on demand.

This is cognitively better and computationally better.

---

# 74. SEO AND MACHINE READABILITY

Research objects should expose structured metadata.

Search engines and future agents should be able to understand:

```text
article
author
paper
citation
dataset
software
date
concept relationships
```

Do not make critical content dependent on client-side canvas rendering.

---

# 75. PRINT / PDF MODE

AI 2027 exposes a PDF in addition to the web experience.

Our system should likewise support serious offline reading.

However, PDF should be generated from the same semantic content model.

For print:

```text
remove interactive chrome
expand selected definitions
resolve references
number figures
number equations
generate bibliography
preserve hierarchy
```

---

# 76. MULTIMEDIA

Audio or video should be supplemental rather than dominant.

AI 2027 itself exposes read, PDF, listen and watch modalities.

For Research Atlas, potential modes are:

```text
Read
Listen
Watch derivation
Inspect visualization
Run example
```

Do not turn the platform into a video course.

Text remains canonical.

---

# 77. THINGS THE DESIGNER MUST NOT DO

Do not produce:

```text
a typical documentation clone
a Medium-like publication
a Notion clone
a Wikipedia clone
a card grid
an AI startup website
a colorful dashboard
a paper-list website
a conventional blog
```

Do not solve information complexity by hiding everything.

Do not solve it by displaying everything.

The challenge is **controlled depth**.

---

# 78. PRIMARY COGNITIVE MODEL

The reader should gradually form a mental graph:

```text
problem
    ↓
constraint
    ↓
mechanism
    ↓
representation
    ↓
algorithm
    ↓
implementation
    ↓
hardware behavior
    ↓
measured outcome
    ↓
failure
    ↓
next mechanism
```

This is the site's deepest design requirement.

The visual system, information hierarchy and interactions should reinforce this loop everywhere.

---

# 79. EXAMPLE: HOW A PAGE SHOULD FEEL

Suppose the reader opens:

`Mixture of Experts`.

The screen should not simply show an article titled “Mixture of Experts.”

It should immediately establish:

```text
Transformer Architecture
/
Conditional Computation
/
Mixture of Experts
```

The left tree reveals:

```text
Dense FFN
Mixture of Experts
  ├ Router
  ├ Top-k selection
  ├ Expert capacity
  ├ Load balancing
  ├ Expert parallelism
  └ Communication
```

The main text begins with the bottleneck:

> Dense transformers activate the full feed-forward parameter set for every token.

The right rail shows:

```text
Dense:
active parameters = total parameters

MoE:
active parameters << total parameters
```

Further down, the equation for router probability appears.

The rail changes to the router.

Further down:

`Expert Parallelism`

The right rail turns into a multi-GPU topology.

Further down:

`All-to-All Communication`

The right rail exposes communication volume.

Now the reader sees the connection:

```text
architectural idea
→ sparse activation
→ routing
→ expert placement
→ network communication
→ throughput
```

This is the experience we want throughout the Atlas.

---

# 80. EXAMPLE: PAPER DEEP DIVE

A research-paper page should follow:

```text
FlashAttention
Dao et al.

Problem
Attention is often memory-bandwidth constrained.

Central insight
Make exact attention IO-aware.

Formulation
Memory hierarchy + tiling.

Algorithm
Block Q/K/V.

Correctness
Online softmax.

Complexity
FLOPs remain comparable;
HBM traffic falls substantially.

Implementation
GPU kernel.

Experiments
Sequence length × head dimension × hardware.

Ablations

Limitations

Subsequent work
FlashAttention-2
FlashAttention-3
hardware-specific variants
```

A normal paper summary is insufficient.

We should reconstruct the causal chain from problem to physical execution.

---

# 81. EXAMPLE: TRAINING TOPIC

For a chapter such as preference optimization:

```text
Post-training
/
Preference Learning
```

The visual sibling strip shows:

```text
RLHF
PPO
DPO
IPO
KTO
GRPO
RLAIF
Verifiable Rewards
```

Selecting one does not immediately discard the current page.

It opens a comparison lens.

The user should understand exactly which objective or training loop changes between methods.

---

# 82. EXAMPLE: INFERENCE SYSTEM

For an engine page:

```text
vLLM
```

Do not describe only features.

Decompose:

```text
request layer
scheduler
block manager
model executor
attention backend
distributed execution
sampling
streaming
```

Then connect features to architectural mechanisms:

```text
continuous batching
    ↕
scheduler

PagedAttention
    ↕
block manager

tensor parallelism
    ↕
distributed executor
```

That converts software documentation into systems understanding.

---

# 83. LANDING EXPERIENCE

The first thirty seconds should communicate three things without explanation.

1. This is serious technical research.
2. The material is much deeper than a normal article site.
3. I can navigate it without getting lost.

A first-time visitor should see enough of the graph to understand the scale but not enough to be overwhelmed.

---

# 84. PROGRESSIVE REVELATION

The product should operate at three simultaneous scales.

### Scale 1 — World

```text
Training
Inference
Architectures
Agents
Hardware
Robotics
Evaluation
```

### Scale 2 — Domain

```text
Inference
→ Memory
→ Scheduling
→ Parallelism
→ Kernels
```

### Scale 3 — Mechanism

```text
KV Cache
→ paging
→ block mapping
→ allocation
→ eviction
```

Zooming conceptually between these scales should feel continuous.

---

# 85. WHAT “100× BETTER” ACTUALLY MEANS

Do not interpret the requirement as:

100× more visual effects.

Interpret it as:

```text
10× stronger information architecture
10× stronger research navigation
10× deeper interaction between evidence and explanation
10× better conceptual continuity
10× stronger technical visualization
10× better provenance
10× better paper integration
10× better system comparison
10× better handling of recursive concepts
10× better reader orientation
```

The sophistication must come from structure, not decoration.

---

# 86. DEFINITION OF QUALITY

The visual bar should be judged by this test:

> Can a senior researcher spend two hours inside a chapter and continually discover useful relationships without ever feeling that the interface is competing with the technical material?

The usability bar:

> Can a new researcher understand where the current concept belongs and what must be learned before it?

The systems bar:

> Can an engineer connect the high-level algorithm to actual runtime, memory, communication and hardware behavior?

The scientific bar:

> Can a reader distinguish source evidence, interpretation and uncertainty?

The navigation bar:

> Can someone traverse parent → child → sibling → paper → implementation → benchmark and return without losing intellectual context?

If those are achieved, the design succeeds.

---

# 87. IMPLEMENTATION PHASES

## Phase I — Structural prototype

Implement only:

```text
global shell
knowledge tree
article reader
context rail
semantic headings
citations
inline expansion
concept routing
search
```

Populate approximately three deeply developed topics.

Do not begin with the whole library.

The goal is to validate information architecture.

## Phase II — Research primitives

Add:

```text
equations
algorithms
paper inspector
figures
experiments
benchmarks
code
research lineage
```

## Phase III — Graph intelligence

Add:

```text
concept graph
prerequisites
siblings
downstream links
compare mode
research paths
```

## Phase IV — Technical visualizations

Add domain-specific systems:

```text
tensor diagrams
training cycles
GPU topology
memory hierarchy
system traces
benchmark explorer
```

## Phase V — Research operating layer

Add:

```text
reading state
bookmarks
version history
annotations
frontier updates
multi-format publishing
```

---

# 88. FIRST DESIGN DELIVERABLES

Before implementation begins, I expect the design phase to produce these screens.

```text
01  Research Atlas homepage
02  Domain landing page
03  Standard concept article
04  Deep technical concept article
05  Paper deep-dive
06  Concept graph
07  Compare mode
08  Benchmark page
09  System / implementation page
10  Mobile article
11  Mobile navigation
12  Dark mode article
```

Additionally define:

```text
knowledge-tree behavior
context-rail state machine
inline expansion behavior
paper-inspector behavior
equation interaction
figure interaction
scroll synchronization
responsive collapse rules
```

Do not deliver only static page mockups.

The interaction rules are part of the design.

---

# 89. FIRST PROTOTYPE CONTENT

Do not prototype with lorem ipsum.

Use real, technically dense AI material.

A useful initial vertical slice is:

```text
Inference
   ↓
Transformer decoding
   ↓
KV Cache
   ↓
PagedAttention
   ↓
Continuous batching
   ↓
Serving engines
```

Why this path?

Because it exercises almost every required representation:

```text
architecture
equations
tensor dimensions
memory
algorithms
systems
GPU constraints
papers
implementations
benchmarks
sibling techniques
dependency relationships
```

If the design survives this content, it is likely structurally sound.

---

# 90. FINAL DIRECTIVE TO THE DESIGNER

Use AI 2027 as evidence that dense technical material can become a compelling web experience without becoming a conventional web application.

But do not imitate the surface.

Its useful lesson is deeper:

**the visualization must move with the argument.**

In Research Atlas we extend this principle.

The navigation moves with the concept.

The graph moves with the argument.

The equations move with the mechanism.

The evidence moves with the claim.

The hardware view moves with the implementation.

The bibliography moves with the research lineage.

The system should continuously answer:

```text
Where am I?

Why does this exist?

What does it depend on?

How does it work?

What changes mathematically?

What changes computationally?

What changes physically?

What evidence supports it?

What alternatives exist?

What failed?

What came next?
```

The website should therefore never feel like a collection of pages.

It should feel as though the user is moving through **one connected technical model of modern AI research**.

That is the product.

Everything else—the typography, colors, animation, diagrams and components—exists to make that model comprehensible.
