/**
 * Where the flying chunk starts and lands.
 *
 * The flying copy must cover the highlighted text exactly, so it reads as the
 * same text lifting off the page: it gets the panel's content width plus the
 * first line's indent (chunks often start mid-line), so it wraps exactly like
 * the source. It starts clipped to the visible part of the document panel.
 */

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export interface Flight {
  // Visible part of the selection, where the flight starts
  from: Box
  // The reserved slot in the chunk list, where it lands
  to: Box
  // Text layout inside the start box, so the copy matches the source
  textTop: number
  textIndent: number
  textWidth: number
}

export interface FlightInput {
  // Content box of the document panel (inside border and padding)
  contentLeft: number
  contentWidth: number
  // Visible area of the scrolling document panel
  visibleTop: number
  visibleBottom: number
  // Union box and first line box of the highlighted text
  selection: Box
  firstLineLeft: number
  slot: Box
}

export function computeFlight(input: FlightInput): Flight {
  const { selection } = input
  const top = Math.max(selection.top, input.visibleTop)
  const bottom = Math.min(selection.top + selection.height, input.visibleBottom)
  return {
    from: { left: input.contentLeft, top, width: input.contentWidth, height: Math.max(0, bottom - top) },
    to: input.slot,
    textTop: selection.top - top,
    textIndent: input.firstLineLeft - input.contentLeft,
    textWidth: input.contentWidth,
  }
}

const toBox = (rect: DOMRect): Box => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })

// Read the live layout from the DOM and hand it to computeFlight
export function measureFlightFromDom(panel: HTMLElement, selection: HTMLElement, slot: HTMLElement): Flight | null {
  const firstLine = selection.getClientRects()[0]
  if (!firstLine) return null
  const panelRect = panel.getBoundingClientRect()
  const style = getComputedStyle(panel)
  const contentLeft = panelRect.left + panel.clientLeft + parseFloat(style.paddingLeft)
  const contentWidth = panel.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const visibleTop = panelRect.top + panel.clientTop

  return computeFlight({
    contentLeft,
    contentWidth,
    visibleTop,
    visibleBottom: visibleTop + panel.clientHeight,
    selection: toBox(selection.getBoundingClientRect()),
    firstLineLeft: firstLine.left,
    slot: toBox(slot.getBoundingClientRect()),
  })
}
