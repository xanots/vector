/**
 * The `document_chunk` table — stores text chunks and multimodal assets, their Gemini 768-dimensional
 * vector embeddings, and an HNSW/pgvector cosine similarity index.
 */
import { table, f, type InferRow } from "@xanots/core";
import { type ResolvedOptions, GEMINI_EMBEDDING_DIMENSIONS } from "../options.js";
import type { DocumentTable } from "./document.js";

/** Build the `document_chunk` def for the given resolved options and document table. */
export function chunkTable(opts: ResolvedOptions, document: DocumentTable) {
  return table({
    name: opts.names.chunk,
    description: "Document chunks and multimodal embeddings for semantic vector search.",
    auth: false,
    useXdo: true,
    tags: opts.tags,
    schema: {
      document_id: f.tableRef(document, {
        required: true,
        description: "The document this chunk was generated from.",
      }),
      chunk_index: f.int({
        required: true,
        description: "0-based sequence index of the chunk within the document.",
      }),
      content: f.text({
        required: false,
        description: "The text content or caption of this chunk.",
      }),
      media_data: f.text({
        required: false,
        description: "Base64 media data if this chunk is a multimodal asset.",
      }),
      mime_type: f.text({
        default: "text/plain",
        description: "MIME type of the chunk content (e.g. text/plain, image/png, audio/mp3).",
      }),
      embedding: f.vector(GEMINI_EMBEDDING_DIMENSIONS, {
        description: "Google Gemini 768-dimensional multimodal vector embedding.",
      }),
      metadata: f.json({
        description: "Metadata specific to this chunk (e.g. section title, timestamps, bounding box).",
      }),
      char_count: f.int({
        default: 0,
        description: "Character length of the text content.",
      }),
    },
    index: [
      {
        type: "vector",
        fields: [{ name: "embedding", op: "vector_cosine_ops" }],
      },
      {
        type: "btree",
        fields: [
          { name: "document_id", op: "asc" },
          { name: "chunk_index", op: "asc" },
        ],
      },
    ],
  });
}

/** The `document_chunk` def type. */
export type ChunkTable = ReturnType<typeof chunkTable>;

/** A `document_chunk` row. */
export type ChunkRow = InferRow<ReturnType<typeof chunkTable>>;

/** Public fields returned for a chunk. */
export const PUBLIC_CHUNK_FIELDS = [
  "id",
  "created_at",
  "document_id",
  "chunk_index",
  "content",
  "media_data",
  "mime_type",
  "metadata",
  "char_count",
] as const;

export interface PublicChunk {
  id: number;
  created_at: number;
  document_id: number;
  chunk_index: number;
  content: string;
  media_data?: string;
  mime_type: string;
  metadata: Record<string, unknown>;
  char_count: number;
}
