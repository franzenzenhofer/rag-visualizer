import { describe, expect, it } from 'vitest'
import type { Chunk } from '../../types'
import { documentView, hasVisibleSnap, windowLimit } from './chunkingView'

const TEXT = 'First sentence is here. Second sentence follows now. Third one ends it.'
const chunk = (start: number, end: number): Chunk => ({
  id: `c-${start}`, text: TEXT.slice(start, end), start, end, tokenCount: 0, color: '#ff0000',
})

// Window of 40 chars from 0 reaches into "Second sentence follows", the cut is at 23
const FIRST = chunk(0, 23)
const SECOND = chunk(15, 52)
const base = { text: TEXT, windowChars: 40, previous: null }

describe('documentView', () => {
  it('grows the window from the chunk start to the window limit', () => {
    const start = documentView({ ...base, phase: 'window', progress: 0, chunk: FIRST })
    const end = documentView({ ...base, phase: 'window', progress: 1, chunk: FIRST })
    expect(start.active).toEqual({ start: 0, end: 5 })
    expect(end.active).toEqual({ start: 0, end: 40 })
    expect(end.windowTokens).toBe(10)
  })

  it('gives the text past the sentence end back during snap', () => {
    const begin = documentView({ ...base, phase: 'snap', progress: 0, chunk: FIRST })
    const finish = documentView({ ...base, phase: 'snap', progress: 1, chunk: FIRST })
    expect(begin.active).toEqual({ start: 0, end: 23 })
    expect(begin.tail).toEqual({ start: 23, end: 40 })
    expect(finish.tail).toBeNull()
  })

  it('marks the text shared with the previous chunk as overlap', () => {
    const view = documentView({ ...base, previous: FIRST, phase: 'overlap', progress: 0.5, chunk: SECOND })
    expect(view.overlap).toEqual({ start: 15, end: 23 })
    expect(view.active).toBeNull()
  })

  it('shows nothing while reading', () => {
    expect(documentView({ ...base, phase: 'reading', progress: 0.5, chunk: null }).active).toBeNull()
  })
})

describe('window helpers', () => {
  it('caps the window at the document end', () => {
    expect(windowLimit(chunk(60, TEXT.length), 40, TEXT.length)).toBe(TEXT.length)
  })

  it('only shows a snap when the cut gives back a few characters', () => {
    expect(hasVisibleSnap(FIRST, 40, TEXT.length)).toBe(true)
    expect(hasVisibleSnap(chunk(60, TEXT.length), 40, TEXT.length)).toBe(false)
  })
})
