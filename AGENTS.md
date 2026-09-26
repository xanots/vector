# AGENTS.md

> For agents **consuming** the published package, see [llms.txt](llms.txt) instead.
> This file is for agents **working on and maintaining** the `@xanots/vector` package itself.

## What This Is

`@xanots/vector` is a XanoTS module providing an end-to-end vector embedding & similarity search pipeline using Google Gemini Embeddings (768 dimensions) and pgvector.

There is **no runtime execution** inside this package: every export is a plain, typed XanoTS def object (`table()`, `defineFunction()`, `tool()`, `apiGroup()`, `query()`) or a def factory. All registration and compilation happens in the consumer's `@xanots/sdk` workspace compiler at `export()`.

## Commands

```bash
# Typecheck
npm run typecheck

# Run test suite
npm test

# Regenerate golden fixture (deliberate act only — see below)
npm run fixture:regen

# Build distribution bundle
npm run build

# Lint
npm run lint
```

## Directory Layout

- `src/options.ts`: Option types, defaults, and the single `resolveOptions` validation gate.
- `src/tables/`: `documentTable` and `chunkTable` (with `f.vector(768)` and HNSW cosine index).
- `src/functions/`: `generateEmbeddingFn`, `chunkTextFn`, `ingestDocumentFn`, and `searchVectorsFn`.
- `src/tool/`: `vectorSearchTool` for AI Agent knowledge retrieval.
- `src/api/`: Endpoint definitions (`group.ts`, `documents.ts`, `search.ts`, `types.ts`, `client-types.ts`).
- `src/register.ts`: `createVector` and `registerVector`.
- `src/index.ts`: The unified public package surface.
- `test/`: Unit tests, options tests, golden bundle tests, published docs contract.
- `scripts/regen-golden.ts`: Regenerates `test/fixtures/golden-bundle.json`.

## Rules That Bite

- **Defs are factories:** `f.tableRef` resolves its target guid eagerly at column-construction time, and the document table is referenced by chunks and queries. Minting defs per `createVector` / `registerVector` call eliminates cross-call identity contamination.
- **Idempotency WeakSet:** The SDK's duplicate-def guard compares def identity. Two `createVector` calls produce distinct objects sharing names, so `registerVector` keeps a `WeakSet<Xano>` to flag duplicate calls early with a clear diagnostic.
- **Literal Stack Tuples:** Function and query stacks must remain literal tuples (`readonly Statement[]`) or `statements(...)` helpers. Spreading an untyped `Statement[]` collapses the stack tuple and widens `InferResponse` to `StackTupleWidened`. `test/types.test.ts` guards this.
- **pgvector Cosine Search:** The HNSW index on `vector_chunk` uses `vector_cosine_ops`, and search evaluates `vector_cos_distance` sorted `asc`.
- **Module manifest:** `package.json` carries a `"xanots"` field (`register: "registerVector"`, `returns: "handle"`, `options: {}`) so `xanots marketplace install` / `xanots init --marketplace` wire the module into `xano/index.ts` and bind the returned handle. Keep `register` in sync with the export name, and keep `options: {}` only while every option stays optional.
- **Search is not owner-scoped:** with `authenticated`, document endpoints filter by `user_id`, but `searchVectorsFn` (and so `/search` and the agent tool) searches every chunk. The docs say so; change both together.
- **Peer Range:** `@xanots/sdk` is a peer dependency (`>=0.0.46 <1.0.0`). Dev dependency is pinned exactly to `0.0.46`.

## The Golden-Bundle Contract

`test/fixtures/golden-bundle.json` is a byte-exact peer-drift tripwire. Any change to statement encoding or schema in `@xanots/sdk` breaks `test/bundle.test.ts`.

Regenerating the fixture is a deliberate, reviewed action (`npm run fixture:regen && git diff test/fixtures/golden-bundle.json`).

## Docs

`README.md` and `llms.txt` ship in the tarball. When options, endpoints, or the SDK floor change, update both, and type-check any code snippet you change against the pinned SDK (the SDK's `agent()` / `workspaceConfig()` shapes have changed before). `test/published-docs.test.ts` checks the shipped file list and relative links, not content.

## Release

1. Bump `version` in `package.json` according to SemVer (pre-1.0: a raised SDK peer floor or other consumer-visible change is a minor bump) and merge it to `main`.
2. Run `npm test && npm run lint && npm run build`.
3. Verify `npm pack --dry-run` contains exactly the expected files.
4. Publish: `npm publish --access public`.
