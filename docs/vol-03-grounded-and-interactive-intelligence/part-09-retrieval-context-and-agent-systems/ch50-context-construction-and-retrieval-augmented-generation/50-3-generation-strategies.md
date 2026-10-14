---
id: "ms.section.50.3"
entity_type: "section"
title: "50.3 — Generation strategies"
volume: 3
part: 9
chapter: 50
section: 50.3
slug: "50-3-generation-strategies"
parent: "ms.chapter.50"
prev_sibling: "ms.section.50.2"
next_sibling: "ms.section.50.4"
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

# 50.3 — Generation strategies

## Scope

[DERIVED] Retrieval-augmented generation can be a single conditional generation, a latent-document mixture, or a bounded controller that retrieves and revises during generation. We examine their objectives, information flow, decoding and failure boundaries. The term RAG does not identify one algorithm. Retrieval scoring remains in Chapter 49; general agent planning remains in Chapter 52.

## Why this exists

[DERIVED] A fixed initial retrieval can miss a fact whose query becomes clear only after an intermediate answer. More retrieval can also add distractors or reinforce an incorrect intermediate assumption. Revising the answer against the same insufficient evidence cannot create the missing fact. A method must therefore specify when it retrieves, what state generates the next query, how evidence enters generation, and when it stops.

[DERIVED] Latent-document generation exposes a different issue: mixing sequence probabilities and mixing next-token probabilities encode different assumptions about evidence use. Both can be called “marginalizing retrieved documents,” yet they optimize different likelihoods and require different decoding. A technically precise account begins with the probability model and its top-$k$ normalization.

## Intuition

[DERIVED] A sequence mixture chooses one latent document for an entire answer, while a token mixture can select a different document at each output position. A concatenated-context decoder instead jointly conditions on all compiled evidence without an explicit latent-document sum. An iterative controller changes the evidence set over time; its learned or heuristic action policy is another component that needs evaluation.

```figure
{
  "id": "fig-50.9",
  "kind": "diagram",
  "title": "Different RAG algorithms carry different state",
  "caption": "A latent document, token mixture and iterative evidence controller encode different dependencies.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.12",
  "alt": "A latent document, token mixture and iterative evidence controller encode different dependencies. Analytical structure, not a measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "q",
        "kind": "state",
        "label": "query and prefix"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "retrieve candidates"
      },
      {
        "id": "c",
        "kind": "branch",
        "label": "generation family"
      },
      {
        "id": "s",
        "kind": "model",
        "label": "sequence / token mixture"
      },
      {
        "id": "j",
        "kind": "model",
        "label": "joint context"
      },
      {
        "id": "v",
        "kind": "feedback",
        "label": "validate / next query"
      }
    ],
    "edges": [
      {
        "from": "q",
        "to": "r",
        "kind": "flow"
      },
      {
        "from": "r",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "s",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "j",
        "kind": "flow"
      },
      {
        "from": "s",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "j",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "r",
        "kind": "flow",
        "label": "bounded retrieval"
      }
    ]
  }
}
```

[PAPER-REPORTED] Original RAG uses DPR retrieval and a BART generator, fine-tuning the query encoder and generator while keeping the document encoder/index fixed. It distinguishes sequence-level and token-level latent-document marginalization. These historical models are more specific than today's generic retrieve-and-prompt pattern. [P40, §§2.1–2.4]

## Formulation

[DERIVED] Let $\mathcal K(x)$ be the retrieved set and $\alpha_x=\sum_{d\in\mathcal K(x)}p_\eta(d\mid x)>0$ its probability mass under a full-corpus retriever. Define the normalized restricted distribution $\pi_d=p_\eta(d\mid x)/\alpha_x$. With $T$ target tokens, the two normalized models are

$$
 P_{\rm seq}(y\mid x)=\sum_{d\in\mathcal K}\pi_d
       \prod_{t=1}^T p_\theta(y_t\mid x,d,y_{<t}),\qquad
 P_{\rm tok}(y\mid x)=\prod_{t=1}^T
       \sum_{d\in\mathcal K}\pi_d p_\theta(y_t\mid x,d,y_{<t}).
$$

(Eq. 50.9)

[MATHEMATICALLY-DERIVED] If one instead retains unnormalized full-corpus weights in these truncated sums, the sequence expression has total mass $\alpha_x$ and the token expression total mass $\alpha_x^T$ for fixed-length outputs. Normalizing changes their log-likelihoods by $-\log\alpha_x$ and $-T\log\alpha_x$, respectively. The distinction matters for training when $\alpha_x$ depends on retriever parameters. A softmax over only retrieved scores implements a normalized restricted distribution.

[MATHEMATICALLY-DERIVED] For positive sequence likelihood, fix $\mathcal K$ locally and let $\pi=\operatorname{softmax}(s)$. Define document posterior
$\gamma_d=\pi_d p_\theta(y\mid x,d)/P_{\rm seq}(y\mid x)$.
For negative sequence log-likelihood,
$$
 \frac{\partial[-\log P_{\rm seq}(y\mid x)]}{\partial s_d}
   =\pi_d-\gamma_d.
$$

(Eq. 50.10)

[MATHEMATICALLY-DERIVED] This follows from
$\partial\pi_j/\partial s_d=\pi_j(\mathbf1[j=d]-\pi_d)$.
For the token mixture, the corresponding gradient sums $\pi_d-\gamma_{t,d}$ over positions, with each posterior conditioned on the observed next token and prefix. These are different learning signals. Neither derivation differentiates through discontinuous top-$k$ membership or approximate search.

[MATHEMATICALLY-DERIVED] The sequence mixture still admits a causal factorization, but its next-token weights update with the realized prefix:
$$
 \omega_{t,d}=
 \frac{\pi_d p_\theta(y_{<t}\mid x,d)}
      {\sum_j\pi_jp_\theta(y_{<t}\mid x,j)},\qquad
 P_{\rm seq}(y_t\mid x,y_{<t})
 =\sum_d\omega_{t,d}p_\theta(y_t\mid x,d,y_{<t}).
$$

(Eq. 50.11)

[DERIVED] Using the original prior $\pi_d$ at every position instead produces the token mixture. Thus a fixed-prior probability-mixture decoder is not exact sequence-mixture decoding. Exact search over output strings remains combinatorial; beam proposals and rescoring introduce additional approximations even when each likelihood is computed correctly.

## Mechanism

[PAPER-REPORTED] The RAG paper's sequence decoder proposes candidates through document-specific beams and either thoroughly scores missing document/candidate pairs or uses a cheaper approximation that drops their probability. Its token model uses a marginalized next-token distribution. The source's candidate search is approximate; it does not prove that the highest-probability answer is found. [P40, §2.5]

[DERIVED] In a single-pass compiled-context system, evidence selection and prompt construction precede generation. This avoids sequential retrieval control but makes initial evidence sufficiency a critical boundary. Iterative retrieval alternates query construction, evidence acquisition, compilation and generation. Its current answer is an observation used to plan a query, not an authoritative fact that should overwrite source evidence.

[PAPER-REPORTED] Self-RAG trains expanded-vocabulary retrieval/critique tokens using offline critic-augmented data. At inference it can retrieve adaptively and rank passage-conditioned segment continuations with weighted relevance/support/utility scores. The learned critic signal is a model prediction, not an independent support certificate. [R50.5, §§3.1–3.3]

[DERIVED] A reconstruction of that objective is ordinary next-token cross-entropy over answer and reflection tokens, with retrieved evidence positions excluded from the prediction loss. Inference adds a separate selection score using normalized reflection probabilities. Changing those weights changes the policy without changing learned parameters; a higher support score can shorten outputs or sacrifice coverage. Training the model to emit a confidence-like symbol does not calibrate it under every corpus shift.

[DERIVED] Corrective retrieval must distinguish candidate relevance from evidence sufficiency. A relevance reranker can filter topical distractors, but it cannot by itself verify a claim's entailment or determine that all required facts are present. Query planning should represent unanswered dependencies and produce a new query targeted to them. Repeating the same query without new evidence spends budget without a mechanism for improvement.

[PAPER-REPORTED] LongEval's corrective pipeline uses a MiniLM MS-MARCO cross-encoder before generation and post-generation citation repair. The paper calls the prefilter threshold “entailment,” but the disclosed model is a relevance reranker. Its 47-query paired analysis finds no statistically significant improvement in citation faithfulness or answer relevancy. [R50.8, §§3.3 and 5]

```figure
{
  "id": "fig-50.10",
  "kind": "calculator",
  "title": "Truncated mass changes normalization",
  "caption": "Illustrative fixed-length output: unnormalized sequence and token mixtures retain different total probability mass.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-50.9",
  "alt": "Illustrative fixed-length output: unnormalized sequence and token mixtures retain different total probability mass. Analytical structure or illustrative values, not book-measured results.",
  "spec": {
    "tex": "m_{seq}=a,\\quad m_{tok}=a^T",
    "inputs": [
      {
        "symbol": "a",
        "label": "retrieved full-corpus mass",
        "default": 0.8,
        "min": 0.001,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "t",
        "label": "fixed output length",
        "default": 10,
        "min": 1,
        "max": 1000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "s",
        "label": "sequence-mixture total mass",
        "formula": "a",
        "format": "ratio"
      },
      {
        "symbol": "m",
        "label": "token-mixture total mass",
        "formula": "a^t",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

### Algorithm 50.3 — Bounded evidence-generation control

[DERIVED] Algorithm 50.3 is a bounded retrieval/generation controller synthesized from these families. Inputs are query $q$, corpus snapshot/access principal, compiler, generator, verifier, round cap $J$, deadline $D$ and enforced total work budget $B$. Initialize evidence $E=\varnothing$, answer=none, unanswered dependencies from $q$, and $B_{\rm rem}=B$.

$$
\begin{aligned}
1.\;&\text{For }j=1,\ldots,J,\text{ initialize action to stop; test remaining deadline/budget}.\\
2.\;&\text{Choose retrieval, generation or revision from recorded dependencies and evidence;}\\
 &\text{no feasible action}\Rightarrow\text{return explicit insufficient-evidence/budget result}.\\
3.\;&\text{Reserve action's capped work }c\le B_{\rm rem};\
 B_{\rm rem}\leftarrow B_{\rm rem}-c;\\
 &\text{dispatch exactly the action in step 4 through this timeout wrapper; reconcile actual cost}.\\
4.\;&\text{Retrieval}\Rightarrow\text{validate access/revision, merge evidence and record empty/duplicate returns};\\
 &\text{generation/revision}\Rightarrow\text{compile approved context, generate a private candidate}.\\
5.\;&\text{Candidate exists}\Rightarrow\text{reserve separate capped verifier cost before any check;}\\
 &\text{unaffordable check}\Rightarrow\text{return unverified/abstention};\ \text{otherwise validate with timeout};\\
 &\text{passes declared final contract}\Rightarrow\text{return answer with provenance};\\
 &\text{otherwise record defects; a revision must address new evidence or a named defect}.\\
6.\;&\text{No evidence/state progress, timeout or final round}\Rightarrow
 \text{return bounded abstention/partial answer by contract}.
\end{aligned}
$$

(Eq. 50.12)

[DERIVED] The invariant is that intermediate guesses do not become source truth and unsupported candidates remain private. Step 3 reserves the selected retrieval/generation/revision action; step 5 separately reserves verification, and each actual dispatch occurs once. Generation, verification and retrieval all consume budget; an action without an enforceable cap is infeasible. An empty retrieved set or undefined next action cannot fall through into an ungrounded final answer. This controller is an engineering synthesis, not a claim that every cited system implements these exact guards.

## Implementation

[OFFICIAL-DOCUMENTATION] Current Hugging Face RAG source reshapes vocabulary log-probabilities by batch/document/token axes. Sequence loss sums token scores before document log-sum-exp; token loss marginalizes documents before summing target positions. Document scores are normalized over the provided retrieved set. This unpinned source was inspected without execution. [R50.13, RagSequenceForGeneration.get_nll and RagTokenForGeneration.get_nll]

[DERIVED] AI_REFERENCE_STACK §4 **#26 Hugging Face Transformers**, layer **Model definition / adaptation**, and **#17 PyTorch**, layer **Model / autograd framework**, expose the tensor/probability operations; **#41 vLLM**, layer **Inference engine**, is the reported Self-RAG execution route. The external controller is separate from these model operators.

[DERIVED] Latent-document scoring with $k$ contexts can multiply generator state and work by roughly $k$ before batching/reuse effects. Thorough sequence rescoring additionally scales with proposed candidates and documents not already scored. Segment beam search retains multiple prefixes and passage-specific KV states. Iterative retrieval adds sequential query/generation dependencies; parallel passage evaluation reduces critical path only with sufficient hardware/memory capacity.

[DERIVED] Parameters include retriever, generator and any separate critic/verifier; training and inference copies need not coincide. Memory includes embeddings/index outside this chapter, tokenized evidence, model weights, beams and KV. Communication includes retrieval payloads and distributed model execution. Energy/money includes all failed attempts, probes and revisions. Fewer final answer tokens do not imply lower total cost if many internal candidates were generated.

## Experimental design

### Methodology

[PAPER-REPORTED] Self-RAG compares instruction-tuned retrieval baselines and learned reflection-based generation across short/long answer and classification tasks. Its main training uses 150k pairs; the component ablation uses 50k and an ASQA subset. Those protocols must remain separate. [R50.5, §§4–5.2]

### Reported experiments

[PAPER-REPORTED] Table 2 gives Self-RAG-7B ASQA short-answer recall 30.0 and citation recall 67.8, while the same-data Llama2-FT baseline has 31.0 and 7.5. The method markedly changes attribution behavior without uniformly improving every correctness metric. Its learned scores and search policy therefore require a vector of outcomes. [R50.5, Table 2]

[PAPER-REPORTED] Original RAG's Table 1 reports NQ exact match 44.5 for sequence and 44.1 for token marginalization under its historical corpus/models. These small task-specific differences do not establish a universally better latent-variable formulation. [P40, §3 and Table 1]

## Observations

**What the paper claims.** [PAPER-REPORTED] Self-RAG's retrieval/critique tokens support adaptive evidence use and controllable segment selection. [R50.5, §3]

**What the evidence shows.** [PAPER-REPORTED] Its outcomes differ across correctness, attribution and fluency; LongEval's corrective intervention does not show significant paired improvement on its limited query set. [R50.5, Table 2; R50.8, §5]

**What we infer.** [DERIVED] Iteration is useful when it changes evidence or resolves a specific defect. Learned critique, probabilistic marginalization and independent validation are distinct mechanisms with different failure modes.

**What remains unknown.** [NOT-DISCLOSED] No inspected evidence gives a universal stopping policy or guarantees critic calibration under corpus/model shifts. This manuscript has no executed controller or search-cost measurement.

## Failure modes

[DERIVED] A token mixture can splice incompatible document interpretations. A sequence mixture can overcommit to one incomplete passage. Self-generated queries can amplify a false intermediate premise. Reflection scores can reward the model's own error. Repeated revision can polish unsupported claims without new evidence. Search can select a high-scoring answer because the verifier shares its blind spots.

## Siblings

[DERIVED] Single-pass RAG minimizes control depth. Latent mixtures expose explicit document responsibilities. Joint-context generation can combine facts directly but has no explicit document posterior. Learned retrieval/critique policies adapt evidence use at the cost of training and search. External corrective controllers add independent checks and bounded fallback, with extra sequential latency.

```figure
{
  "id": "fig-50.11",
  "kind": "compare",
  "title": "Strategy state and stopping boundaries",
  "caption": "The generation family determines which probabilities or controller state must be retained.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.12",
  "alt": "The generation family determines which probabilities or controller state must be retained. Analytical structure or illustrative values, not book-measured results.",
  "spec": {
    "axis": "Evidence dependence and extra work",
    "columns": [
      {
        "id": "m",
        "label": "Sequence mixture"
      },
      {
        "id": "t",
        "label": "Token mixture"
      },
      {
        "id": "p",
        "label": "Iterative controller"
      }
    ],
    "rows": [
      {
        "dimension": "Latent state",
        "values": {
          "m": "one document per answer",
          "t": "document per next token",
          "p": "evidence/dependency ledger"
        }
      },
      {
        "dimension": "Decoding",
        "values": {
          "m": "prefix posterior or rescoring",
          "t": "prior-weight next-token mixture",
          "p": "retrieve / compile / revise"
        }
      },
      {
        "dimension": "Main added cost",
        "values": {
          "m": "document beams and rescoring",
          "t": "parallel document contexts",
          "p": "sequential calls and checks"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage is latent-document learning, joint evidence fusion, adaptive retrieval and validated revision. An unresolved question is whether learned critique transfers to new evidence distributions without becoming overconfident. Settling evidence requires independent support labels, fixed compute/coverage boundaries, intervention tests and evaluation after corpus/model updates, not only higher self-assessment scores.

## Limitations

[DERIVED] Eq. 50.10 treats the retrieved set as fixed. Eq. 50.11 is an exact conditional identity, not an efficient exact decoder. The controller bounds resource use but cannot guarantee that sufficient evidence exists or that a verifier recognizes every unsupported claim. More iterations expand opportunities for both correction and error.

## Reproducibility

[UNVERIFIED] No model/controller was executed. Reproduction needs corpus/retriever snapshots, top-$k$ normalization, model/tokenizer revisions, beam/candidate settings, reflection weights, query traces, context manifests, all internal token counts, verifier decisions and stop reasons. Proposed equal-budget strategy comparisons appear only in [verification](verification.md).

## References

[DERIVED] [P40, RAG](https://arxiv.org/html/2005.11401v4); [R50.5, Self-RAG](https://arxiv.org/html/2310.11511v1); [R50.8, LongEval](https://arxiv.org/html/2607.14400v1); [R50.13, implementation](https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/models/rag/modeling_rag.py). Exact locators/revisions are in [references](references.md).
