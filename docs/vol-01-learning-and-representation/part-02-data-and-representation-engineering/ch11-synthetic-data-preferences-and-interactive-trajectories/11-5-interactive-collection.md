---
id: ms.section.11.5
entity_type: section
title: Interactive collection
short_title: Interactive collection
volume: 1
part: 2
chapter: 11
section: 11.5
slug: 11-5-interactive-collection
parent: ms.chapter.11
prev_sibling: ms.section.11.4
next_sibling: ms.section.11.6
children: []
prerequisites: [ms.section.2.2, ms.section.6.1, ms.section.10.5, ms.section.11.1, ms.section.11.2, ms.section.11.3]
downstream: [ms.section.11.6, ms.section.36.1, ms.section.36.3, ms.section.36.5, ms.section.39.4, ms.section.51.1, ms.section.52.2, ms.section.53.1, ms.section.63.1, ms.section.63.2]
related: [ms.section.34.1, ms.section.60.1]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P43}
  - {type: supported_by, target: paper.P42}
  - {type: implemented_by, target: impl.verl}
  - {type: implemented_by, target: impl.openrlhf}
  - {type: produces, target: concept.trajectory-schema}
axes: {lifecycle: [data, post_training, evaluation], mechanism: [trajectory_schema, environment_interaction, censoring, policy_versioning], feedback_setting: [environment_return, verifiable_reward], modality: [text, tool_trajectory]}
papers: [P42, P43]
implementations: [impl.verl, impl.openrlhf, impl.hugging-face-trl, impl.vllm, impl.sglang]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 11.5 Interactive collection

## Scope

Objective: define the *trajectory schema* — environment states, actions, observations, terminal outcomes, partial episodes, censoring, and policy versions — as a typed data record, and specify how trajectories are collected from environments of the τ-bench (P43) and SWE-bench (P42) kind so that the resulting rows are usable for supervised training, reward modelling, and offline analysis without mis-attributing outcomes. Baseline: a log of chat messages with a final "success" flag. Success: given a trajectory row, a reader can tell which spans the policy produced, under which policy version, what the environment returned, whether the episode ended by success, failure, error, or a budget limit, and whether the outcome label is observed or censored. Boundaries: the rollout *systems* (actor/environment placement, asynchrony, policy lag) are owned by [§36.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-1-agent-trajectories.md), [§36.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-3-environment-infrastructure.md), and [§36.5](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-5-asynchrony-and-mismatch.md); tool representation and execution correctness by [§51.1](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-1-tool-representation.md) and [§51.4](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness.md); agent state and recovery by [§52.2](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch52-planning-control-flow-verification-and-recovery/52-2-state-and-constraints.md) and [§52.5](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch52-planning-control-flow-verification-and-recovery/52-5-recovery.md); the credit-assignment objectives by [§36.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-2-credit-assignment.md); interactive benchmarks as *evaluations* by [§63.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-1-interactive-benchmarks.md).

## Why this exists

What failed before was treating an agent episode as a long chat transcript. The transcript has no notion of *state*, so two episodes with identical text but different database contents are indistinguishable; it has no notion of *who produced which span*, so tool outputs get trained as if the policy wrote them; and it has one flag at the end, so an episode cut off by a step limit is recorded as a failure. The bottleneck that appeared with tool-using agents was that the *outcome* lives in the environment, not in the text: τ-bench evaluates by "comparing the database state at the end of a conversation with the annotated goal state" (PAPER-REPORTED · P43), and SWE-bench by whether `FAIL_TO_PASS` tests pass and `PASS_TO_PASS` tests keep passing after the patch is applied (PAPER-REPORTED · P42). A transcript cannot carry that. The constraint that became dominant is *reliability across trials*: τ-bench's pass^k — "the chance that all k i.i.d. task trials are successful, averaged across tasks", estimated as E_task[C(c,k)/C(n,k)] — exposes that agents that "succeed on <50% of the tasks" are also "quite inconsistent (pass^8 <25% in retail)" (PAPER-REPORTED · P43). A data record that stores one trial per task cannot estimate pass^k, and a record that does not store the policy version cannot say which policy the k trials came from. What changed is that rollout frameworks now emit typed trajectories: verl's multi-turn rollout tracks tool calls and responses per message and masks loss to assistant-generated tokens (OFFICIAL-DOCUMENTATION · R11.13); OpenRLHF documents an agent-based "Multi-Turn Mode" with custom agent functions and asynchronous training (OFFICIAL-DOCUMENTATION · R11.14); τ-bench's runner writes per-task JSON with `task_id`, `reward`, `info`, and `traj` (OFFICIAL-DOCUMENTATION · R11.19). The schema below is the common denominator those emit, with the fields they omit — censoring and policy version per action — made mandatory.

## Intuition

Physically, an interactive episode is a sequence of *decode segments* (the policy's turns) interleaved with *environment computations* (tool execution, database transitions, a simulated user's reply). The policy's cost is decode tokens over a growing context; the environment's cost is CPU, I/O, and wall-clock that the policy waits on. A trajectory record is the log of that alternation with the environment's *state* snapshotted at the boundaries, so that the outcome — a function of the final state — can be recomputed by anyone with the environment. Two things make trajectories different from every other target type. First, the *observation* is not a label and not a target: it is the environment's response and must be masked out of any likelihood. Second, the *terminal outcome* is a random variable of the whole episode, and it is frequently *unobserved*: the episode ran out of steps, tokens, or time; the environment errored; the user simulator drifted. Treating "unobserved" as "failed" biases every statistic downward and, worse, trains the policy to avoid long-but-correct paths. Heuristically, engineers call this "the agent gave up"; the measurable content is right-censoring of the outcome by a budget, which survival analysis has handled for a century and trajectory datasets mostly ignore.

## Formulation

Following P43, an interactive task is a POMDP (𝒮, 𝒜, 𝒪, 𝒯, ℛ, 𝒰) with "𝒮 = 𝒮_db ⊗ 𝒮_user", "𝒜 = 𝒜_db ∪ 𝒜_user", "𝒪 = 𝒪_db ∪ 𝒪_user"; the database transition 𝒯_db is deterministic and the user transition 𝒯_user "is stochastic" (PAPER-REPORTED · P43). For data purposes the book fixes the following record (DERIVED from that formulation plus the Appendix C "RL rollout" and "Agent/software environments" rows):

> **Definition — trajectory schema.** The typed record τ = (header, steps, terminal) where the header identifies the task, environment, initial state, user simulator (if any), and budget; each step records the policy's action with the policy version that produced it, the environment's observation, and a state snapshot or hash; and the terminal block records the outcome verdict, its evidence, and the censoring status.

| Block | Field | Type | Semantics |
|---|---|---|---|
| header | `task_id`, `env_id`, `env_version` | ids | which environment code and data version; P43 ships retail (115 tasks) and airline (50 tasks) with their databases (PAPER-REPORTED · P43); P42's instances carry `repo`, `base_commit`, `environment_setup_commit` (OFFICIAL-DOCUMENTATION · R11.18) |
| header | `s_0` | state hash or snapshot ref | initial environment state (database snapshot id; repository commit) |
| header | `user_sim` | G-tuple or null | the user simulator's generator configuration (§11.1) when the user is a model — P43 used "gpt-4-0613" (PAPER-REPORTED · P43) |
| header | `budget` | {max_steps, max_tokens, max_wallclock} | the limits that can censor |
| header | `trial_index`, `n_trials` | ints | which of n i.i.d. trials this is (needed for pass^k) |
| step t | `policy_version` | id | the policy checkpoint (and σ) that produced action a_t; may differ across t (§36.5) |
| step t | `a_t` | action | the policy's turn: text, tool call (name, arguments), or terminal declaration |
| step t | `o_t` | observation | environment return: tool result, user reply, error string; **never trainable** |
| step t | `s_t` | state hash or diff | environment state after a_t (database diff; repository diff) |
| step t | `t_wall`, `tokens_in`, `tokens_out` | numbers | per-step cost |
| step t | `error` | enum or null | environment-side error at this step (distinct from a wrong action) |
| terminal | `outcome` | {success, failure, censored, env_error} | the verdict class |
| terminal | `evidence` | object | P43: `r_action`, `r_output`; P42: lists of `FAIL_TO_PASS` / `PASS_TO_PASS` results |
| terminal | `censoring` | {none, step_budget, token_budget, wallclock, user_sim_abort, env_error} | why the outcome is unobserved, if it is |
| terminal | `steps_taken`, `ended_at` | ints/time | for survival-style analysis |

*Table 11.3 — Trajectory schema.*

> **Definition — terminal outcome.** The verdict over the *final environment state* (and any required outputs), computed by the environment's evaluator, together with its evidence; it is a property of τ, not of any single step, and it is *observed* only when the episode ended by the policy's own termination or by the environment's terminal condition.

> **Definition — censoring (of a trajectory).** The condition in which an episode ended for a reason unrelated to the task's success — a step, token, or wall-clock budget, a user-simulator abort, or an environment error — so that the terminal outcome is unobserved. A censored trajectory is not a failure; its outcome is missing and its `censoring` field names the cause.

> **Definition — policy version (per action).** The identifier of the checkpoint and sampling controls that produced a specific action; a trajectory whose actions carry more than one policy version is a *mixed-policy trajectory* and must be treated as such by any on-policy estimator ([§36.5](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-5-asynchrony-and-mismatch.md)).

With n trials per task and c successes among *uncensored* trials, the pass^k estimator of P43 applies to the uncensored subset:

$$
\widehat{\mathrm{pass}^k} = \mathbb{E}_{\text{task}}\left[\frac{\binom{c}{k}}{\binom{n_u}{k}}\right],\qquad n_u = n - n_{\text{censored}}
$$
*(Eq. 11.14)* where n_u = uncensored trials; the estimator is unbiased for the probability that k i.i.d. *uncensored* trials all succeed (MATHEMATICALLY-DERIVED as in P43 with n replaced by n_u). Counting censored trials as failures makes it a lower bound; dropping them makes it conditional on completion — the record must say which was done.

For SFT on trajectories, the loss mask is

$$
m_t = \mathbb{1}[\text{token } t \in a_{\text{some step}}]\cdot \mathbb{1}[\text{outcome}(\tau) = \text{success}]\cdot \mathbb{1}[\text{policy\_version}(t) \in \mathcal{V}_{\text{allowed}}]
$$
*(Eq. 11.15)* where the first factor excludes observations (R11.13's "only tokens generated by the assistant are included in the loss mask"), the second restricts to successful episodes (the rejection-sampling gate of §11.3 at the episode level), and the third excludes actions from disallowed policy versions (DERIVED; each factor is a design choice the record makes explicit).

> **Assumption.** The environment is reproducible from (`env_version`, `s_0`, the action sequence) · *sensitivity:* stochastic environments (a model user simulator) are reproducible only if the simulator's G and seeds are recorded — P43 notes that "the user simulation LM might have limited capacity at reasoning, calculation, long-context memorization" and that "the user instruction might contain typos or ambiguities" (PAPER-REPORTED · P43) — so a simulator-caused abort is a censoring cause, not a policy failure.

## Mechanism

**Environment states.** The state is what the outcome is computed from. τ-bench's tasks carry a hidden user instruction and "ground-truth database actions" in JSON, with databases and APIs implemented in Python so that 𝒯_db is deterministic (PAPER-REPORTED · P43); SWE-bench's state is a repository at `base_commit` with an environment setup commit and a Docker image (OFFICIAL-DOCUMENTATION · R11.18). The schema stores a *hash or diff* per step rather than a snapshot because snapshots are large; the initial snapshot is referenced by id. Cost line: per-step state hashing is CPU-cheap; per-step diffs cost storage proportional to the change; full snapshots per step are prohibitive for repositories and unnecessary when the environment is deterministic and replayable.

**Actions.** The policy's turn: free text to the user, a tool call with typed arguments, or a termination. TRL's conversational format carries tool calls as a `tool_calls` list on an assistant message and tool results as `tool` role messages (OFFICIAL-DOCUMENTATION · R11.11); verl's rollout tracks tool calls and results per message and infers tool schemas from function signatures via `transformers.utils.get_json_schema` (OFFICIAL-DOCUMENTATION · R11.13). The schema keeps the *serialised* action (as the policy emitted it) and the *parsed* action (as the environment executed it) because they can differ — a malformed call parsed leniently is a different datum from a well-formed one, and [§51.4](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness.md) owns that boundary. Cost line: decode tokens of the action; the growing context makes step t's prefill cost grow with Σ_{j<t}(|a_j| + |o_j|), so long episodes are super-linear in tokens unless the engine reuses the prefix (Chapter 43).

**Observations.** The environment's return. It is data for the *policy's next decision* and never a target; masking it out of the loss (Eq. 11.15's first factor) is the single most consequential bit in the record. Observations can be long (a file listing, a test log), which makes them the dominant *context* cost; τ-bench's failure analysis includes "wrong arguments" in database reasoning and "partial resolution of compound requests" (PAPER-REPORTED · P43), both of which manifest as observation–action mismatches that a masked record lets one study. Cost line: observation tokens are paid at prefill on every subsequent step; truncation policies (which [§52.2](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch52-planning-control-flow-verification-and-recovery/52-2-state-and-constraints.md) owns) change the policy's input and must be recorded.

**Terminal outcomes.** Computed by the environment's evaluator over the final state: τ-bench's r = r_action × r_output ∈ {0,1} (PAPER-REPORTED · P43); SWE-bench's test verdicts (PAPER-REPORTED · P42). The evidence field stores the evaluator's *inputs and outputs* (which tests ran, which passed; which database rows differed) so that an outcome can be re-derived after an evaluator bug fix — SWE-bench's own history of a human-validated "Verified" subset of 500 problems (OFFICIAL-DOCUMENTATION · R11.18) is evidence that evaluators are revised. Cost line: evaluation is a state comparison (cheap) or a test run (a container and test runtime per episode, which for repository tasks can dominate the episode's cost).

**Partial episodes.** An episode that has not reached a terminal condition carries information — the prefix may be reused (branching from step t with a different policy), scored by a process model, or used to estimate per-step statistics — but it has no outcome. The schema treats a partial episode as a trajectory with `outcome = censored` and a `censoring` cause, never as a failure. Branching (several continuations from a shared prefix) is recorded by lineage pointers to the parent trajectory and the branch step, exactly as §11.1's lineage field records rewrite parents. Cost line: partial episodes have already paid their decode and environment cost; discarding them wastes it, which is the economic argument of §11.6 for storing them.

**Censoring.** The budget fields of the header define the censoring mechanism; P43's runner exposes `--max-concurrency` and trial counts but the step or token budget of a run is a harness setting (OFFICIAL-DOCUMENTATION · R11.19), and SWE-bench evaluations impose per-instance timeouts in the harness (OFFICIAL-DOCUMENTATION · R11.18; the values are configuration and are not asserted here). Under Eq. 11.14, the estimator's denominator must exclude censored trials or the report must state that censored = failed. A subtler form is *informative* censoring: long-running episodes are censored more often, and if long episodes are also more often correct on hard tasks (which is UNVERIFIED for any named environment), then censoring correlates with the outcome and both treatments of Eq. 11.14 are biased in opposite directions. Cost line: the only way to reduce censoring is to raise budgets, which raises the cost of every episode including the ones that would have finished; the trade-off is measured by the censoring rate as a function of the budget, which the record supports.

**Policy versions.** In online RL the policy changes while episodes are in flight; OpenRLHF's asynchronous mode (`--train.async_enable`; OFFICIAL-DOCUMENTATION · R11.14) and verl's rollout workers make it possible for step t and step t+1 of one episode to be produced by different checkpoints. The per-action `policy_version` field is what lets [§36.5](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-5-asynchrony-and-mismatch.md) apply importance corrections or drop stale actions, and what lets a dataset built for SFT restrict to a single version (Eq. 11.15's third factor). It also records the *user simulator's* version separately, because P43's user is itself a policy (the `user_sim` header field), and changes to it change the task distribution. Cost line: an identifier per step; the cost is discipline in the rollout loop, which must read the current checkpoint id at every generation call rather than once per episode.

## Algorithm

```text
Algorithm 11.5 — Trajectory collection with censoring and version tracking
INPUT   task set with environments E (versioned, replayable); policy checkpoints π_v served
        by an engine; optional user simulator with configuration G_u; budgets
        (max_steps, max_tokens, max_wallclock); trials per task n
OUTPUT  trajectory rows τ per Table 11.3; per-task (n, n_u, c); pass^k table by Eq. 11.14
STATE   per-episode step counter, token counter, clock; environment handle; current
        policy version id (read at every action)
INVARIANT  every o_t is stored with trainable = false; outcome ∈ {success, failure} only if
           the episode reached a terminal condition; censoring ≠ none ⇒ outcome = censored
1  For each task and trial i ∈ 1..n:
2     reset E to s_0; write header (task_id, env_version, s_0 hash, G_u, budgets, i, n)
3     loop:
4        v ← current policy version id; a_t ← π_v(context; σ); record (v, a_t, tokens_out)
5        if a_t is terminal: break with reason = policy_terminated
6        (o_t, s_t, err) ← E.step(parsed(a_t)); record o_t (trainable=false), hash(s_t), err
7        if err is an environment failure: break with reason = env_error
8        if steps ≥ max_steps or tokens ≥ max_tokens or clock ≥ max_wallclock:
              break with reason = the first budget exceeded
9     if reason = policy_terminated or E.is_terminal(s_t):
10          (outcome, evidence) ← E.evaluate(s_t, required outputs); censoring ← none
11    else: outcome ← censored; censoring ← reason (mapped to the enum); evidence ← null
12    write τ
13 For each task: n_u ← trials with censoring = none; c ← successes; store (n, n_u, c)
14 Report pass^k for k ≤ min_task n_u by Eq. 11.14, and separately the censored-as-failed
      variant; report censoring rate by cause and by budget
```

DERIVED — complexity: Σ_episodes (decode cost over a growing context + environment cost per step + one evaluation); the decode cost is O(Σ_t (prefix_t + |a_t|)) per episode without prefix reuse. Termination: every loop iteration consumes at least one step and the step budget is finite. Line 4's per-action version read is the invariant that makes mixed-policy trajectories detectable.

## Implementation

The collection loop is the rollout stage of the *Post-training / RL* layer. verl (#37) documents multi-turn rollout on an SGLang (#42, *Inference engine*) backend, with tools declared either as `BaseTool` subclasses configured in YAML or as `@function_tool` functions, a `tool_agent` agent loop, and delta-tokenisation that produces assistant-only loss masks (OFFICIAL-DOCUMENTATION · R11.13). OpenRLHF (#36) runs generation on vLLM (#41) under Ray with an agent-based multi-turn mode and asynchronous training (OFFICIAL-DOCUMENTATION · R11.14). Neither documentation page inspected specifies a censoring field or a per-action policy-version field in its emitted data; those are the book's additions and their absence in a given framework version is NOT-DISCLOSED here rather than asserted. Environments are outside the training stack: τ-bench's runner (`run.py --agent-strategy tool-calling --env retail --model … --user-model …`) writes per-task JSON with `task_id`, `reward`, `info`, and `traj`, supports user strategies `llm`, `react`, `verify`, `reflection`, and ships an `auto_error_identification.py` tool for "fault assignment" and "fault type classification" over trajectories (OFFICIAL-DOCUMENTATION · R11.19); SWE-bench's harness builds Docker images and evaluates predictions per instance (OFFICIAL-DOCUMENTATION · R11.18). The trajectory rows, once gated to `outcome = success`, are written as TRL conversational rows with `tools` and `tool_calls` (OFFICIAL-DOCUMENTATION · R11.11) for SFT, or kept whole for RL. Under §4.2: *Post-training* (online generation, actor placement), *Inference* (prefix reuse across steps), *Reliability* (environment errors and timeouts are recorded outcomes), *Reproducibility* (env_version, image hash, simulator G, per-action policy version).

```text
Systems trace (one episode)
reset env         → latency: container/database restore / failure: s_0 not hashed
policy step t     → compute: prefill over prefix_t + decode |a_t| / memory: KV for prefix_t / failure: version id read once per episode
env step          → compute: tool execution (CPU/IO) / latency: wall-clock the policy waits on / failure: error mapped to "fail"
evaluate          → compute: state compare or test run / failure: evidence not stored
serialise         → storage: steps + hashes + terminal block / failure: observations left trainable
```

## Experimental design

### Experiment 11.5 — Censoring treatment and the estimated reliability of a policy

- **Hypothesis:** for a fixed policy on a τ-bench-style environment, pass^k computed over uncensored trials (Eq. 11.14) and pass^k with censored-as-failed differ by more than the trial-sampling interval at a step budget where ≥ 10% of trials are censored, and the gap closes as the budget rises.
- **Setup:** one policy version; n = 16 trials per task; three step budgets (low, medium, high); user simulator with fixed G_u and seeds; environment version pinned.
- **Independent variables:** step budget; censoring treatment.
- **Controlled variables:** policy, σ, tasks, simulator, environment.
- **Dataset/workload:** the retail and airline task sets of P43 (or an environment of the same structure).
- **Hardware:** one accelerator class for policy and simulator; CPU for the environment; hours logged.
- **Metrics:** pass^1, pass^4, pass^8 under both treatments; censoring rate by cause; per-task intervals by bootstrap over trials (§2.5).
- **Baselines:** the high-budget run (censoring < 2%).
- **Expected result:** the two treatments bracket the high-budget estimate; if the uncensored estimate exceeds the high-budget estimate materially, censoring is informative (long episodes fail more) and the conditional estimator is optimistic.
- **Ablation:** user strategy `llm` versus `verify` to measure simulator-caused aborts.
- **Interpretation:** fixes the budget at which reliability estimates from this environment are stable.
- **Threats to validity:** simulator drift across runs; task-level heterogeneity in episode length.

Proposal only; no run was executed.

## Observations

**What the paper claims.** P43 claims that its POMDP formulation, state-based reward, and pass^k metric reveal that function-calling agents are inconsistent (pass^8 < 25% in retail for gpt-4o) and identifies failure classes (database reasoning, rule following, partial resolution). P42 claims that repository-level issue resolution with test-based verdicts is hard for the models it evaluated (best 1.96% for Claude 2 in the original paper). R11.13 and R11.14 document multi-turn, tool-using rollout with assistant-only loss masks and asynchronous training.

**What the evidence shows.** P43's numbers are for named API models at the time of the paper and are not transferable; its user-simulator caveats are the authors' own. P42's original results are historical; the "Verified" subset exists because the original instances included unsolvable or under-specified items (OFFICIAL-DOCUMENTATION · R11.18), which is direct evidence that terminal-outcome evaluators are revised and that the evidence field must be stored. No inspected source reports censoring rates or informative-censoring analysis for a named agent dataset.

**What we infer.** DERIVED: Eq. 11.14 with n_u is the estimator consistent with P43's definition once censoring exists; the two treatments bracket the truth only under non-informative censoring. DERIVED: Eq. 11.15's three factors correspond to three distinct design decisions that transcripts conflate. ASSUMED: environments are replayable from (version, s_0, actions).

**What remains unknown.** Step and token budgets used to produce any cited agent dataset: NOT-DISCLOSED. Whether verl or OpenRLHF emit per-action policy identifiers in their trajectory outputs at the versions inspected: NOT-DISCLOSED in the pages read. Informative censoring in τ-bench-style environments: UNVERIFIED.

## Failure modes

> **Failure mode — Observation trained as action.** *Symptom:* the policy hallucinates tool outputs or answers before calling the tool. *Cause:* `trainable` not set false on observations. *Detection:* loss-mask coverage of `tool`/`user` spans > 0. *Mitigation:* Eq. 11.15 first factor; delta-tokenisation masks (R11.13).

> **Failure mode — Censored counted as failed.** *Symptom:* reliability estimates fall when budgets are tightened even for a fixed policy. *Cause:* budget-terminated episodes labelled failure. *Detection:* censoring rate by cause; Experiment 11.5. *Mitigation:* Algorithm 11.5 lines 9–11; report both estimators.

> **Failure mode — Mixed-policy trajectory treated as on-policy.** *Symptom:* on-policy estimators degrade under asynchronous rollout. *Cause:* policy version read once per episode. *Detection:* per-action version ids differ within an episode. *Mitigation:* line 4; corrections per §36.5.

> **Failure mode — Simulator abort attributed to the policy.** *Symptom:* a policy's failure rate changes when only the user model changes. *Cause:* user-simulator errors recorded as task failures. *Detection:* `censoring = user_sim_abort` rate; simulator G in the header. *Mitigation:* record G_u; use `verify`/`reflection` strategies (R11.19) and measure.

> **Failure mode — Evaluator drift.** *Symptom:* outcomes of stored trajectories change after an environment update. *Cause:* evidence not stored; outcome re-derived under a new evaluator. *Detection:* env_version mismatch between header and evaluator. *Mitigation:* store evidence; re-evaluate explicitly and record both versions.

## Siblings

**Single-turn rejection sampling** — [§11.3](11-3-selection-and-verification.md)
Why it exists: the outcome is a function of one completion. What assumption changed: here the outcome is a function of the final environment state after many actions, and it can be unobserved. What objective changed: episode-level gate replaces completion-level gate. New failure mode: censoring. Changed primitive: (x, y, V) → τ.

**Agent trajectories in rollout systems** — [§36.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-1-agent-trajectories.md)
Why it exists: trajectories as the unit of RL. What assumption changed: this section fixes the *record*; §36.1 fixes its *production and consumption* at scale. Changed primitive: schema → system.

**Human demonstration of multi-turn dialogue** — [§31.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-3-conversation-semantics.md)
Why it exists: dialogues without an environment. What assumption changed: no state, no evaluator; the "outcome" is a rater's judgement. New failure mode: none of censoring's; all of preference labelling's. Changed primitive: environment state → rater.

**Embodied interaction records** — [Chapter 60](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch60-vision-language-action-policies-and-embodied-foundation-models/README.md)
Why it exists: continuous actions at a control rate. What assumption changed: units, coordinate frames, resets, and intervention records (Appendix C). Changed primitive: discrete tool call → continuous control.

**Interactive benchmarks as evaluation** — [§63.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-1-interactive-benchmarks.md)
Why it exists: score an agent. What assumption changed: the trajectories are not training data; the same schema serves both, and §6.2's non-reuse rule separates them.

## Extensions

Domain adaptation swaps the environment and its evaluator; the schema is unchanged. Long-horizon episodes make the context cost the binding constraint and make truncation a recorded field. Multimodal environments (screens, images) add observation modalities; the `trainable = false` rule is unchanged. Multi-agent episodes (Chapter 54) require a `policy_version` *and* an agent id per action. Proposal: a `branch_of` pointer in the header so that tree-structured collection (several continuations from one prefix) is representable without duplicating prefixes.

## Limitations

Eq. 11.14's correctness depends on non-informative censoring, which is UNVERIFIED for every environment named here. The schema assumes the environment can hash or diff its state; environments with external side effects (real APIs) cannot be reset and produce non-replayable trajectories, which [§51.5](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-5-side-effect-management.md) owns. Falsification: if a controlled study showed that policies trained on trajectories with observations left trainable did not differ from masked training at matched tokens, the first factor of Eq. 11.15 would become a convention rather than a correctness requirement. Decision consequence: no trajectory dataset in this book reports a success rate without its censoring rate and treatment.

## Reproducibility

Versions: P43 arXiv 2406.12045 v1 (HTML: POMDP definition, task counts, reward, pass^k estimator, simulator model and caveats); R11.19 tau-bench repository README (main); P42 arXiv 2310.06770 v3 (abstract) and R11.18 SWE-bench repository README (main: harness command, Verified subset); R11.13 verl multi-turn documentation (latest); R11.14 OpenRLHF README (main); R11.11 TRL v1.13.0 dataset formats (tool-calling rows); all accessed 2026-09-23. Artifacts: the trajectory schema table and the outcome/censoring enumerations in [verification.md](verification.md). Metric definitions: Eq. 11.14 with the censoring treatment stated. Unresolved: budgets and censoring rates of cited agent datasets (NOT-DISCLOSED).

## References

P42, P43; R11.11, R11.13, R11.14, R11.18, R11.19; Appendix C ("RL rollout", "Agent/software environments"); notation.md §2.5.
