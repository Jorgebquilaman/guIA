import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force'
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom'
import { select } from 'd3-selection'
import { Plus, Minus, Maximize2, Minimize2 } from 'lucide-react'
import type { GraphData, SimNode, SimEdge } from './types'

const NODE_RADIUS = { document: 12, author: 9, tag: 7 }
const COLORS: Record<string, string> = {
  document: '#2563EB',
  author: '#E87100',
  tag: '#10B981',
}

interface ForceGraphProps {
  data: GraphData
  width?: number
  height?: number
  onTagClick?: (tag: string) => void
  onAuthorClick?: (author: string) => void
}

export default function ForceGraph({ data, width = 900, height = 600, onTagClick, onAuthorClick }: ForceGraphProps) {
  const navigate = useNavigate()
  const svgRef = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const zoomBehaviorRef = useRef<any>(null)

  function applyZoom(k: number) {
    const svg = select(svgRef.current!)
    const behavior = zoomBehaviorRef.current
    if (!behavior) return
    ;(svg as any).transition().duration(300).call(behavior.scaleBy, k)
  }

  function resetZoom() {
    const svg = select(svgRef.current!)
    const behavior = zoomBehaviorRef.current
    if (!behavior) return
    ;(svg as any).transition().duration(400).call(behavior.transform, zoomIdentity)
  }

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return

    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen()
      } catch { /* ignored */ }
    } else {
      try {
        await document.exitFullscreen()
      } catch { /* ignored */ }
    }
  }, [])

  useEffect(() => {
    function onFsChange() {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl || !data.nodes.length) return

    const w = width
    const h = height

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }))
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    const edges: SimEdge[] = data.edges
      .map((e) => {
        const source = nodeMap.get(e.source)
        const target = nodeMap.get(e.target)
        if (!source || !target) return null
        return { source, target, type: e.type }
      })
      .filter(Boolean) as SimEdge[]

    const sim = forceSimulation<SimNode>(nodes)
      .force('link', forceLink<SimNode, SimEdge>(edges).distance(80).strength(0.3))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(w / 2, h / 2))
      .force('collide', forceCollide().radius((d: any) => NODE_RADIUS[d.type as keyof typeof NODE_RADIUS] + 8))
      .alphaDecay(0.02)

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    svgEl.appendChild(g)

    const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.appendChild(edgeGroup)

    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.appendChild(nodeGroup)

    const edgeElements = new Map<string, SVGLineElement>()
    edges.forEach((e) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('stroke', '#d1d5db')
      line.setAttribute('stroke-width', '1')
      line.setAttribute('stroke-opacity', '0.5')
      edgeGroup.appendChild(line)
      edgeElements.set(`${(e.source as SimNode).id}-${(e.target as SimNode).id}`, line)
    })

    const nodeElements = new Map<string, SVGGElement>()
    nodes.forEach((n) => {
      const gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      gEl.setAttribute('cursor', 'pointer')
      gEl.dataset.nodeId = n.id

      const isDoc = n.type === 'document'
      const r = NODE_RADIUS[n.type]

      if (isDoc) {
        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        shape.setAttribute('r', String(r))
        shape.setAttribute('fill', COLORS[n.type])
        shape.setAttribute('stroke', '#fff')
        shape.setAttribute('stroke-width', '2')
        gEl.appendChild(shape)

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('fill', '#333')
        text.setAttribute('font-size', '7')
        text.setAttribute('font-weight', '500')
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('dy', String(r + 10))
        text.setAttribute('font-family', 'Inter, sans-serif')
        text.textContent = n.label.length > 14 ? n.label.slice(0, 12) + '…' : n.label
        gEl.appendChild(text)
      } else {
        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        shape.setAttribute('r', String(r))
        shape.setAttribute('fill', COLORS[n.type])
        shape.setAttribute('stroke', '#fff')
        shape.setAttribute('stroke-width', '1.5')
        gEl.appendChild(shape)

        if (n.type === 'author') {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          text.setAttribute('fill', COLORS[n.type])
          text.setAttribute('font-size', '8')
          text.setAttribute('font-weight', '600')
          text.setAttribute('text-anchor', 'middle')
          text.setAttribute('dy', '14')
          text.setAttribute('font-family', 'Inter, sans-serif')
          text.textContent = n.label.length > 12 ? n.label.slice(0, 10) + '…' : n.label
          gEl.appendChild(text)
        }

        if (n.type === 'tag') {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          text.setAttribute('fill', '#333')
          text.setAttribute('font-size', '7')
          text.setAttribute('font-weight', '500')
          text.setAttribute('text-anchor', 'middle')
          text.setAttribute('dy', String(r + 10))
          text.setAttribute('font-family', 'Inter, sans-serif')
          text.textContent = n.label.length > 10 ? n.label.slice(0, 9) + '…' : n.label
          gEl.appendChild(text)
        }
      }

      gEl.addEventListener('mouseenter', (e) => {
        const rect = svgEl.getBoundingClientRect()
        setTooltip({
          text: `${n.type === 'document' ? 'Documento' : n.type === 'author' ? 'Autor' : 'Etiqueta'}: ${n.label}`,
          x: (e as MouseEvent).clientX - rect.left + 12,
          y: (e as MouseEvent).clientY - rect.top - 8,
        })
      })
      gEl.addEventListener('mousemove', (e) => {
        const rect = svgEl.getBoundingClientRect()
        setTooltip((prev) =>
          prev
            ? { ...prev, x: (e as MouseEvent).clientX - rect.left + 12, y: (e as MouseEvent).clientY - rect.top - 8 }
            : null
        )
      })
      gEl.addEventListener('mouseleave', () => {
        setTooltip(null)
      })
      gEl.addEventListener('click', () => {
        if (n.type === 'document' && n.documentId) {
          navigate(`/documentos/${n.documentId}`)
        } else if (n.type === 'tag' && onTagClick) {
          onTagClick(n.label)
        } else if (n.type === 'author' && onAuthorClick) {
          onAuthorClick(n.label)
        }
      })

      nodeGroup.appendChild(gEl)
      nodeElements.set(n.id, gEl)
    })

    sim.on('tick', () => {
      nodes.forEach((n) => {
        const el = nodeElements.get(n.id)
        if (el) {
          el.setAttribute('transform', `translate(${n.x ?? w / 2},${n.y ?? h / 2})`)
        }
      })
      edges.forEach((e) => {
        const src = e.source as SimNode
        const tgt = e.target as SimNode
        const key = `${src.id}-${tgt.id}`
        const line = edgeElements.get(key)
        if (line) {
          line.setAttribute('x1', String(src.x ?? w / 2))
          line.setAttribute('y1', String(src.y ?? h / 2))
          line.setAttribute('x2', String(tgt.x ?? w / 2))
          line.setAttribute('y2', String(tgt.y ?? h / 2))
        }
      })
    })

    const svgSelection = select(svgEl)
    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 6])
      .on('zoom', (event) => {
        g.setAttribute('transform', event.transform.toString())
      })

    svgSelection.call(zoomBehavior)
    zoomBehaviorRef.current = zoomBehavior

    return () => {
      sim.stop()
      zoomBehavior.on('zoom', null)
      svgSelection.on('.zoom', null)
      svgEl.removeChild(g)
    }
  }, [data, width, height, navigate, onTagClick, onAuthorClick])

  return (
    <div
      ref={containerRef}
      className={`${fullscreen ? 'fixed inset-0 z-[9999] bg-white' : 'relative'}`}
    >
      <div ref={wrapperRef} className={`relative ${fullscreen ? 'h-screen w-screen' : ''}`}>
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
          <button
            onClick={() => applyZoom(1.3)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100"
            title="Acercar"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => applyZoom(1 / 1.3)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100"
            title="Alejar"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={resetZoom}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100"
            title="Restablecer zoom"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100"
            title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full rounded-lg bg-white ${fullscreen ? 'h-screen rounded-none' : ''}`}
          style={{ minHeight: fullscreen ? '100vh' : height }}
        />

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}

        {!fullscreen && (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-[#2563EB]" />
              Documento
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#E87100]" />
              Autor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#10B981]" />
              Etiqueta
            </span>
            <span className="ml-auto text-gray-400">
              {data.nodes.length} nodos · {data.edges.length} conexiones · {data.totalDocuments} documentos
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
