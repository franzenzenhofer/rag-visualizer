Here are the biggest *real* reasons you’ll see “slow / redownloading / doing work twice” in this app, and the fixes that actually move the needle.

## 1) You might be “double running” in dev (React StrictMode)

In React 18 dev mode, **effects can run twice** (mount → unmount → mount) to catch side-effects. That can make model init + embedding look like it’s downloading twice.

### Fix (best): make the embedder init a *true* global singleton Promise

Move caching outside React component lifecycle:

```ts
// src/utils/embedder.ts
import { env, pipeline } from '@xenova/transformers';

type FeatureExtractor = Awaited<ReturnType<typeof pipeline>>;

const g = globalThis as any;
g.__ragEmbedder ??= { initPromise: null as Promise<void> | null, instance: null as FeatureExtractor | null };

export async function getEmbedder(progress_callback?: (x: any) => void) {
  if (g.__ragEmbedder.instance) return g.__ragEmbedder.instance;

  if (!g.__ragEmbedder.initPromise) {
    g.__ragEmbedder.initPromise = (async () => {
      env.allowLocalModels = false;
      env.useBrowserCache = true; // model files cached after first download :contentReference[oaicite:0]{index=0}
      g.__ragEmbedder.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback,
      });
    })();
  }

  await g.__ragEmbedder.initPromise;
  return g.__ragEmbedder.instance!;
}
```

Then your UI calls `await getEmbedder(...)` and you’ll stop re-initializing on remount/HMR.

---

## 2) Stop pulling the PDF worker from a CDN (bundle it locally)

Right now you fetch the pdf.js worker from cdnjs. That’s another network request, and it’s a common source of Vite/pdfjs worker headaches. pdf.js + Vite often needs explicit worker bundling / workerSrc wiring. ([GitHub][1])

### Fix: import the worker URL from your build

```ts
// src/utils/pdfParser.ts
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
```

Now it’s same-origin, version-locked, and cached like your other Vite assets.

---

## 3) Make model downloads “one and done” (real caching)

Transformers.js pipelines download and cache model files on first run. ([Hugging Face][2])
But you’ll get best results if you **avoid cross-origin quirks** and make caching explicit.

### Option A (quick win): Service Worker runtime caching (PWA)

Use `vite-plugin-pwa` and runtime-cache the model + WASM + worker fetches. The plugin supports Workbox runtimeCaching patterns. ([DeepWiki][3])

Example idea (keep it simple at first):

* CacheFirst for `.onnx`, `.bin`, `.json`, `.wasm`, `tokenizer.json`, etc.
* StaleWhileRevalidate for everything else.

### Option B (best for “never redownload”): self-host the model

Transformers.js lets you point model loading away from huggingface.co using `env.remoteHost` / `env.remotePathTemplate`. ([GitHub][4])
Put the model files under your `/public/models/...` and set:

```ts
import { env } from '@xenova/transformers';

env.allowRemoteModels = true;
env.remoteHost = `${location.origin}/`;
env.remotePathTemplate = 'models/{model}/'; // adjust to match your folder layout
```

Then the browser caches everything under your own domain (and your PWA can precache too).

---

## 4) Cache *computed* embeddings so refresh doesn’t recompute

Even if model files are cached, you’re still recomputing embeddings every page load.

### Fix: store embeddings in IndexedDB keyed by (docHash + chunkingConfig + modelId)

* Compute a SHA-256 hash of the document text (`crypto.subtle.digest`)
* Build a cache key like: `emb:v1:${modelId}:${docHash}:${chunkSize}:${overlap}:${strategy}`
* On load, check IDB first; if found, skip embedding entirely.

This gives you “instant reload” and feels like magic.

---

## 5) Speed: don’t do heavy work on the main thread

Two hotspots:

* embedding generation
* UMAP dimensionality reduction

### Fix: Web Worker both

In Vite you can do:

```ts
const worker = new Worker(new URL('./embed.worker.ts', import.meta.url), { type: 'module' });
```

Worker does the embedding loop + posts progress. UI stays buttery.

---

## 6) Batch embedding (carefully)

Batching can be faster, but note: there’s been a reported issue where embeddings from array-input differed from one-by-one for feature-extraction in some versions. ([GitHub][5])
So:

* try batching in small groups (e.g., 8–16),
* validate retrieval quality doesn’t regress,
* keep a fallback “single mode” toggle.

---

## What I’d implement first (highest ROI)

1. **Global singleton init Promise** (kills “double init” pain fast).
2. **Bundle pdf.js worker locally** (one less CDN dependency).
3. **IndexedDB cache for computed embeddings** (biggest “performance wow”).
4. **Worker-ize embedding loop** (fix UI freezing).
5. **Self-host model files or add SW runtime caching** (true “no redownload”).

If you tell me whether you’re seeing the “double download” mostly in **dev** or also in **production on GitHub Pages**, I’ll give you the exact minimal patch path (because the best fix differs a bit between “StrictMode dev annoyance” vs “prod caching headers / cross-origin caching”).

[1]: https://github.com/mozilla/pdf.js/discussions/19520?utm_source=chatgpt.com "[Bug]: pdfjs-dist Worker Import Fails in Vite - GitHub"
[2]: https://huggingface.co/docs/transformers.js/en/pipelines?utm_source=chatgpt.com "The pipeline API - Hugging Face"
[3]: https://deepwiki.com/vite-pwa/vite-plugin-pwa/7.2-runtime-caching?utm_source=chatgpt.com "Runtime Caching | vite-pwa/vite-plugin-pwa | DeepWiki"
[4]: https://github.com/huggingface/transformers.js/issues/337?utm_source=chatgpt.com "[Question] How do I specify a non-huggingface URL (that doesn ... - GitHub"
[5]: https://github.com/huggingface/transformers.js/issues/918?utm_source=chatgpt.com "When running the feature extraction pipeline with an array of ... - GitHub"
