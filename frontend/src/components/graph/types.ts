export interface GraphNode {
  id: string
  label: string
  type: 'document' | 'author' | 'tag'
  documentId?: string
}

export interface GraphEdge {
  source: string
  target: string
  type: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  totalDocuments: number
}

export interface SimNode extends GraphNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface SimEdge {
  source: SimNode
  target: SimNode
  type: string
}
