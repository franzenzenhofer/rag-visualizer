# Client-Side JavaScript/TypeScript RAG Systems

Pure browser-based RAG with no server required. Everything runs locally.

---

## Top Open Source Solutions

### 1. EntityDB (Best for Quick Start)
**GitHub**: [babycommando/entity-db](https://github.com/babycommando/entity-db)

- In-browser vector database
- Built on **IndexedDB** + **Transformers.js**
- WASM SIMD support for fast hamming distance
- Cosine similarity search

```javascript
import { EntityDB } from 'entity-db';

const db = new EntityDB();
await db.addDocument("AI is transforming industries");
const results = await db.search("machine learning applications");
```

---

### 2. EdgeVec (Best Performance)
**GitHub**: [matte1782/edgevec](https://github.com/matte1782/edgevec)

- Built in **Rust**, compiled to **WebAssembly**
- **24x faster** than alternatives (like voy)
- **32x memory reduction** via binary quantization
- Sub-millisecond search
- Stores in IndexedDB, survives page refreshes

**Performance Stats:**
| Feature | EdgeVec |
|---------|---------|
| Speed | 24x faster than voy |
| Memory | 32x reduction |
| Search | Sub-millisecond |

---

### 3. client-vector-search (Easy API)
**GitHub**: [yusufhilmi/client-vector-search](https://github.com/yusufhilmi/client-vector-search)

- Embed, store, search, cache vectors
- Works in **browser AND Node.js**
- Uses `gte-small` model (~30MB) by default
- Claims to outperform OpenAI's text-embedding-ada-002

```javascript
import { VectorSearch } from 'client-vector-search';

const vs = new VectorSearch();
await vs.addDocuments(["Document 1", "Document 2"]);
const results = await vs.search("query text");
```

---

### 4. RxDB + Transformers.js (Offline-First)
**Website**: [rxdb.info](https://rxdb.info/articles/javascript-vector-database.html)

- Full offline database with vector search
- Uses IndexedDB storage
- ML model runs via WebAssembly locally
- **88ms query times** - no loading spinner needed

---

### 5. idb-vector (Simple Wrapper)
**GitHub**: [PaulKinlan/idb-vector](https://github.com/PaulKinlan/idb-vector)

- Simple IndexedDB wrapper for vectors
- Good starting point for custom solutions
- Minimal, lightweight

---

### 6. Orama (Full-Featured)
**Website**: [oramasearch.com](https://oramasearch.com)

- Complete search engine + RAG pipeline
- **Under 2KB** bundle size
- Full-text, vector, AND hybrid search
- Works in browser, server, or edge

---

## Embedding Models (Run in Browser)

### Transformers.js
**Source**: [Hugging Face](https://huggingface.co/docs/transformers.js)

The standard for browser-based ML:
- Mirrors Python transformers API
- Hundreds of pre-converted models
- Auto model downloading & caching
- ONNX Runtime via WebAssembly

**Recommended Models:**
| Model | Size | Use Case |
|-------|------|----------|
| `all-MiniLM-L6-v2` | ~23MB | General purpose |
| `gte-small` | ~30MB | High quality |
| `jina-embeddings-v2-base-en` | ~100MB | Best accuracy |
| `EmbeddingGemma` | ~50MB | Google's efficient model |

```javascript
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const embedding = await embedder("Your text here", { pooling: 'mean', normalize: true });
```

---

## Full RAG Frameworks (TypeScript)

### LangChain.js
**GitHub**: [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs)

- Industry standard RAG framework
- Both server and browser support
- Integrates with all vector DBs

### Mastra
**Website**: [mastra.ai](https://mastra.ai)

- TypeScript-first RAG framework
- Built-in chunking, embedding, storage, retrieval, reranking
- Simplified pipeline setup

### EmbedJs
**GitHub**: [llm-tools/embedJs](https://github.com/llm-tools/embedJs)

- Node.js RAG framework
- Easy LLM and embedding integration

---

## Complete Browser RAG Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE RAG ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   User uploads PDF/TXT/DOCX                                            │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  PDF.js / Text  │  ← Document parsing in browser                   │
│   │  Extraction     │                                                  │
│   └────────┬────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  Chunking       │  ← Split into 512-token chunks                   │
│   │  (JavaScript)   │                                                  │
│   └────────┬────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  Transformers.js│  ← Generate embeddings via WASM                  │
│   │  (ONNX/WASM)    │                                                  │
│   └────────┬────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  IndexedDB      │  ← Store vectors (50GB+ capacity)                │
│   │  Vector Store   │                                                  │
│   └────────┬────────┘                                                  │
│            │                                                            │
│  ══════════╪══════════════════════════════════════════════════════════ │
│            │  QUERY TIME                                               │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  User Query     │                                                  │
│   └────────┬────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  Embed Query    │  ← Same Transformers.js model                    │
│   └────────┬────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  Vector Search  │  ← Cosine similarity in WASM                     │
│   │  (EdgeVec/etc)  │    Sub-millisecond!                              │
│   └────────┬────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  WebGPU LLM     │  ← Optional: Run LLM locally too!                │
│   │  (WebLLM/etc)   │    Or call external API                          │
│   └────────┬────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                  │
│   │  Response       │  ← Grounded answer, fully private                │
│   └─────────────────┘                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## WebGPU LLM (Optional - Full Local)

Run the entire RAG including LLM generation in browser:

### WebLLM
**GitHub**: [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)

- Run Llama, Phi, Mistral in browser
- WebGPU acceleration
- ~3.76x performance improvements with optimizations

### Microsoft Phi-3 Example
**GitHub**: [Phi-3CookBook RAG WebGPU](https://github.com/microsoft/Phi-3CookBook/tree/main/code/08.RAG/rag_webgpu_chat)

- Complete RAG example
- Uses Phi-3-mini + jina embeddings
- ONNX Runtime Web + WebGPU

---

## Browser Compatibility

| Browser | WebGPU | WASM SIMD | Notes |
|---------|--------|-----------|-------|
| Chrome 113+ | Yes | Yes | Full support |
| Edge 113+ | Yes | Yes | Full support |
| Firefox | No | Yes | WebGPU not ready |
| Safari | Experimental | No SIMD | Use scalar fallback |
| iOS Safari | No | No SIMD | Limited support |

**Required Headers for WebGPU:**
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

---

## Key Benefits

| Benefit | Description |
|---------|-------------|
| **Complete Privacy** | Documents never leave device |
| **Zero Server Cost** | User's device does compute |
| **Offline Capable** | Works without internet |
| **Fast** | 88ms queries, no network latency |
| **50GB+ Storage** | IndexedDB capacity per origin |

---

## Quick Start Code

### Minimal RAG with EntityDB + Transformers.js

```typescript
import { EntityDB } from 'entity-db';

// Initialize
const db = new EntityDB({
  model: 'Xenova/all-MiniLM-L6-v2'
});

// Ingest documents
const documents = [
  "RAG combines retrieval with generation",
  "Vector databases store embeddings",
  "Transformers.js runs ML in browser"
];

for (const doc of documents) {
  await db.addDocument(doc);
}

// Query
const results = await db.search("How does RAG work?", { topK: 3 });

console.log(results);
// Returns most semantically similar documents
```

### With EdgeVec (High Performance)

```typescript
import { EdgeVec } from 'edgevec';
import { pipeline } from '@xenova/transformers';

// Initialize embedding model
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Initialize vector store
const db = new EdgeVec({ persist: true }); // Uses IndexedDB

// Embed and store
async function addDocument(text: string, id: string) {
  const embedding = await embedder(text, { pooling: 'mean', normalize: true });
  await db.insert(id, embedding.data);
}

// Search
async function search(query: string, topK = 5) {
  const queryEmb = await embedder(query, { pooling: 'mean', normalize: true });
  return db.search(queryEmb.data, topK);
}
```

---

## Resources

- [HuggingFace On-Device RAG Demo](https://huggingface.co/blog/rasgaard/on-device-rag)
- [Microsoft WebGPU RAG Tutorial](https://techcommunity.microsoft.com/blog/educatordeveloperblog/use-webgpu--onnx-runtime-web--transformer-js-to-build-rag-applications-by-phi-3-/4190968)
- [Building Browser RAG with WebGPU](https://dev.to/emanuelestrazzullo/building-a-browser-based-rag-system-with-webgpu-h2n)
- [RxDB Vector Database Guide](https://rxdb.info/articles/javascript-vector-database.html)
- [IndexedDB as Vector Database](https://paul.kinlan.me/idb-as-a-vector-database/)
