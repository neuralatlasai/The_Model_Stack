# Node.js & JavaScript Engineering Standards

## 1. Purpose

This file defines the mandatory engineering baseline for Node.js services, JavaScript packages, browser/front-end code, repository structure, testing, security, release, and documentation.

Requirements use **MUST**, **MUST NOT**, **SHOULD**, and **MAY** normatively. A **MUST** violation blocks merge/release unless a documented, time-bounded exception is approved.

The standard applies to `.js`, `.mjs`, `.cjs`, `package.json`, browser modules, tests, build code, and CI/CD. TypeScript MAY be used, but never replaces runtime validation or Node/browser contracts.

## 2. Normative Baseline

- **ECMA-262:2026** is the stable language baseline; later syntax MUST be TC39 Stage 4 and supported by the declared runtime/browser matrix.
- Production MUST use an **Active/Maintenance LTS** Node.js line. On 2026-09-20, Node.js 24 (`Krypton`) is LTS; Node.js 26 is Current and SHOULD run in compatibility CI.
- Node.js documentation governs ESM, built-ins, streams, workers, process lifecycle, permissions, and runtime behavior.
- Browser code follows WHATWG HTML/Fetch/URL; Web Platform Baseline SHOULD define default feature availability; limited features need explicit support/fallback decisions.
- User-facing web apps MUST target **WCAG 2.2 AA**. **ESLint 10+ flat config** governs static analysis; Prettier SHOULD govern mechanical formatting.
- npm contracts govern `package.json`, lockfiles, installation, provenance, and publishing; security SHOULD map to **OWASP Top 10:2025** and, where appropriate, **OWASP ASVS 5.0**.
- IEEE/ISO/IEC MAY govern lifecycle/process assurance only; they MUST NOT be represented as JavaScript, Node.js, npm, or browser coding authorities unless they explicitly define the subject.

## 3. Repository Architecture

```text
repository/
├── package.json
├── package-lock.json
├── README.md
├── LICENSE
├── CHANGELOG.md
├── SECURITY.md
├── CONTRIBUTING.md
├── standards.md
├── eslint.config.js
├── prettier.config.js
├── src/
│   ├── index.js
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── web/
├── public/
├── tests/{unit,integration,e2e,fixtures}/
├── docs/adr/
├── scripts/
└── .github/{workflows,CODEOWNERS,pull_request_template.md}
```

- Runtime source MUST have a deliberate source root; tests, fixtures, generated output, and deployment assets remain separate.
- Monorepos MAY use `apps/`/`packages/`, but each workspace MUST define ownership, dependency direction, entry points, tests, and build contract.
- Root contains only project-wide configuration, governance, documentation, and build/release entry points.
- `node_modules/`, caches, coverage, local `.env`, credentials, IDE state, and ordinary build output MUST NOT be committed.
- A clean checkout MUST install, lint, test, build, and package using repository-controlled configuration only.

## 4. JavaScript Source and Modules

- New Node.js code MUST be **ESM-first**; `.js` ESM packages declare `"type": "module"`; `.cjs` is limited to explicit CommonJS interoperability.
- Relative ESM imports MUST include real file extensions; Node built-ins SHOULD use `node:` specifiers; bundler-only resolution MUST NOT leak into Node modules.
- `const` is default; `let` requires reassignment; `var` is forbidden. Use `camelCase`, `PascalCase`, and `UPPER_SNAKE_CASE` only for true constants.
- Shared/published modules SHOULD prefer named exports; public exports MUST be intentional; consumers MUST NOT depend on unexported deep paths.
- Module import MUST NOT unexpectedly start servers, perform network/destructive I/O, exit the process, or mutate application-global state; startup belongs in explicit bootstrap code.
- `eval`, `Function(...)`, implicit globals, platform-prototype mutation, and uncontrolled dynamic code loading require explicit product need plus security review.

## 5. Formatting and Readability

- Source MUST be UTF-8, LF-terminated, formatter-controlled, and reproducible across developer/CI environments.
- Prettier SHOULD own layout; ESLint SHOULD own correctness. Formatting churn SHOULD NOT obscure behavioral review.
- Use strict equality (`===`, `!==`); coercion across string/number/boolean boundaries MUST be explicit.
- Optional chaining/nullish coalescing SHOULD express real optionality, not hide required invariants.
- Nested ternaries, clever coercion, deep callback nesting, and compressed control flow SHOULD be replaced when auditability decreases.
- Comments explain intent/invariant/risk, not syntax; TODO/FIXME debt SHOULD reference an owner/issue; suppressions MUST be narrow, local, and justified.

## 6. Contracts, Types, and Documentation

- Public APIs MUST expose machine-checkable contracts through checked JSDoc, `.d.ts`, TypeScript, schema-derived types, or equivalent repository tooling.
- Static types do **not** validate runtime data; HTTP/message/file/environment/database/third-party input MUST be validated at trust boundaries.
- Public callables MUST make inputs, return/Promise semantics, nullability, failures, cancellation, side effects, and mutation ownership discoverable.
- Ambiguous positional/boolean arguments SHOULD become named options; mutable objects MUST NOT cross boundaries without explicit ownership semantics.
- Consumer-branchable failures SHOULD expose stable classes/codes; callers MUST NOT parse human error strings.
- `README.md` MUST state supported Node/browser versions, install/run/test/build, configuration, deployment/package contract, and compatibility policy; long-lived decisions SHOULD use ADRs and breaking changes require migration guidance.

## 7. Async, Event Loop, State, and Resources

- Event-loop/request paths MUST NOT perform unbounded CPU work or synchronous filesystem, crypto, compression, or child-process operations.
- `async`/`await` and Promises SHOULD be default; every Promise MUST be awaited, returned, collected, or deliberately detached with rejection/lifecycle handling.
- Outbound network/IPC MUST have finite timeouts; cancellable work SHOULD accept/propagate `AbortSignal`.
- Unbounded `Promise.all(data.map(...))` is forbidden; use bounded concurrency, batching, queues, or streams. `forEach(async ...)` MUST NOT implement awaited sequencing.
- Streams MUST honor backpressure; CPU-heavy work SHOULD use a bounded `worker_threads` pool/external worker. Mutable request state MUST NOT live in module globals.
- Caches require capacity/eviction/lifetime rules; files, sockets, timers, listeners, clients, streams, and workers require deterministic cleanup; shutdown stops intake, drains/cancels bounded work, closes resources, then exits.

## 8. Errors, Logging, and Observability

- Throw/reject only `Error` objects/subclasses; translated errors SHOULD preserve the original via `cause`.
- Catch blocks MUST recover, translate, add useful context, clean up, or terminate a boundary; empty catches/log-and-ignore behavior are forbidden.
- API errors MUST use stable status/code semantics and MUST NOT expose stacks, credentials, tokens, internal paths, or infrastructure details.
- Production logs SHOULD be structured with timestamp, severity, event, service/version, and trace context; secrets/sensitive payloads MUST NOT be logged.
- Services SHOULD measure rate, errors, p50/p95/p99 latency, saturation/queueing, memory/heap, and event-loop health; distributed calls SHOULD propagate correlation/trace context.

## 9. Front-End and Browser Engineering

- Semantic HTML/native controls MUST carry meaning; JavaScript/ARIA reimplementations are secondary and MUST not contradict native semantics.
- Browser APIs SHOULD be Baseline Widely Available; limited/new features require verified support, feature detection, or fallback.
- Untrusted text uses safe DOM text/property APIs; markup-interpreting sinks such as `innerHTML` require trusted or correctly sanitized/encoded input.
- Client state MUST have one owner; avoid duplicated derived state; remove listeners/observers/timers with their owning view/component.
- Browser requests MUST define failure, timeout/cancellation, stale-response, authentication, and bounded retry behavior.
- WCAG 2.2 AA includes keyboard use, visible focus, labels, semantic structure, alternatives, and required status/error announcements.
- Critical flows SHOULD meet field p75 **LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1**; shipped JavaScript/main-thread work SHOULD have explicit budgets.

## 10. Testing

- Every defect fix MUST include a regression test unless reproduction is infeasible; omission requires a documented reason.
- Unit tests cover deterministic logic; integration tests exercise real boundary contracts; E2E tests cover critical user/system journeys.
- `node:test` MAY be the dependency-light default; alternatives MUST support repository ESM, async failure semantics, coverage, and supported Node lines.
- Tests MUST be deterministic, order-independent, self-cleaning, and parallel-safe where configured; fixed ports, sleeps, live services, and developer state MUST NOT be hidden dependencies.
- Time, randomness, environment, network, filesystem, and third-party APIs MUST be controlled at the correct boundary.
- Front-end critical paths SHOULD run supported browsers and accessibility/keyboard assertions where relevant. Coverage is a guardrail; changed failure, authorization, retry, cancellation, and concurrency paths need explicit tests. Flaky tests are defects.

## 11. Static Analysis and Build Gates

- CI MUST run clean install, format check, ESLint, contract/type check when configured, tests, production build, package validation, and dependency/security checks.
- ESLint MUST use flat config; new warnings MUST NOT become accepted debt; suppressions remain localized and justified.
- Node-targeted code SHOULD run directly on supported Node when transpilation is unnecessary; compilers/bundlers MUST have a defined compatibility/build purpose.
- Browser builds MUST declare target compatibility; polyfills MUST be demand-driven rather than inherited from opaque defaults.
- Production source maps SHOULD preserve artifact-to-source diagnosis with threat-modelled access; front-end builds SHOULD enforce bundle/performance budgets.
- Gates MUST reproduce from clean checkout using `npm ci` or equivalent frozen installation.

## 12. Dependencies and Packaging

- `package.json` plus committed lockfile are authoritative; runtime, dev, and peer dependencies MUST be classified correctly.
- Packages MUST declare module/runtime intent (`type`, supported Node range, and `exports` when publishing); public entry points MUST be intentional.
- Applications/CI MUST use the committed lockfile with `npm ci`; CI MUST fail rather than rewrite an inconsistent lockfile.
- Source MUST NOT import undeclared transitive dependencies or dependency-private paths outside supported exports.
- New dependencies require review of platform alternatives, maintenance, license, provenance, security history, transitive/install/native cost, browser impact, and replacement cost.
- Lifecycle scripts/native addons/binary downloads are executable supply-chain surfaces; vulnerability acceptance needs reachability/exploitability review, owner, control, and expiry. npm publishing SHOULD use OIDC trusted publishing/provenance.

## 13. Configuration and Secrets

- Environment-specific values stay outside source; `process.env` SHOULD be read once at a configuration boundary, validated/typed, then passed inward.
- Required configuration MUST fail fast; credentials, authorization behavior, production endpoints, and persistence targets MUST NOT receive silent unsafe defaults.
- Configuration precedence MUST be deterministic/documented; multiple sources MUST NOT unpredictably overwrite each other.
- Secrets MUST NOT appear in source, committed `.env`, browser bundles, fixtures, examples, logs, exceptions, or generated artifacts; secret scanning SHOULD be enabled.
- Anything embedded in browser HTML/JavaScript is public; server credentials MUST never enter front-end builds. Feature flags require owner, failure/default behavior, observability, and removal/expiry plan.

## 14. Git and Change Control

- Default/release branches MUST require pull requests and required CI; emergency direct changes require a controlled, auditable path.
- Non-trivial production changes SHOULD receive qualified review; high-risk areas SHOULD use CODEOWNERS or equivalent ownership controls.
- Force-push/deletion MUST be disabled on protected branches except controlled administration; required checks SHOULD originate from trusted CI identities.
- Pull requests MUST be coherent; unrelated refactors, formatting churn, dependency upgrades, and behavior SHOULD be separated when review improves.
- Lockfile/generated/schema/migration diffs MUST be explainable; review covers correctness, async lifecycle, API compatibility, security, observability, tests, runtime/browser support, performance, rollout, and rollback.

## 15. Release Engineering

- Releases MUST originate from reviewed source and passing CI; deployed artifacts MUST trace to commit, workflow, lockfile, and release identifier.
- **Build once, promote the same immutable artifact**; production MUST NOT rebuild with different dependency resolution/tooling.
- Published packages use Semantic Versioning; services use a documented release/version identifier.
- npm publishing SHOULD use OIDC/provenance and least-privileged credentials isolated from untrusted pull-request execution.
- Node services MUST define readiness/liveness where applicable, bounded graceful shutdown, and rollback/forward-recovery.
- Zero-downtime schema/protocol changes MUST tolerate old/new versions concurrently; destructive changes SHOULD follow expand → migrate → contract.
- Hashed browser assets SHOULD be immutable/long-cacheable while HTML/manifests remain refreshable; published artifacts are never silently replaced.

## 16. Security Engineering

- Trust-boundary input MUST be validated for structure, type, length/range, encoding, and authorization before sensitive use.
- Authorization MUST be server-side for every protected resource/action; UI state, route guards, claims, or object IDs are not proof.
- Queries, commands, templates, URLs, and paths MUST use parameterized/context-correct construction; untrusted data MUST NOT become executable syntax.
- `child_process` SHOULD avoid shell interpretation for untrusted input; dynamic code, deserialization, plugins, uploads, and archives require explicit boundary controls.
- Web apps MUST address XSS, CSRF where ambient credentials apply, unsafe CORS, cross-origin messaging, and relevant clickjacking/mixed-content risks; CSP SHOULD provide defense in depth.
- Authentication cookies SHOULD use `Secure`, `HttpOnly`, appropriate `SameSite`, narrow scope, rotation, and bounded lifetime; cryptography uses maintained platform/library primitives.
- Request/upload size, pagination, regex complexity, JSON/decompression work, concurrency, queues, and retries MUST be bounded against resource exhaustion.
- Node Permission Model MAY reduce accidental capabilities but is not a malicious-code sandbox; dependency/secret/supply-chain scanning SHOULD remain enabled.

## 17. Definition of Done

A change is complete only when:

1. Source conforms to declared ECMAScript, Node.js, browser, module, and repository contracts.
2. Format, lint, contract/type, test, build, package, and required security gates pass from a clean environment.
3. Async work has bounded timeout/cancellation/concurrency/resource ownership; no unbounded event-loop, memory, retry, queue, or fan-out path is introduced.
4. Public API/schema/configuration/runtime/browser/backward/deployment compatibility is reviewed.
5. Changed success/failure behavior is tested at the correct boundary; front-end semantics/accessibility/performance remain valid.
6. Observability diagnoses production failure without exposing sensitive data.
7. Documentation, migrations, release notes, dependency/provenance controls, reviews, rollout, and rollback are synchronized.

## 18. Conformance Rule

- **ECMA-262 governs JavaScript semantics; Node.js governs host/runtime behavior; WHATWG/W3C govern the web platform; npm governs package/registry contracts.**
- **IEEE/ISO/IEC governs process/assurance only where adopted and MUST NOT be cited as JavaScript/Node/browser coding authority unless it explicitly defines the subject.**
- Project-local rules MAY be stricter but MUST NOT silently contradict runtime behavior, public contracts, security requirements, or supported runtime/browser policy.
- Conflicts require a documented controlling authority by subject matter plus tests for the selected behavior.
- A **MUST** exception requires scope, reason, risk, owner, compensating control, and expiry/review date; undocumented permanent exceptions are non-conformant.
- Experimental Node/browser/TC39 features require an explicit compatibility decision and MUST NOT become accidental requirements for supported consumers.
- Review this standard when Node LTS, annual ECMAScript, browser matrix, major tooling, or security baseline materially changes.
