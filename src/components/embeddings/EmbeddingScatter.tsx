import { useState, useMemo } from 'react'
import { Group } from '@visx/group'
import { scaleLinear } from '@visx/scale'
import { useTooltip, TooltipWithBounds } from '@visx/tooltip'
import { motion } from 'framer-motion'

interface Point {
  x: number
  y: number
  chunkId: string
  text: string
  color: string
}

interface EmbeddingScatterProps {
  points: Point[]
  width?: number
  height?: number
  visibleCount?: number // If provided, only show this many points (for animation)
}

export function EmbeddingScatter({
  points,
  width = 600,
  height = 400,
  visibleCount,
}: EmbeddingScatterProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  // If visibleCount is provided, only show that many points
  const visiblePoints = useMemo(() => {
    if (visibleCount === undefined) return points
    return points.slice(0, visibleCount)
  }, [points, visibleCount])

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<Point>()

  const margin = { top: 20, right: 20, bottom: 20, left: 20 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const xScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, 1],
        range: [0, innerWidth],
      }),
    [innerWidth]
  )

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, 1],
        range: [innerHeight, 0],
      }),
    [innerHeight]
  )

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Background grid */}
        <rect
          x={margin.left}
          y={margin.top}
          width={innerWidth}
          height={innerHeight}
          fill="transparent"
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={1}
          rx={8}
        />

        <Group left={margin.left} top={margin.top}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((tick) => (
            <g key={tick}>
              <line
                x1={xScale(tick)}
                y1={0}
                x2={xScale(tick)}
                y2={innerHeight}
                className="stroke-gray-100 dark:stroke-gray-800"
                strokeDasharray="4,4"
              />
              <line
                x1={0}
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                className="stroke-gray-100 dark:stroke-gray-800"
                strokeDasharray="4,4"
              />
            </g>
          ))}

          {/* Points - animated appearance */}
          {visiblePoints.map((point) => {
            const isHovered = hoveredPoint === point.chunkId

            return (
              <motion.circle
                key={point.chunkId}
                cx={xScale(point.x)}
                cy={yScale(point.y)}
                fill={point.color}
                stroke="white"
                strokeWidth={2}
                initial={{ r: 0, opacity: 0 }}
                animate={{
                  r: isHovered ? 12 : 8,
                  opacity: 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoveredPoint(point.chunkId)
                  const rect = e.currentTarget.getBoundingClientRect()
                  showTooltip({
                    tooltipData: point,
                    tooltipLeft: rect.left + rect.width / 2,
                    tooltipTop: rect.top,
                  })
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null)
                  hideTooltip()
                }}
              />
            )
          })}
        </Group>

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500 text-xs"
        >
          UMAP Dimension 1
        </text>
        <text
          x={-height / 2}
          y={12}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-gray-400 dark:fill-gray-500 text-xs"
        >
          UMAP Dimension 2
        </text>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          className="!bg-gray-900 !text-white !px-3 !py-2 !rounded-lg !shadow-lg !text-sm !max-w-xs"
        >
          <p className="line-clamp-3">{tooltipData.text}</p>
        </TooltipWithBounds>
      )}
    </div>
  )
}
