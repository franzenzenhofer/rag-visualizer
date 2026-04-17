## RAG Visualizer “Hardcore” Audit Report (as of **18.01.2026 15:28:04**)

Goal you stated: **correct + great + usable + efficient + illustrative + great animations + computer‑science accurate + value-aligned**, and it should **really show how modern AI apps use RAG**.

I’m going to do this in two passes:

1. **Big picture (what your app is, what it proves, what it does not prove yet)**
2. **Deep dive (file-by-file + exact correctness bugs + what’s missing + how to fix)**

---

# 1) Big picture verdict

### ✅ What you already nailed (short, true lines)

* ✅ **The 5-step pipeline is correct** as a teaching sequence: Upload → Chunk → Embed → Retrieve → Build prompt.
* ✅ **You use a real embedding model** in the browser (`Xenova/all-MiniLM-L6-v2`) and do real cosine similarity retrieval.
* ✅ **The visuals and animations are strong** and match a “Hans Rosling / sports-caster” teaching style: you show “text → numbers”, “question → vector”, “chunks flow into prompt”.
* ✅ **Client-side privacy story is *mostly* true**: your document text isn’t sent to your own server.

### ⚠️ What your app currently *is* (important framing)

Right now, this is **an interactive RAG *prompt assembly* visualizer**.
It is **not yet a full modern RAG app** because it does **not**:

* build an index (vector DB / ANN graph),
* do scalable retrieval (it does linear scan),
* do reranking/hybrid retrieval,
* produce an LLM answer with citations and guardrails,
* track sources/page numbers, or show grounded highlighting.

That’s not “wrong”. But if your promise is *“shows how modern AIs use RAG in their apps”*, you need 1–2 more steps (or optional panels) that show the modern “production” parts.

### 🚨 P0 (must-fix) correctness issues

These are not “nice-to-have”; they can make the visualization **misleading or broken**:

1. **Chunk overlap slider is wrong** (you allow 500, but your algorithm treats it as a percent).
2. **Embeddings are not invalidated when chunks change**, so you can end up retrieving with embeddings from an old chunking configuration. This breaks correctness.
3. **Your query point in the UMAP scatter plot is not in the same projection space as the document points**, so the query dot + lines can be *geometrically fake* even when retrieval is correct.
4. **i18n is only partially wired**; language switcher won’t translate most UI, which is a UX correctness issue.
5. **Dark mode logic conflicts with “forced light mode”**, leaving dead code + possible flicker/inconsistency.

I’ll show exactly where and how to fix each.

---

# 2) Deep dive (what is correct, what needs improvement, what’s missing)

## A. “Modern RAG correctness” (concept + what your UI teaches)

### ✅ Correct

* ✅ **Chunking concept**: splitting + overlap for boundary safety.
* ✅ **Embeddings**: “text → vector,” and you correctly normalize embeddings (`normalize: true`).
* ✅ **Retrieval**: cosine similarity to find top‑K relevant chunks.
* ✅ **Prompt assembly**: “system rule + context + question” is the core RAG prompt pattern.

### 🔧 Needs improvement (to be “super correct”)

* 🔧 **Be explicit that the 2D scatter is a projection** and can distort distances.
  Without that, users will believe “distance on screen = true similarity” which is not guaranteed.

* 🔧 **Clarify what “RAG” is and isn’t**:

  * RAG helps grounding, but **does not guarantee truth**.
  * Retrieval can fail (bad chunking, missing info, poor embedding model).
  * LLM can still hallucinate unless you instruct “say ‘I don’t know’ if not in context” (you do this partially).

### ❗ Missing (to match “modern apps”)

If your claim is “how modern AI apps use RAG”, you’re missing at least these concepts in the actual app UI:

1. **Vector DB / Index concept**
   Even if you keep everything in-memory, show an “Index build” step:

   * “Store (embedding + metadata)”
   * “Build ANN index (HNSW-like)”
   * Then retrieval is “search index” not “scan all vectors”

2. **Metadata + citations** (source, page, chunk id, offset)
   Modern RAG is “grounded + traceable”.
   Your `Chunk` type has `start/end` but your UI does not provide “this answer came from page X / lines Y”.

3. **Reranking / hybrid retrieval** (optional advanced panel)
   Modern systems often do:

   * lexical BM25 + dense retrieval,
   * reranker model,
   * filters (doc section, date, etc.)

4. **Answer generation** (even optional)
   Right now you stop at “prompt assembled”.
   For teaching, that’s OK, but your app name/goal suggests showing “RAG in apps” → you should optionally show:

   * call to an LLM API **or**
   * local WebLLM (you already reference it in docs)
   * plus grounded citations.

---

## B. P0 bug: Chunk overlap slider is wrong (and can break chunking meaning)

### Where

`src/components/chunking/ChunkingVisualizer.tsx` “Controls (collapsible)”:

```tsx
<input
  type="range"
  min="0"
  max="500"
  step="50"
  value={chunkingConfig.overlap}
  onChange={(e) => setChunkingConfig({ overlap: Number(e.target.value) })}
/>
```

But your chunker expects overlap to be a **percentage**:

```ts
const effectiveOverlapChars = Math.floor(actualChunkSize * (overlap / 100))
```

### ✅ Correct

* ✅ The chunker’s overlap math is correct **if overlap is 0–50-ish percent**.

### 🔧 Needs improvement

* 🔧 The UI must constrain overlap realistically: **0–50 (%)** (or 0–30).
* 🔧 Label it as **percent** consistently everywhere.
* 🔧 Right now you allow 500 → that becomes 500% overlap, which turns step negative and then your minStep fallback kicks in. That silently destroys the “overlap concept”.

### Fix (exact)

Change the slider:

```tsx
<input
  type="range"
  min="0"
  max="50"
  step="5"
  value={chunkingConfig.overlap}
  onChange={(e) => setChunkingConfig({ overlap: Number(e.target.value) })}
/>
<span className="text-sm text-gray-600 w-16">{chunkingConfig.overlap}%</span>
```

Also make sure any other overlap control uses the same meaning.
Right now you also have `ChunkControls.tsx` with overlap 0–50%, which is correct — but it looks unused. Either **use it** or **delete it**.

---

## C. P0 bug: Embeddings are not invalidated when chunks change (breaks correctness)

### The problem

You recompute chunks when `chunkingConfig` changes, but you **do not clear embeddings**.
Then `EmbeddingVisualizer` refuses to re-run because it checks:

```ts
if (isRunning.current || chunks.length === 0 || embeddings.length > 0) return
```

So you can end up with:

* chunks from configuration B
* embeddings from configuration A
* retrieval uses embeddings that might not match chunk texts
* UI “retrieved chunk text” might not exist for those embeddings
* worst case: runtime crash at `chunks.find(...)!` in RetrievalVisualizer

### ✅ Correct

* ✅ Auto-embedding pipeline is nice and smooth if the chunk set never changes.

### 🔧 Needs improvement (must)

You need **invalidation rules**:

When any of these changes:

* document content
* chunkingConfig
* chunks array itself

…then you must clear:

* embeddings
* queryEmbedding
* searchResults
* maybe query string
* generation state

### Fix (best place: store action)

In `src/store/ragStore.ts`, change `setChunks` to also invalidate downstream:

```ts
setChunks: (chunks: Chunk[]) => set({
  chunks,
  embeddings: [],
  query: '',
  queryEmbedding: null,
  searchResults: [],
}),
```

Also clear `embeddingProgress`, `modelLoaded` depending on your desired UX (model can stay loaded, but embeddings should reset).

This single change makes the app **actually correct** under interactive chunking changes.

---

## D. P0 bug: UMAP query point is not comparable to document points (visual correctness)

### Where

`src/components/retrieval/RetrievalVisualizer.tsx`:

* Document points:

```ts
const points2D = useMemo(() => reduceToTwoD(embeddings), [embeddings])
```

* Query point:

```ts
const allEmbeddings = [...embeddings, { chunkId: 'query', embedding: queryEmbedding }]
const projected = reduceToTwoD(allEmbeddings)
return projected.find(p => p.chunkId === 'query')
```

### Why this is wrong (hardcore truth)

UMAP is **not a stable linear transform**. When you include the query vector and refit, the whole embedding can shift.
You are plotting:

* document points from UMAP fit #1
* query point from UMAP fit #2

These are **different coordinate systems**. The query dot might appear near/far arbitrarily, and the dashed lines might be visually “lying”.

### ✅ Correct

* ✅ Using UMAP for a “meaning map” is a good teaching device.

### 🔧 Needs improvement (must)

You need query coordinates derived from the **same fitted projection**.

### Fix options (choose one)

**Option 1 (recommended): store 2D coords once**
You already have `x?: number, y?: number` in `EmbeddingResult`. Use it.

* When embeddings are done (EmbeddingVisualizer), compute projection ONCE and store it into the embeddings:

  * `EmbeddingResult = {chunkId, embedding, x, y}`

Then retrieval uses stored `(x,y)`.

For the query, do a “teaching-accurate” approximation:

* place query dot at the weighted average of the top‑K retrieved chunk coordinates:

  * weights = similarity (clamped ≥ 0)

This is *not mathematically UMAP*, but **it is consistent and honest if you label it**:

> “Query dot is placed near its best matches.”

**Option 2: keep a UMAP model and call transform**
If `umap-js` supports `.transform()` (many implementations do), you can:

* fit UMAP on document vectors once
* transform the query vector into that space

This is the “more correct” dimensionality-reduction approach (if supported).

**Option 3: switch to PCA for the scatter**
PCA is deterministic and has a real transform. It’s less “pretty” than UMAP but far more consistent for a teaching tool across steps.

---

## E. P0 bug: GitHub Pages base path breaks `index.html` favicon (and potentially other assets)

### Where

`index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

But in `vite.config.ts` you set:

```ts
base: '/rag-visualizer/',
```

### What happens

On GitHub Pages, `/vite.svg` points to the domain root, not `/rag-visualizer/vite.svg`.
So favicon likely fails in production.

### Fix

Use Vite’s `%BASE_URL%` placeholder:

```html
<link rel="icon" type="image/svg+xml" href="%BASE_URL%vite.svg" />
```

Do the same for any other absolute `/...` assets you intend to load from base.

---

## F. Dark mode logic is inconsistent (dead code + possible flicker)

### Where

* `src/main.tsx` reads local storage and adds `.dark`
* `src/App.tsx` useEffect removes `.dark` and forces light
* `src/index.css` defines dark variant and includes dark classes, but also forces light via media override

### ✅ Correct

* ✅ You listened to “LIGHT DAY DESIGN!!!! HIGH CONTRAST!!” and forced light mode.

### 🔧 Needs improvement

Pick one truth and delete the rest.

**If you want “light-only”**:

* remove isDarkMode and toggleDarkMode from UI store
* remove all `dark:` classes (or keep but unused)
* remove `@variant dark...`
* remove main.tsx localStorage dark logic

**If you want “light default but user can toggle dark”** (more standard):

* delete forced-light overrides in CSS
* don’t remove `.dark` in AppContent
* add a theme toggle UI
* respect `prefers-reduced-motion` too (see below)

Right now it’s contradictory, which is a maintainability and correctness problem.

---

## G. i18n is only half implemented (LanguageSwitcher doesn’t actually translate your app)

### What I see

You set up `i18next` properly, and Header/StepIndicator use `t(...)`.
But the major step UIs are hard-coded English strings:

* DocumentUpload headings and labels
* ChunkingVisualizer explanation panel
* EmbeddingVisualizer strings
* RetrievalVisualizer strings
* GenerationVisualizer strings

### ✅ Correct

* ✅ Infrastructure is there: language detector, backend load path, translations.

### 🔧 Needs improvement

Either:

* fully translate the UI (recommended), or
* remove the language switcher until it’s real.

Also: UI store language and i18n’s detected language can diverge. You should ensure they are synced on startup (one source of truth).

---

## H. Performance & scalability (where your “efficient” claim breaks)

### ✅ Correct (for small docs)

* ✅ Linear scan similarity over N chunks is fine for N < ~500, and great for teaching.
* ✅ You chunk reasonably and embed sequentially with progress.

### 🔧 Needs improvement (to be honest + robust)

1. **Embedding on main thread may freeze UI** for larger documents
   `embedChunks()` runs sequentially and can be CPU-heavy. Consider:

   * web worker for embeddings
   * batching
   * yielding to the event loop every few chunks (`await new Promise(r => setTimeout(r, 0))`)

2. **ChunkingVisualizer highlight algorithm is O(text_length)** with a large `charMap` array
   For big PDFs this will hurt. A segment-based approach (interval merging) avoids per-character arrays.

3. **UMAP is expensive and non-deterministic**

   * cache projections
   * fix random seed (or deterministic method)
   * compute once and reuse across steps

4. **Memory**
   `number[]` for every embedding is heavy. Consider `Float32Array` storage internally (even if you convert to number[] for UI snippets).

---

## I. PDF parsing & “privacy values” (important for truthfulness)

### Where

`src/utils/pdfParser.ts` sets:

```ts
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
```

### ✅ Correct

* ✅ pdf.js usage pattern is correct and likely works reliably.

### 🔧 Needs improvement (truth + privacy + offline)

* 🔧 If your app claims “everything runs locally / private”, you are still fetching:

  * pdf.js worker from CDN
  * embedding model from the internet (Hugging Face)

That’s not “sending the document away”, but it is still a network dependency.
Modern “values” angle: **be transparent**:

* show a small “Network use” note: *“Model + PDF worker are downloaded once. Your documents are processed locally.”*

### Missing (for real RAG-style citations)

PDF ingestion should preserve **page numbers** and maybe headings. Right now you flatten pages into a single string. That makes citations impossible.

Minimum upgrade:

* Add markers like `\n\n[PAGE 7]\n\n`
* Or store structured chunks: `{ text, pageStart, pageEnd }`

---

# 3) “What’s correct / what needs improvement” summary checklist

## P0 — Correctness & Truthfulness (fix these first)

* ✅ Pipeline stages and main concept are correct
* ❌ Overlap UI uses wrong range (0–500) vs percent → fix to 0–50%
* ❌ Embeddings not invalidated when chunks change → clear embeddings/search on chunk change
* ❌ Query dot UMAP mismatch → make projection consistent (store coords / transform / PCA)
* ❌ Base URL breaks favicon on GitHub Pages → use `%BASE_URL%`
* ⚠️ Dark mode is contradictory → choose one approach and delete conflicting parts

## P1 — “Modern RAG app” features (to match your promise)

* Missing: vector DB/index visualization (HNSW/ANN concept)
* Missing: metadata + citations + page numbers (especially for PDFs)
* Missing: reranking/hybrid retrieval (optional advanced panel)
* Missing: final “LLM answers with citations” step (optional local WebLLM or API)

## P2 — UX/Accessibility/Polish

* i18n not applied across steps → translate or remove switcher
* Respect `prefers-reduced-motion` (animations are heavy; accessibility requires a switch)
* Add keyboard navigation & ARIA for interactive controls
* Update README (currently template)
* Add tests for chunker + retrieval scoring + store invalidation

---

# 4) Concrete “modern RAG visualizer” upgrade plan (minimal, high impact)

If you want the *smallest* set of changes that makes the app **truthfully “modern RAG”**:

### Step A — Make it correct

1. Fix overlap slider range + label
2. Invalidate embeddings/search when chunks change
3. Fix query scatter positioning consistency
4. Fix base URL assets
5. Remove dark mode contradictions

### Step B — Make it “modern RAG”

Add one optional panel per step:

* **Ingestion**: “Index build” animation (store embeddings + build ANN graph)
* **Retrieval**: “Candidate retrieval → rerank → final topK”
* **Generation**: “Answer + citations” (even if citations are chunk ids)

### Step C — Make it value-aligned

* Add a “Privacy & transparency” info box:

  * “Docs stay on device”
  * “Model/worker download happens from X”
  * “No analytics” (if true)

---

# 5) Quick file-by-file highlights (so you can act fast)

### `src/store/ragStore.ts`

* ✅ Correct: clean, minimal Zustand store
* 🔧 Improve: **invalidate downstream state** when chunks/doc change (P0)

### `src/components/chunking/ChunkingVisualizer.tsx`

* ✅ Correct: amazing step animation & explanation
* ❌ Fix: overlap slider range/meaning mismatch (P0)
* 🔧 Improve: per-character highlight map can be heavy on large docs (P1)

### `src/components/embeddings/EmbeddingVisualizer.tsx`

* ✅ Correct: model loading progress UX is excellent
* ❌ Fix: if chunks change but embeddings exist, it won’t recompute (P0 is fixed via store invalidation)
* 🔧 Improve: consider worker/batching for larger docs (P1)

### `src/components/retrieval/RetrievalVisualizer.tsx`

* ✅ Correct: query→vector→cosine→topK animation is very clear
* ❌ Fix: queryPoint2D projection mismatch with document points (P0)
* 🔧 Improve: show that similarity can be negative and clamp UI (P1)

### `src/components/generation/GenerationVisualizer.tsx`

* ✅ Correct: prompt assembly visual is strong
* 🔧 Improve: auto-animation only once (`hasStarted`)—won’t re-run on new results (P1)
* Missing: actual answer + citations (P1/P2 depending on your goal)

### `index.html`

* ✅ Correct: good SEO basics
* ❌ Fix: favicon path with base URL (P0)
* Missing: og:image (P2)

### `README.md`

* ❌ Needs rewrite (it’s still the template). This matters for credibility.

---

If you want, I can also provide **exact patch-style code blocks** for the top P0 fixes (overlap slider, store invalidation, base URL fix, and the UMAP/query-point fix approach you choose).
