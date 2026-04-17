# How RAG (Retrieval-Augmented Generation) Works

## The Core Idea

RAG combines two AI capabilities:
1. **Retrieval**: Finding relevant information from a knowledge base
2. **Generation**: Using an LLM to produce human-like responses

Instead of relying solely on what an LLM "memorized" during training, RAG fetches relevant facts at runtime and feeds them to the model.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RAG ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐        ┌──────────────┐        ┌──────────────────┐     │
│   │  User    │        │   Vector     │        │                  │     │
│   │  Query   │───────▶│   Database   │───────▶│   LLM Generator  │     │
│   └──────────┘        │  (Retrieval) │        │   (Generation)   │     │
│        │              └──────────────┘        └────────┬─────────┘     │
│        │                     │                         │               │
│        │              ┌──────┴──────┐                  │               │
│        │              │  Top-K      │                  │               │
│        │              │  Relevant   │──────────────────┤               │
│        │              │  Chunks     │                  │               │
│        │              └─────────────┘                  ▼               │
│        │                                        ┌──────────────┐       │
│        └───────────────────────────────────────▶│   Response   │       │
│                                                 │  (Grounded)  │       │
│                                                 └──────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Three Phases

### Phase 1: Ingestion (Offline / Preparation)

Before RAG can answer questions, you must prepare your knowledge base.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Documents  │────▶│  Chunking   │────▶│  Embedding  │────▶│   Vector    │
│  (PDFs,     │     │  (Split     │     │  Model      │     │   Database  │
│   text,     │     │   into      │     │  (Convert   │     │   (Store    │
│   HTML)     │     │   pieces)   │     │   to        │     │   vectors)  │
│             │     │             │     │   vectors)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### Step 1.1: Chunking

Documents are split into smaller pieces because:
- LLMs have context limits
- Smaller chunks enable precise retrieval
- Overlap prevents losing context at boundaries

**Recommended settings:**
| Content Type | Chunk Size | Overlap |
|--------------|------------|---------|
| Prose/articles | 512-1024 tokens | 10-20% |
| Technical docs | 256-512 tokens | 15-25% |
| Code | 100-300 tokens | 20-30% |

**Example:**
```
Original Document (3000 words):
"The history of artificial intelligence began in the 1950s when Alan Turing
proposed the Turing Test. Early AI research focused on symbolic reasoning
and expert systems. In the 1980s, machine learning emerged as a new paradigm..."

After Chunking (with overlap):
┌─────────────────────────────────────────────────────────────────┐
│ Chunk 1: "The history of artificial intelligence began in the  │
│ 1950s when Alan Turing proposed the Turing Test. Early AI      │
│ research focused on symbolic reasoning..."                      │
├─────────────────────────────────────────────────────────────────┤
│ Chunk 2: "Early AI research focused on symbolic reasoning and  │
│ expert systems. In the 1980s, machine learning emerged as a    │
│ new paradigm..."                                                │
├─────────────────────────────────────────────────────────────────┤
│ Chunk 3: "In the 1980s, machine learning emerged as a new      │
│ paradigm. Neural networks gained attention..."                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 1.2: Embedding

Each chunk is converted to a **vector** (array of numbers) that captures its semantic meaning.

```
Text Chunk                          Vector Embedding
─────────────────────────────────────────────────────────────────────────
"Alan Turing proposed              [0.023, -0.156, 0.892, 0.445, ...]
 the Turing Test"         ────▶    (768-1536 dimensions)

"Machine learning uses             [0.156, 0.234, -0.445, 0.667, ...]
 statistical methods"     ────▶    (768-1536 dimensions)
```

**Why vectors?**
- Similar meanings → similar vectors
- Enables semantic search (not just keyword matching)
- "AI pioneer" finds "Alan Turing" even without exact match

**Popular Embedding Models:**
| Model | Provider | Dimensions | Best For |
|-------|----------|------------|----------|
| text-embedding-3-large | OpenAI | 3072 | General purpose |
| BGE-M3 | Open source | 1024 | Multilingual |
| Voyage-3 | Voyage AI | 1024 | Domain-specific |
| Nomic Embed | Nomic | 768 | Long context |

#### Step 1.3: Vector Storage

Vectors are stored in a specialized database optimized for similarity search.

```
Vector Database Structure:
┌────────────────────────────────────────────────────────────────────────┐
│  ID  │  Vector                              │  Metadata               │
├────────────────────────────────────────────────────────────────────────┤
│  1   │  [0.023, -0.156, 0.892, ...]        │  {source: "doc1.pdf",   │
│      │                                      │   page: 5, chunk: 1}    │
├────────────────────────────────────────────────────────────────────────┤
│  2   │  [0.156, 0.234, -0.445, ...]        │  {source: "doc1.pdf",   │
│      │                                      │   page: 5, chunk: 2}    │
├────────────────────────────────────────────────────────────────────────┤
│  3   │  [0.789, -0.012, 0.334, ...]        │  {source: "doc2.pdf",   │
│      │                                      │   page: 1, chunk: 1}    │
└────────────────────────────────────────────────────────────────────────┘
```

**Popular Vector Databases:**
- **Pinecone** - Managed, scalable
- **Chroma** - Open source, easy to use
- **Qdrant** - High performance
- **Milvus** - Enterprise-grade
- **pgvector** - PostgreSQL extension
- **Weaviate** - Hybrid search built-in

---

### Phase 2: Retrieval (Runtime)

When a user asks a question, find the most relevant chunks.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  User Question   │────▶│  Embed Question  │────▶│  Similarity      │
│  "Who invented   │     │  [0.045, -0.123, │     │  Search          │
│   the Turing     │     │   0.867, ...]    │     │  (find nearest   │
│   Test?"         │     │                  │     │   vectors)       │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Top-K Results   │
                                                  │  (k=3-10 chunks) │
                                                  └──────────────────┘
```

#### Similarity Metrics

How do we measure "closeness" between vectors?

```
Query Vector: Q = [0.5, 0.3, 0.8]
Document Vector: D = [0.4, 0.35, 0.75]

COSINE SIMILARITY (most common)
─────────────────────────────────
        Q · D                    (0.5×0.4) + (0.3×0.35) + (0.8×0.75)
cos θ = ─────────  =  ────────────────────────────────────────────────
        |Q| × |D|               √(0.5²+0.3²+0.8²) × √(0.4²+0.35²+0.75²)

      = 0.905 / 0.929 = 0.974   (very similar!)

Range: -1 to 1 (1 = identical direction)


EUCLIDEAN DISTANCE
──────────────────
d = √[(0.5-0.4)² + (0.3-0.35)² + (0.8-0.75)²]
  = √[0.01 + 0.0025 + 0.0025]
  = 0.122 (small = similar)

Range: 0 to ∞ (0 = identical)


DOT PRODUCT
───────────
Q · D = (0.5×0.4) + (0.3×0.35) + (0.8×0.75)
      = 0.2 + 0.105 + 0.6
      = 0.905

Higher = more similar
```

#### Hybrid Search (Best Practice)

Combines two retrieval methods:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         HYBRID SEARCH                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   User Query: "What is the BM25 algorithm?"                           │
│                                                                        │
│   ┌─────────────────────┐         ┌─────────────────────┐             │
│   │   DENSE SEARCH      │         │   SPARSE SEARCH     │             │
│   │   (Semantic)        │         │   (Keyword/BM25)    │             │
│   │                     │         │                     │             │
│   │   Finds: docs about │         │   Finds: docs with  │             │
│   │   "search ranking"  │         │   exact "BM25"      │             │
│   │   "relevance"       │         │   keyword           │             │
│   │   "information      │         │                     │             │
│   │    retrieval"       │         │                     │             │
│   └──────────┬──────────┘         └──────────┬──────────┘             │
│              │                               │                         │
│              └───────────┬───────────────────┘                         │
│                          ▼                                             │
│              ┌─────────────────────┐                                   │
│              │   COMBINE & RERANK  │                                   │
│              │   (RRF or weighted) │                                   │
│              └──────────┬──────────┘                                   │
│                         ▼                                              │
│              ┌─────────────────────┐                                   │
│              │   Final Top-K       │                                   │
│              │   Results           │                                   │
│              └─────────────────────┘                                   │
└────────────────────────────────────────────────────────────────────────┘
```

**Why hybrid?**
- Dense search: Understands meaning ("car" matches "automobile")
- Sparse search: Catches exact terms (acronyms, product names, technical terms)
- Together: Best of both worlds

---

### Phase 3: Generation (Runtime)

Combine retrieved context with user query and send to LLM.

```
┌────────────────────────────────────────────────────────────────────────┐
│                         PROMPT CONSTRUCTION                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   System: You are a helpful assistant. Answer questions based on      │
│           the provided context. If the context doesn't contain        │
│           the answer, say "I don't know."                             │
│                                                                        │
│   ─────────────────────────────────────────────────────────────────   │
│                                                                        │
│   Context:                                                             │
│   [Chunk 1]: "Alan Turing proposed the Turing Test in his 1950       │
│              paper 'Computing Machinery and Intelligence'..."         │
│                                                                        │
│   [Chunk 2]: "The Turing Test evaluates a machine's ability to       │
│              exhibit intelligent behavior indistinguishable from      │
│              a human..."                                               │
│                                                                        │
│   [Chunk 3]: "Turing was a British mathematician and computer        │
│              scientist who worked at Bletchley Park..."               │
│                                                                        │
│   ─────────────────────────────────────────────────────────────────   │
│                                                                        │
│   User Question: Who invented the Turing Test?                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              LLM                                       │
│                         (GPT-4, Claude,                                │
│                          Gemini, etc.)                                 │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│   Response: "Alan Turing invented the Turing Test. He proposed it    │
│             in his 1950 paper 'Computing Machinery and Intelligence'  │
│             as a way to evaluate whether a machine can exhibit        │
│             intelligent behavior indistinguishable from a human."     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow

```
                              RAG PIPELINE
═══════════════════════════════════════════════════════════════════════════

OFFLINE (Preparation)
─────────────────────

     Documents                  Chunks                    Embeddings
    ┌─────────┐              ┌─────────┐              ┌─────────────────┐
    │ PDF     │              │ Chunk 1 │──────────▶  │ [0.1, 0.2, ...] │
    │ TXT     │───Chunker───▶│ Chunk 2 │──Embed────▶ │ [0.3, 0.1, ...] │
    │ HTML    │              │ Chunk 3 │──Model────▶ │ [0.5, 0.4, ...] │
    │ ...     │              │ ...     │              │ ...             │
    └─────────┘              └─────────┘              └────────┬────────┘
                                                               │
                                                               ▼
                                                      ┌─────────────────┐
                                                      │ Vector Database │
                                                      │   (Indexed)     │
                                                      └─────────────────┘


ONLINE (Query Time)
───────────────────

    User Query              Query Embedding            Vector Search
   ┌──────────────┐        ┌─────────────────┐       ┌─────────────────┐
   │ "What is     │        │                 │       │  Find top-K     │
   │  machine     │─Embed─▶│ [0.4, 0.3, ...] │──────▶│  most similar   │
   │  learning?"  │        │                 │       │  chunks         │
   └──────────────┘        └─────────────────┘       └────────┬────────┘
                                                              │
         ┌────────────────────────────────────────────────────┘
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │                        PROMPT ASSEMBLY                              │
   │  ┌───────────────────────────────────────────────────────────────┐ │
   │  │ System: Answer based on context                               │ │
   │  │ Context: [Chunk 1] [Chunk 2] [Chunk 3]                       │ │
   │  │ Question: What is machine learning?                          │ │
   │  └───────────────────────────────────────────────────────────────┘ │
   └──────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │     LLM       │
                              │  (Generate)   │
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │   Grounded    │
                              │   Response    │
                              └───────────────┘
```

---

## Why RAG Works

### Problem: LLM Limitations

| Limitation | Description |
|------------|-------------|
| **Hallucinations** | LLMs confidently generate false information |
| **Stale knowledge** | Training data has a cutoff date |
| **No citations** | Can't verify where information came from |
| **Generic answers** | No access to your specific data |

### Solution: RAG Benefits

| Benefit | How RAG Achieves It |
|---------|---------------------|
| **Grounded responses** | Forces LLM to use retrieved facts |
| **Up-to-date info** | Retrieves from current knowledge base |
| **Verifiable** | Can cite source documents |
| **Domain-specific** | Accesses your proprietary data |
| **Cost-effective** | No expensive model retraining |

---

## Advanced Techniques

### 1. Reranking

After initial retrieval, use a separate model to reorder results by relevance.

```
Initial Retrieval (Top 20)          After Reranking (Top 5)
─────────────────────────           ───────────────────────
1. Doc A (score: 0.85)              1. Doc C (score: 0.97)  ← was #3
2. Doc B (score: 0.82)              2. Doc A (score: 0.94)  ← was #1
3. Doc C (score: 0.80)              3. Doc E (score: 0.91)  ← was #5
4. Doc D (score: 0.78)              4. Doc B (score: 0.88)  ← was #2
5. Doc E (score: 0.75)              5. Doc G (score: 0.85)  ← was #7
...
```

**Impact**: Up to 48% improvement in retrieval quality.

### 2. Query Expansion

Rewrite or expand queries before retrieval.

```
Original Query: "ML models"

Expanded Queries:
├── "machine learning models"
├── "ML algorithms and architectures"
├── "neural network models"
└── "deep learning systems"

→ All queries are searched, results combined
```

### 3. Contextual Retrieval (Anthropic's Innovation)

Add context to chunks before embedding:

```
Before: "The company was founded in 2015."
        (Which company? Ambiguous!)

After:  "From the Anthropic company history document:
         The company was founded in 2015."
        (Now searchable for "Anthropic founding date")

Result: 67% fewer retrieval failures
```

### 4. Multi-Agent RAG

Multiple AI agents collaborate:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MULTI-AGENT RAG                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐             │
│   │ Query Agent │────▶│ Search Agent│────▶│ Eval Agent  │             │
│   │ (Refines    │     │ (Retrieves  │     │ (Checks     │             │
│   │  question)  │     │  from DBs)  │     │  relevance) │             │
│   └─────────────┘     └─────────────┘     └──────┬──────┘             │
│                                                   │                    │
│                                                   ▼                    │
│                                           ┌─────────────┐             │
│                                           │ Gen Agent   │             │
│                                           │ (Synthesize │             │
│                                           │  answer)    │             │
│                                           └─────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Code Example (Conceptual)

```python
# Simplified RAG Pipeline

# PHASE 1: INGESTION
def ingest_documents(documents):
    chunks = []
    for doc in documents:
        # Split into chunks with overlap
        doc_chunks = chunk_document(doc, size=512, overlap=50)
        chunks.extend(doc_chunks)

    # Generate embeddings
    embeddings = embedding_model.encode(chunks)

    # Store in vector database
    vector_db.insert(chunks, embeddings)


# PHASE 2 & 3: RETRIEVAL + GENERATION
def rag_query(user_question):
    # Embed the question
    query_embedding = embedding_model.encode(user_question)

    # Retrieve top-k similar chunks
    relevant_chunks = vector_db.search(
        query_embedding,
        top_k=5
    )

    # Construct prompt with context
    prompt = f"""
    Context:
    {format_chunks(relevant_chunks)}

    Question: {user_question}

    Answer based on the context above:
    """

    # Generate response
    response = llm.generate(prompt)

    return response
```

---

## Summary

RAG = **Retrieval** + **Augmented** + **Generation**

1. **Prepare**: Chunk documents → Embed → Store in vector DB
2. **Retrieve**: Embed query → Find similar chunks → (Rerank)
3. **Generate**: Combine context + query → LLM → Grounded response

**Key insight**: Instead of hoping the LLM "knows" something, RAG **fetches the facts** and makes them available at generation time.

---

## References

- Lewis et al. (2020) - [Original RAG Paper](https://arxiv.org/abs/2005.11401)
- [Pinecone RAG Guide](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Anthropic Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [Google Cloud RAG](https://cloud.google.com/use-cases/retrieval-augmented-generation)
- [OpenAI RAG Documentation](https://help.openai.com/en/articles/8868588-retrieval-augmented-generation-rag-and-semantic-search-for-gpts)
