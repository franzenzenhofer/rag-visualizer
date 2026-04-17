# RAG Visualizer - Hans Rosling Style Refactor

## The Hans Rosling Principles

1. **CLEAR** - No jargon without explanation
2. **VISUAL** - Every concept has a visual representation
3. **STEP-BY-STEP** - Walk through each action as it happens
4. **BIG NUMBERS** - Key stats are prominent and readable
5. **COLOR = MEANING** - Every color has a clear purpose
6. **NO HIDDEN CONTENT** - Everything visible, nothing collapsed
7. **SPORTSCASTER STYLE** - Narrate what's happening in real-time

---

## Refactor Plan by Step

### Step 1: UPLOAD
- [ ] Big clear title: "Your document becomes the AI's textbook"
- [ ] Visual: File icon → Arrow → "AI Knowledge Base"
- [ ] Show file size + estimated chunks preview
- [ ] Sample docs clearly labeled

### Step 2: CHUNKING ✅ DONE
- [x] Color legend: "Each COLOR = One Chunk"
- [x] Interactive sliders with real-time preview
- [x] Big stats: Chunk count + Average size
- [x] Side-by-side: Document view | Chunk list

### Step 3: EMBEDDINGS
- [ ] Clear explanation: "GPS coordinates for meaning"
- [ ] Progress bar with "Loading AI brain..."
- [ ] Scatter plot legend: "Dots close = Similar meaning"
- [ ] Hover tooltip showing chunk text
- [ ] Big stat: "384 numbers per chunk"

### Step 4: RETRIEVAL
- [ ] Query input prominently displayed
- [ ] Visual: Query dot → Connection lines → Results
- [ ] Similarity bars with percentage labels
- [ ] Clear explanation: "Finding the closest chunks"

### Step 5: GENERATION
- [ ] Two-column: "What AI reads" | "Complete prompt"
- [ ] Visual flow: Chunks → Combined → Prompt
- [ ] Copy button prominent
- [ ] Explanation: "AI answers from YOUR content"

---

## UI Components to Update

1. `DocumentUpload.tsx` - Add visual flow
2. `ChunkingVisualizer.tsx` - ✅ DONE
3. `EmbeddingVisualizer.tsx` - Add legends
4. `EmbeddingScatter.tsx` - Fix hover tooltips
5. `RetrievalVisualizer.tsx` - Add visual connections
6. `GenerationVisualizer.tsx` - Two-column layout

---

## Color Coding System

| Color | Meaning |
|-------|---------|
| Blue | Primary actions, UI elements |
| Amber/Yellow | Legends, explanations |
| Green | Success, completion |
| Red-Orange | Chunk colors (10 distinct) |

---

## Execution Order

1. Run build to verify current state
2. Update each step component
3. Test after each change
4. Final build + test

---

**Goal**: Anyone looking at any step should immediately understand:
- WHAT they're looking at
- WHY it matters
- HOW to interact with it
