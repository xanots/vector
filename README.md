# @xanots/vector

[![npm version](https://img.shields.io/npm/v/@xanots/vector.svg)](https://www.npmjs.com/package/@xanots/vector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete, production-grade vector embedding, document ingestion, chunking, and semantic similarity search module for [XanoTS](https://github.com/xanots/sdk). Built around Google Gemini Multimodal Embeddings 2 (`gemini-embedding-2`) at **768 dimensions** with native PostgreSQL `pgvector` indexing and AI agent search tools.

---

## Features

- **Gemini Embeddings 2**: Native multimodal embeddings across text, images (PNG, JPEG, WebP), audio (WAV, MP3), and video (MP4) scaled to **768 dimensions** via Matryoshka Representation Learning (MRL).
- **Cross-Modal Vector Search**: Seamlessly search text-to-text, text-to-image, image-to-image, or visual queries using cosine similarity (`vector_cosine_ops`).
- **Configurable Chunking**: Multi-strategy text segmentation (`paragraph`, `sentence`, `markdown`, `fixed`, `custom`) with configurable chunk size and character overlap.
- **Document Management**: Complete lifecycle tracking (`pending`, `indexing`, `indexed`, `failed`), multi-chunk storage, and atomic reindexing.
- **AI Agent & MCP Tool**: Ready-to-use `vector_search` tool definition for Xano LLM agents and MCP toolsets.
- **Typed Client Interfaces**: End-to-end type safety for request payloads and responses with zero runtime overhead.

---

## Installation

```bash
npm install @xanots/vector @xanots/sdk
```

---

## Quickstart

```ts
import { workspace, workspaceConfig } from "@xanots/sdk";
import { registerVector } from "@xanots/vector";

const ws = workspace("my-app").registerWorkspace(
  workspaceConfig({
    name: "my-app",
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    },
  }),
);

export const vector = registerVector(ws, {
  apiKeyEnv: "GEMINI_API_KEY",
  defaultStrategy: "markdown",
});

export default vector.xano;
```

---

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKeyEnv` | `string` | `"GEMINI_API_KEY"` | Environment variable name storing the Google Gemini API key. |
| `model` | `string` | `"gemini-embedding-2"` | Embedding model identifier (`gemini-embedding-2`). |
| `defaultStrategy` | `ChunkStrategy` | `"paragraph"` | Default chunking strategy: `fixed`, `paragraph`, `sentence`, `markdown`, `custom`. |
| `defaultChunkSize` | `number` | `500` | Target character count per chunk (20 to 10000). |
| `defaultChunkOverlap` | `number` | `50` | Overlap character count between consecutive chunks (>= 0 and < size). |
| `searchLimit` | `number` | `10` | Default top-k results returned by vector search (1 to 100). |
| `searchThreshold` | `number` | `0.0` | Default cosine similarity threshold (0.0 to 1.0). |
| `authTable` | `TableDef \| string` | `undefined` | User authentication table for multi-tenant ownership scoping. |
| `authenticated` | `boolean` | `false` | When `true`, scopes documents and endpoints to `$auth.id`. |
| `routePrefix` | `string` | `"vector"` | URL route prefix for generated API endpoints. |
| `canonical` | `string` | `undefined` | Canonical URL slug for the API group. |

---

## API Endpoints

All endpoints are registered under the configured API Group (default route: `/api:vector/vector/*`):

| Verb | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/documents/create` | Ingest and index a new text document or multimodal media asset. |
| `GET` | `/documents` | List uploaded documents with pagination. |
| `GET` | `/documents/{id}` | Retrieve a document and all of its vector chunks. |
| `DELETE` | `/documents/{id}/delete` | Delete a document and cascade-delete its chunks. |
| `POST` | `/documents/{id}/reindex` | Re-chunk and re-embed an existing document. |
| `POST` | `/search` | Perform cosine similarity search (text, image, or raw vector). |
| `POST` | `/embed` | Directly generate a 768-dim vector embedding for text or media. |

---

## Examples

### 1. Ingesting Text Documents

```ts
await fetch("https://your-instance.xano.io/api:vector/vector/documents/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "System Architecture Guide",
    content: "# System Architecture\nOur service runs on Kubernetes with PostgreSQL...",
    mime_type: "text/markdown",
    strategy: "markdown",
    chunk_size: 400,
    chunk_overlap: 40,
  }),
});
```

### 2. Ingesting Multimodal Assets (Images, Audio, Video)

```ts
await fetch("https://your-instance.xano.io/api:vector/vector/documents/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Product Diagram",
    content: "Diagram illustrating cloud sync architecture.",
    media_data: "<base64_image_data>",
    mime_type: "image/png",
    metadata: { category: "diagrams", width: 1024, height: 768 },
  }),
});
```

### 3. Cross-Modal Semantic Search

```ts
// Search using a natural language query
const res = await fetch("https://your-instance.xano.io/api:vector/vector/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "Find architecture diagrams explaining cloud sync",
    limit: 5,
  }),
});
const { results, count } = await res.json();
```

---

## AI Agent Search Tool

Include the `vector_search` tool directly in your LLM agent or MCP toolset definitions:

```ts
import { agent } from "@xanots/sdk";
import { vector } from "./vector-setup.js";

export const ragAgent = agent({
  name: "support_agent",
  instructions: "Answer user inquiries using the vector search tool to retrieve knowledge.",
  tools: [vector.searchTool],
});
```

---

## License

MIT
