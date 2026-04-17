# RAG Visualizer

An interactive educational tool that visualizes how Retrieval-Augmented Generation (RAG) works. Step through the complete RAG pipeline: document upload, chunking, embedding, retrieval, and context assembly.

## What is RAG?

RAG (Retrieval-Augmented Generation) is a technique that enhances AI responses by retrieving relevant information from your documents instead of relying solely on the model's training data. This makes responses more accurate, verifiable, and grounded in facts.

## Features

- **5-Step Pipeline Visualization**: Upload → Chunk → Embed → Retrieve → Generate
- **Interactive Controls**: Adjust chunk size and overlap in real-time
- **2D Meaning Space**: See how embeddings cluster by semantic similarity
- **Query Search**: Ask questions and watch the retrieval process
- **Prompt Assembly**: Get a ready-to-use prompt for any LLM
- **Multilingual**: English and German support
- **Privacy-First**: All processing happens in your browser

## Tech Stack

- **React 18** with TypeScript
- **Transformers.js** for client-side embeddings (all-MiniLM-L6-v2)
- **UMAP-js** for dimensionality reduction
- **Visx** for data visualization
- **Tailwind CSS** + Framer Motion for UI
- **Vite** for build tooling

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Quality Gates

```bash
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
npm run test       # Vitest tests
npm run build      # Production build
```

## How It Works

1. **Upload**: Provide a text document (.txt, .md, .pdf)
2. **Chunking**: Split into smaller overlapping pieces
3. **Embedding**: Convert chunks to 384-dimensional vectors using Transformers.js
4. **Retrieval**: Find chunks most similar to your query using cosine similarity
5. **Assembly**: Build a prompt with retrieved context for any LLM

## Privacy

- Documents are processed entirely in your browser
- The AI model (~30MB) is downloaded once from HuggingFace
- PDF.js worker is loaded from CDN
- No data is sent to any server
- No analytics or tracking

## Limitations

This is an **educational tool**, not a production RAG system:

- Uses client-side embeddings (slower than server-side)
- UMAP projection is approximate (384D → 2D loses information)
- No persistent vector database
- No actual LLM generation (prompt is provided for copy/paste)

For production RAG, consider vector databases like Pinecone, Weaviate, or Chroma with server-side embedding pipelines.

## License

MIT
