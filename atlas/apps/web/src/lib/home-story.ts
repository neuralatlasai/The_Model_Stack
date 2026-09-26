/**
 * The home page's argument (components/home/BrainStory.astro): the book's
 * central relationship stated once, then one step per part of the stack.
 * Editorial summaries of book_plan.md — each part's scope and principal
 * outcome as the plan states them; no figures or claims beyond the plan.
 * `**…**` marks the technical terms set in bold.
 */

export interface StoryPart {
  readonly n: number;
  readonly heading: string;
  readonly body: string;
  readonly outcome: string;
}

export const STORY_THESIS =
  'A learning objective induces a representation and an algorithm. Those choices fix how a model executes — its memory, its communication, its deployment behaviour — and the evidence from deployment decides the next learning intervention. Architecture, data, optimisation, hardware and evaluation have to be studied together.';

export const STORY_BRAIN =
  'The brain beside the text is the book itself: each region is a part, each neuron a chapter, lit where the manuscript is written, each fibre a declared prerequisite. Scroll, and it follows the argument.';

export const STORY_PARTS: readonly StoryPart[] = [
  {
    n: 1,
    heading: 'Treat the model as a scientific system.',
    body: 'Before anything is optimised, fix what is measured. The lifecycle is specified with **measurable objectives and resource constraints**; the mathematics, numerics and **learning objectives** are made exact; a **minimal Transformer** is traced operation by operation; and every later claim must survive a **controlled, reproducible experiment**.',
    outcome: 'A correct reference model and a defensible experiment.',
  },
  {
    n: 2,
    heading: 'Data is the first design decision.',
    body: 'What a model can learn is bounded by what it sees and how it is serialised: **provenance and admissible use**, cleaning, **deduplication**, privacy filtering and **contamination** control, **mixtures and curricula**, **tokenization** and chat-template correctness, **synthetic and preference data**, and ingestion that replays exactly.',
    outcome: 'A versioned corpus, tokenizer and ingestion pipeline.',
  },
  {
    n: 3,
    heading: 'An architecture is a choice of state.',
    body: 'Every architecture decides what the model carries between tokens and what each token costs. Dense Transformers allocate **parameters and FLOPs**; attention variants trade **KV-cache bytes** against recall; position schemes set the **effective context**; **mixture-of-experts** decouples parameters from compute; **state-space and linear-attention** models replace the cache with a fixed-size recurrent state.',
    outcome: 'Explicit representation, state and computation trade-offs.',
  },
  {
    n: 4,
    heading: 'Training turns compute into capability — measurably.',
    body: 'The **pretraining objective** and the full training loop; **optimisers, schedules and stability**; **scaling laws** and compute allocation; continued pretraining and domain adaptation; **parameter-efficient adaptation**; and continual learning, editing and unlearning — each with the evidence that a gain is real rather than extra compute.',
    outcome: 'Pretraining and adaptation recipes with scaling and retention evidence.',
  },
  {
    n: 5,
    heading: 'Silicon sets the budget.',
    body: 'Throughput is bounded by the **memory hierarchy** and the network long before peak arithmetic. Performance models of accelerators, **kernels** that must stay numerically equivalent, attention and expert kernels, **graph compilers**, data, tensor, pipeline and expert **parallelism** with their collectives, and long runs that must **fail and recover** cleanly.',
    outcome: 'Measured kernels, parallelisation and recoverable training.',
  },
  {
    n: 6,
    heading: 'Post-training shapes behaviour.',
    body: '**Supervised fine-tuning** with exact target masks; **preference data, reward models and verifiers**; **direct preference optimisation**; policy gradients, **PPO and RLHF**; **reinforcement learning from verifiable rewards** for reasoning; and **distributed rollout** systems for agents — each pipeline auditable end to end.',
    outcome: 'Auditable supervised, preference and reinforcement-learning pipelines.',
  },
  {
    n: 7,
    heading: 'Inference is its own optimisation problem.',
    body: '**Decoding**, constrained generation and **speculative execution**; inference-time **search and adaptive compute**; **distillation** of knowledge, responses and policies; **quantization** from numerical model to deployable artifact; pruning and sparsity; and the **prefill/decode** split with exact accounting of the KV state.',
    outcome: 'Quality–resource frontiers and validated state accounting.',
  },
  {
    n: 8,
    heading: 'Serving is a service contract.',
    body: 'Choosing a **runtime and inference engine**; **scheduling** and **disaggregated prefill and decode**; local and edge inference; **admission control, routing and autoscaling** against service-level objectives; **observability** and incident recovery; and **capacity planning** with cost evidence.',
    outcome: 'SLO-driven deployment with capacity and cost evidence.',
  },
  {
    n: 9,
    heading: 'Grounding and action.',
    body: '**Retrieval** models and indexing; **context construction** and retrieval-augmented generation; **tool use** through protocol interfaces; **planning** with verification and recovery; **persistent memory** and long-horizon consistency; and **multi-agent** coordination evaluated as one system.',
    outcome: 'Grounded context, reliable tools and consistent long-horizon state.',
  },
  {
    n: 10,
    heading: 'Beyond text: perception, prediction and control.',
    body: '**Vision-language** and document models; **audio** and real-time speech; **video** and streaming multimodality; **generative multimodal** models; **predictive representations and world models**; and **vision-language-action** policies for embodied learning.',
    outcome: 'Modality-aware learning, prediction, planning and control studies.',
  },
  {
    n: 11,
    heading: 'Evidence closes the loop.',
    body: '**Capability portfolios** and benchmark validity; **human preference and model judges** with their uncertainty; the reliability of agents and retrieval systems; **mechanistic interpretability**; **security, privacy and adversarial robustness**; and **release decisions** backed by a reproducible dossier — the evidence that sets the next learning intervention.',
    outcome: 'Reproducible evidence and an accountable release dossier.',
  },
];

export const STORY_CLOSE = {
  heading: 'Every claim carries its evidence.',
  body: 'Each technical statement is labelled — **paper-reported**, **official documentation**, **derived**, **assumed**, **not disclosed** or **unverified** — and every experiment stays a **proposal** until it is run. Every chapter declares what it builds on, so any idea can be followed back to its foundations.',
} as const;

/** Splits `**bold**` markup into runs for rendering. */
export function runs(text: string): { readonly text: string; readonly bold: boolean }[] {
  return text.split('**').map((part, index) => ({ text: part, bold: index % 2 === 1 })).filter((run) => run.text !== '');
}
