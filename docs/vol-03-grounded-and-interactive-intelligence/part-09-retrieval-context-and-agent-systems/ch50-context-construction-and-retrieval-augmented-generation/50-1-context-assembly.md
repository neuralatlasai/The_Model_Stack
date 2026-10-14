---
id: "ms.section.50.1"
entity_type: "section"
title: "50.1 — Context assembly"
volume: 3
part: 9
chapter: 50
section: 50.1
slug: "50-1-context-assembly"
parent: "ms.chapter.50"
prev_sibling: null
next_sibling: "ms.section.50.2"
children: []
prerequisites: ["ms.chapter.10","ms.chapter.15","ms.chapter.37","ms.chapter.38","ms.chapter.49"]
downstream: ["ms.chapter.51","ms.chapter.52","ms.chapter.53","ms.chapter.54"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["retrieval","context_construction","grounding"],"feedback_setting":[],"modality":["text"]}
papers: ["P40","P50"]
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.vllm"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 50.1 — Context assembly

## Scope

[DERIVED] Context assembly compiles instructions, user input, retrieved passages, conversation history and tool results into a model-consumable representation with explicit provenance and trust boundaries. The artifact is a context compiler, not merely string concatenation. Its success criteria are authorized evidence inclusion, reproducible serialization, valid source mapping and explicit handling of missing or incompatible inputs. Chapter 49 owns retrieval/index construction; this chapter develops what happens between retrieved candidates and a grounded answer.

## Why this exists

[DERIVED] A retriever returns candidates, not an executable specification of how a model should interpret them. A passage can contain an instruction that conflicts with the user request. A tool response can be stale, truncated, or incorrectly associated with a call. Conversation history can include a previous assistant mistake that later looks like established evidence. Joining these strings without preserving their roles destroys the distinctions needed to assess an answer.

[DERIVED] The bottleneck is therefore semantic and operational compatibility. The compiler must know which bytes are instructions, which are observations, which are quotations, which principal may access them, and which document revision a citation names. A source identifier that changes when passages are reordered can attach an otherwise correct claim to the wrong evidence. Increasing the model's context window does not repair this class of error.

## Intuition

[DERIVED] Treat context as a typed intermediate representation before rendering it. The representation stores content and lineage separately from authority. A retrieved document may be useful evidence about a factual question while having no authority to change system policy or authorize a tool action. The renderer then translates approved objects into the exact format expected by the model, and produces a source map that survives ordering, compression and generation.

```figure
{
  "id": "fig-50.3",
  "kind": "diagram",
  "title": "Typed context before model rendering",
  "caption": "Authenticated origin plus trusted role/policy determines authority; evidence identity and revision survive rendering.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.3",
  "alt": "Authenticated origin plus trusted role/policy determines authority; evidence identity and revision survive rendering.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "i",
        "kind": "state",
        "label": "instructions / request"
      },
      {
        "id": "e",
        "kind": "dataset",
        "label": "retrieved evidence"
      },
      {
        "id": "h",
        "kind": "memory",
        "label": "history / tools"
      },
      {
        "id": "v",
        "kind": "branch",
        "label": "identity / access"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "typed compiler"
      },
      {
        "id": "m",
        "kind": "model",
        "label": "model input + source map"
      }
    ],
    "edges": [
      {
        "from": "i",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "e",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "h",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "c",
        "kind": "flow",
        "label": "approved"
      },
      {
        "from": "c",
        "to": "m",
        "kind": "flow"
      }
    ]
  }
}
```

[PAPER-REPORTED] LongEval 2026 supplies ten pre-retrieved CORE document IDs per query and requires generated citation indices to map back to the supplied reference array. Its pipeline performs post-retrieval chunk selection rather than global corpus search. This is a concrete provenance boundary: local display indices and persistent document identities serve different functions. [R50.8, §§3.1–3.2 and Figure 1]

## Formulation

[DERIVED] Represent each context item by
$$
 r_i=(\mathrm{id}_i,\mathrm{rev}_i,\mathrm{type}_i,\mathrm{payload}_i,
       \mathrm{origin}_i,\mathrm{acl}_i,\mathrm{time}_i,\mathrm{parents}_i).
$$

(Eq. 50.1)

[DERIVED] Types distinguish instruction, user request, source evidence, historical assertion and tool observation. Revision identifies content; origin identifies how it entered the system; access metadata identifies eligible readers; time includes the source's relevant time and ingestion time when different. Parents record transformations or tool-call dependencies. These fields are engineering choices, not a theorem that the content is true or safe.

[MATHEMATICALLY-DERIVED] For a causal decoder with window $W$, exact tokenizer/template $\tau$, approved ordered items $S$, and reserved maximum newly generated tokens $Y_{\max}$, the condition necessary to honor the full reserved output cap under a strict configured total sequence budget, with no sliding-window eviction or extension, is
$$
 L_\tau(S)+Y_{\max}\le W,\qquad
 L_\tau(S)=\left|\operatorname{tokenize}_\tau
       (\operatorname{render}_\tau(S))\right|.
$$

(Eq. 50.2)

[DERIVED] Counting raw words or summing independently tokenized fragments need not equal $L_\tau(S)$ because separators, role markers and token-boundary merges affect serialization. This is a causal-decoder condition; a passage-independent encoder/decoder architecture has different per-input and decoder limits. A compatible tensor shape does not establish that the model was trained to interpret the chosen roles or evidence markers.

[DERIVED] Define a provenance relation $\ell_i\leadsto(\mathrm{id},\mathrm{rev},[a,b))$ from a rendered evidence span to a source interval. A summary can instead map to a set of parent spans and a transformation digest. That map establishes where a representation came from. Entailment and source reliability are additional predicates; neither follows from a correct hash or an intact source map.

## Mechanism

[DERIVED] Assembly first validates access and identity before content is exposed to the generator. Retrieval scores cannot override access predicates. Evidence is labeled with stable source IDs and revision-specific locators, while compact local markers are generated through a reversible mapping. Reordering changes local positions but must not change the identity attached to a marker in the compiled prompt and returned answer.

[DERIVED] Instructions and user requests retain their authenticated roles. Retrieved text and tool output enter as data with explicitly lower authority for controlling execution. Delimiters help preserve intended interpretation but are not a security boundary: a model can still follow a malicious quotation. Tool authorization must remain in an external policy/controller, developed in Chapter 51, rather than being delegated to whether the model found a source persuasive.

[DERIVED] Conversation history requires dependency closure. A tool result must identify the invocation and arguments that produced it; an assistant assertion should not become a primary source solely through repetition. If history is summarized, the compiler retains unresolved questions, corrections and references to source observations. Dropping an earlier negation or tool failure while preserving a later confident answer can change the meaning of the entire conversation.

[PAPER-REPORTED] Fusion-in-Decoder encodes each question/title/passage combination independently and concatenates encoder representations for decoder cross-attention. This differs from one causal decoder receiving a single concatenated evidence stream. It provides a concrete architectural alternative for assembling many passages; passage encoding alone does not yield citation guarantees. [R50.2, §3 and Figure 2]

[DERIVED] Formally, for $k$ passages, token sequences $x_i\in\mathbb N^{\ell_i}$ produce $H_i=\operatorname{Enc}_\theta(x_i)\in\mathbb R^{\ell_i\times d}$, followed by $H=\operatorname{concat}_iH_i$. A decoder cross-attends to $H$ while generating the answer. The encoder cannot directly exchange information across passages; fusion occurs through decoder attention. In a causal concatenation architecture, by contrast, later passage tokens can attend to earlier ones according to the mask. These attention graphs encode different information-flow constraints.

```figure
{
  "id": "fig-50.4",
  "kind": "calculator",
  "title": "Causal prompt feasibility",
  "caption": "Exact serialized input plus reserved output must fit the declared causal-decoder window; illustrative counts only.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-50.2",
  "alt": "Remaining causal window after exact prompt serialization and output reservation. Illustrative only.",
  "spec": {
    "tex": "s=W-L-Y",
    "inputs": [
      {
        "symbol": "w",
        "label": "window tokens",
        "default": 32768,
        "min": 1,
        "max": 1048576,
        "format": "tokens"
      },
      {
        "symbol": "l",
        "label": "serialized input tokens",
        "default": 24000,
        "min": 0,
        "max": 1048576,
        "format": "tokens"
      },
      {
        "symbol": "y",
        "label": "reserved new tokens",
        "default": 4096,
        "min": 0,
        "max": 1048576,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "s",
        "label": "remaining tokens; negative is infeasible",
        "formula": "w-l-y",
        "format": "tokens",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

### Algorithm 50.1 — Bounded context compilation

[DERIVED] Algorithm 50.1 compiles a finite candidate set $R$ under principal $u$, immutable template/tokenizer $\tau$, window $W$, output reserve $Y_{\max}$ and a finite transformation budget $B$. Initialize approved candidates $A=\varnothing$, selected items $S=\varnothing$, provenance map $M=\varnothing$, and remaining budget $B_{\rm rem}=B$. Outputs are compiled tokens/source map or an explicit compilation failure.

$$
\begin{aligned}
1.\;&\text{Visit each }r\in R\text{ once; validate identity/revision/schema/access for }u;\\
 &\text{failure}\Rightarrow\text{exclude with reason; continue};\
 \text{otherwise append }r\text{ to }A.\\
2.\;&\text{Validate tool/history dependencies; assign authority by trusted role/policy and origin;}\\
 &\text{missing required dependency}\Rightarrow\text{return incomplete-context failure}.\\
3.\;&\text{Choose }S\subseteq A\text{ and order; let }c=0\text{ if no transformation is needed};\\
 &c>B_{\rm rem}\Rightarrow\text{return budget failure};\
 B_{\rm rem}\leftarrow B_{\rm rem}-c;\\
 &\text{execute only capped transforms; failure}\Rightarrow\text{return explicit compilation failure};\\
 &\text{reconcile actual cost }\widetilde c\le c:
 B_{\rm rem}\leftarrow B_{\rm rem}+c-\widetilde c.\\
4.\;&\text{Render once using }\tau;\ \text{construct reversible local-marker/source-revision map }M.\\
5.\;&L_\tau(S)+Y_{\max}>W\Rightarrow\text{return over-budget failure};\\
 &\text{invalid map/role/dependency}\Rightarrow\text{return compilation failure}.\\
6.\;&\text{Emit token IDs, attention/schema configuration, manifest digest and }M.
\end{aligned}
$$

(Eq. 50.3)

[DERIVED] The invariant is that every rendered evidence item is authorized and every citation marker resolves to the same immutable source revision throughout generation/validation. The algorithm makes one finite pass and one render; it does not silently truncate mandatory instructions or spin until the context fits. A caller may invoke a separately capped rebuild policy from 50.2, preserving exclusions and budget consumption.

## Implementation

[OFFICIAL-DOCUMENTATION] Hugging Face's current chat-template guide describes structured roles/content becoming a token sequence and distinguishes starting an assistant response from continuing a final message. It warns against duplicating special tokens when separately tokenizing rendered text. The main documentation is mutable and was inspected without execution. [R50.15, “Using apply_chat_template”, special-token note and continuation options]

[DERIVED] The reference route is AI_REFERENCE_STACK §4 **#26 Hugging Face Transformers**, layer **Model definition / adaptation**, for tokenization/rendering and model definitions; **#17 PyTorch**, same layer, for encoder/decoder tensors; **#41 vLLM**, layer **Inference engine**, for executing a compatible compiled causal prompt. These are distinct responsibilities. Provenance/access validation and the compiler's typed representation are an engineering synthesis outside the catalog's engine entries.

[DERIVED] Parsing, validation and source-map construction are linear in inspected payload size plus metadata lookups under an indexed access store. Sorting $k$ candidates costs $O(k\log k)$. Model parameters are unchanged by assembly; model work depends on rendered tokens and the chosen attention graph. FiD stores $O((\sum_i\ell_i)d)$ encoder states before decoder cross-attention. Causal inference retains request KV state according to Chapter 42's model; assembly metadata is an additional host-memory cost.

[DERIVED] Data movement includes retrieval payloads, authorized tool results, tokenizer output and any distributed model communication. A compiler can reduce token work while adding CPU parsing/validation latency. A source map adds storage and network bytes but avoids requiring the model to reconstruct provenance from memory. Energy and monetary accounting should include ingestion, transformations and extra model calls; no inspected source establishes a universal compiler overhead or a free grounding guarantee.

## Experimental design

### Methodology

[PAPER-REPORTED] FiD evaluates open-domain QA using T5 base/large, retrieved passages and exact match. Training and inference passage counts are explicitly varied, rather than treating evidence assembly as independent of the model's training distribution. [R50.2, §4]

### Reported experiments

[PAPER-REPORTED] The archival study reports 48.2/51.4 NQ test exact match for base/large in Table 1. Its default setup uses 100 retrieved passages truncated to 250 wordpieces, greedy generation, and dataset-specific training. These historical results support the disclosed architecture, not a 2026 frontier-model ranking or a claim of reliable citations. [R50.2, §4, Table 1]

[DERIVED] LongEval's fixed ten-document boundary and FiD's learned passage-fusion setup are different tasks and architectures. Their outcomes cannot be combined into a claim that a particular prompt layout universally improves factuality. The present compiler protocol supplies explicit invariants that must be validated on its chosen backend.

## Observations

**What the paper claims.** [PAPER-REPORTED] FiD can aggregate retrieved passage representations through a generative decoder, while LongEval's system uses explicit reference-array citation mapping. [R50.2, §3; R50.8, §3.1]

**What the evidence shows.** [PAPER-REPORTED] FiD's QA evaluation supports its disclosed reading architecture. LongEval restricts access to pre-retrieved candidates; it does not evaluate full-corpus retrieval. [R50.2, §4; R50.8, §3.2]

**What we infer.** [DERIVED] A context compiler must bind architectural limits, semantic roles and source identity together. Correct provenance enables verification but does not establish support or truth.

**What remains unknown.** [NOT-DISCLOSED] The manuscript has no executed compiler or access-control audit. The cited studies do not establish that delimiters prevent instruction-following attacks or that generated claims are all entailed by included evidence.

## Failure modes

[DERIVED] Access filtering after generation leaks evidence even if the answer is later blocked. Reused local citation indices can silently name a different document. Template mismatch can duplicate role/special tokens. Detached tool results can attribute an observation to the wrong action. Historical assistant text can launder a mistaken claim into apparent evidence. Silent truncation can preserve an answer while deleting the exception that makes it false.

## Siblings

[DERIVED] Raw concatenation is simple but loses typed dependencies unless metadata is separately preserved. Template-based causal assembly supplies a single serialized stream with model-specific role conventions. Independent passage encoding changes the attention graph and requires a compatible trained encoder/decoder. Structured evidence stores preserve source relations outside the model but still need an explicit rendering/use policy.

```figure
{
  "id": "fig-50.5",
  "kind": "compare",
  "title": "Assembly changes the information-flow graph",
  "caption": "Serialization and attention architecture require different compatibility checks.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.3",
  "alt": "Comparison of concatenation, typed template and independent passage encoding; not a ranking.",
  "spec": {
    "axis": "Representation and information-flow boundary",
    "columns": [
      {
        "id": "m",
        "label": "Raw concatenation"
      },
      {
        "id": "t",
        "label": "Typed causal template"
      },
      {
        "id": "p",
        "label": "Passage encoder / decoder"
      }
    ],
    "rows": [
      {
        "dimension": "Input",
        "values": {
          "m": "one text string",
          "t": "roles plus stable source map",
          "p": "independent passage sequences"
        }
      },
      {
        "dimension": "Fusion",
        "values": {
          "m": "backend-dependent",
          "t": "causal token attention",
          "p": "decoder cross-attention"
        }
      },
      {
        "dimension": "Needed guard",
        "values": {
          "m": "identity / trust metadata",
          "t": "template and token budget",
          "p": "trained architecture / state map"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage moves from retrieved text as extra input to passage-aware fusion and then provenance-preserving context compilation. An unresolved question is whether a representation can preserve task-relevant evidence and trust boundaries under aggressive transformation without carrying nearly all original content. Settling evidence requires source-level entailment checks, adversarial boundary cases, exact serialization records and measured task outcomes across transformations.

## Limitations

[DERIVED] Compilation correctness is narrower than answer correctness. An authorized, accurately rendered source can be outdated or wrong; a compatible model can ignore it. Context construction cannot repair missing evidence without another retrieval or tool action. Mandatory input can itself exceed the available window, in which case explicit infeasibility is preferable to pretending the requested contract was preserved.

## Reproducibility

[UNVERIFIED] No compiler or model run was executed. Reproduction requires content/revision IDs, access predicates, template/tokenizer digests, exact rendered bytes/token IDs, dependency records, source-map transformations, model architecture/configuration, exclusions and output reserve. Proposed identity/trust/serialization checks are confined to [verification](verification.md).

## References

[DERIVED] [R50.2, Fusion-in-Decoder](https://aclanthology.org/2021.eacl-main.74.pdf), §3–4; [R50.8, LongEval 2026](https://arxiv.org/html/2607.14400v1), §3; [R50.15, chat templates](https://huggingface.co/docs/transformers/main/en/chat_templating). Exact revisions/access are recorded in [references](references.md).
