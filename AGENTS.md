# Pixelgram

## Architecture

Three services are deployed through Kubernetes:

- `apps/backend` — Go API using `net/http` and `pgx`
- `apps/database` — `migrate/migrate` migration image, run as a backend init container
- `apps/frontend` — SvelteKit 2 SSR application using Svelte 5, strict TypeScript, Vite, adapter-node, Tailwind v4, DaisyUI 5, and Lucide

Each service owns its dependencies and Dockerfile. There is no monorepo or npm workspace tooling.

Before changing files under `apps/backend/` or `apps/frontend/`, read that directory's `AGENTS.md`.

## Commands

```sh
make                     # build and push all images
make backend             # backend image
make database            # migration image
make frontend            # frontend image
make lint                # backend formatting check and frontend lint
make test                # backend and frontend unit tests
make test-integration    # PostgreSQL integration tests
./scripts/deploy.sh      # preferred local kind deployment
```

Images are tagged `localhost:5000/pixelgram/<service>`.

### Manual Kubernetes workflow

```sh
kubectl create namespace pixelgram
kubectl create secret generic database-credentials -n pixelgram \
  --from-literal=postgres-password="$(openssl rand -hex 32)" \
  --from-literal=session-hash-secret="$(openssl rand -hex 32)"
kubectl apply -f ./deploy -n pixelgram
kubectl port-forward service/frontend 8080 -n pixelgram
```

Cleanup:

```sh
kubectl delete -f ./deploy -n pixelgram
kubectl delete namespace pixelgram
```

## Engineering Standards

- Follow SOLID, KISS, DRY, YAGNI, and the Pareto principle. Keep changes focused, prefer simple local patterns, and do not build for hypothetical requirements.
- Before adding code, search for an existing abstraction, helper, or platform primitive to extend or compose. Add an abstraction only when it removes concrete complexity or duplication.
- Name variables, functions, types, and constants precisely. Avoid vague names and non-standard abbreviations. Use named constants for repeated or policy-significant values.
- Prefer concise code only when it remains clear and maintainable.
- Use standard-library, platform, and established project primitives before introducing custom implementations or dependencies.
- Keep changes cohesive. Resolve directly related defects discovered in the code being changed, but do not expand into unrelated cleanup.
- Comments are concise and explain constraints, invariants, security decisions, or non-obvious intent. Do not narrate straightforward code, preserve implementation history, or use comments to compensate for unclear names and structure.
- Regenerate generated code instead of editing it manually.
- Write behavior-oriented tests focused on critical paths, complex logic, and high-risk failure modes rather than chasing coverage percentages.
- Services must remain stateless and correct with multiple replicas.

## Git and Commits

- Use one logical change per commit. Do not bundle unrelated fixes, refactors, or infrastructure changes. Tests required by a behavior change belong in the same commit.
- Write commit subjects in imperative present tense.
- Commit messages are a single line, at most 72 characters, with no body, trailers, or issue references.
- Review the staged diff before committing and ensure it contains only the intended change.
- Create commits only when the user explicitly requests them.

## Secure Engineering

Security controls are design constraints, not review-time additions.

- Validate untrusted data at the boundary where it enters the system and bound external reads before parsing or allocation.
- Authorization defaults to deny. Keep ownership checks next to the protected data operation and make them atomic where practical.
- Use parameterized queries exclusively. Never interpolate request data into SQL.
- Keep secrets out of code, committed configuration, URLs, client storage, and logs.
- Use standard-library cryptography and constant-time comparisons for credentials, MACs, and tokens. Do not invent cryptographic protocols.
- Make cross-replica check-then-act operations atomic with transactions, locks, or database constraints. Retried writes and event processing must be idempotent.
- Every outbound network call requires an explicit timeout, bounded response read, deliberate retry policy, destination validation where user-influenced, and safe error handling.
- Never render user-controlled HTML directly. Validate user-controlled URLs against an explicit scheme and origin policy.
- Use structured logging without secrets, credentials, request bodies, unnecessary personal data, or user-controlled text in log messages.
- Keep dependencies current and justify each new dependency's maintenance, security, and runtime cost.
- Containers run non-root with a read-only root filesystem, all capabilities dropped, and `seccompProfile: RuntimeDefault`.

## Database Migrations

- Migrations live in `apps/database/migrations/` and use paired `NNNNNN_description.up.sql` and `.down.sql` files.
- Use two-space indentation.
- Applied migration history is append-only. Fix deployed schemas with corrective migrations rather than rewriting existing files.
- Migrations run through the backend deployment's init container and must complete before the backend starts.

## Definition of Done

Implementation is not completion. Before reporting a change as complete:

1. Identify every untrusted input touched, where it is validated, and what size or resource bounds apply.
2. Confirm the authentication, authorization, and ownership checks gating each protected operation.
3. Confirm every check-then-act sequence is atomic where concurrent requests or replicas can race.
4. Confirm external calls have timeouts, bounded responses, deliberate retry policies, and safe error handling.
5. Confirm background work has panic recovery, the correct context lifetime, and cross-replica coordination where needed.
6. Test how crafted input could expose data, inject content, bypass limits, or create disproportionate work.
7. Add behavior-oriented tests for the critical success and failure paths.
8. Review the complete diff in context for correctness, security, unnecessary complexity, duplication, inconsistent naming, stale comments, and accidental unrelated changes.
9. Fix issues found during review, then run the relevant formatters, linters, tests, and build checks in proportion to the change's risk.
10. Report any verification that could not be run and any remaining risk explicitly. Do not describe partially verified work as fully complete.
