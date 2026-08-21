import { describe, it, expect } from "vitest";
import { testUserTable, exportWith, tableRow, column } from "./helpers.js";

describe("document table", () => {
  it("encodes unauthenticated document table with correct columns and index", () => {
    const payload = exportWith({ authTable: undefined, authenticated: false });
    const doc = tableRow(payload, "vector_document");
    expect(doc).toBeDefined();

    expect(column(doc, "title")).toBeDefined();
    expect(column(doc, "content")).toBeDefined();
    expect(column(doc, "media_data")).toBeDefined();
    expect(column(doc, "mime_type")).toBeDefined();
    expect(column(doc, "metadata")).toBeDefined();
    expect(column(doc, "status")).toBeDefined();
    expect(column(doc, "chunk_count")).toBeDefined();
    expect(column(doc, "strategy")).toBeDefined();
    expect(column(doc, "chunk_size")).toBeDefined();
    expect(column(doc, "chunk_overlap")).toBeDefined();
    expect(column(doc, "user_id")).toBeUndefined();

    expect(doc.index.some((idx: any) => idx.fields.some((f: any) => f.name === "status"))).toBe(true);
  });

  it("encodes authenticated document table with user_id foreign key", () => {
    const payload = exportWith({ authTable: testUserTable, authenticated: true });
    const doc = tableRow(payload, "vector_document");
    expect(doc).toBeDefined();

    const userIdCol = column(doc, "user_id");
    expect(userIdCol).toBeDefined();
    expect(doc.index.some((idx: any) => idx.fields.some((f: any) => f.name === "user_id"))).toBe(true);
  });
});

describe("chunk table", () => {
  it("encodes chunk table with 768-dim vector and vector cosine index", () => {
    const payload = exportWith({});
    const chunk = tableRow(payload, "vector_chunk");
    expect(chunk).toBeDefined();

    const embeddingCol = column(chunk, "embedding");
    expect(embeddingCol).toBeDefined();
    expect(embeddingCol.type).toBe("vector");
    expect(embeddingCol.vector.size).toBe(768);

    expect(column(chunk, "media_data")).toBeDefined();
    expect(column(chunk, "mime_type")).toBeDefined();

    const vectorIndex = chunk.index.find((idx: any) => idx.type === "vector");
    expect(vectorIndex).toBeDefined();
    expect(vectorIndex.fields[0].name).toBe("embedding");
    expect(vectorIndex.fields[0].op).toBe("vector_cosine_ops");

    const btreeIndex = chunk.index.find(
      (idx: any) =>
        idx.type === "btree" &&
        idx.fields.some((f: any) => f.name === "document_id") &&
        idx.fields.some((f: any) => f.name === "chunk_index"),
    );
    expect(btreeIndex).toBeDefined();
  });
});
