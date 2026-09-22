import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const graph = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId) as { id: number }
  const body = await readBody<{ node_type?: string, content?: string }>(event) || {}
  const nodeType = body.node_type || 'line'
  if (!['line', 'choice', 'condition', 'effect', 'note', 'end'].includes(nodeType)) {
    throw createError({ statusCode: 400, message: 'Invalid node type' })
  }
  const lineId = nodeType === 'line' ? `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : null
  const result = db.prepare('INSERT INTO dialogue_nodes (graph_id, node_type, content, line_id, sort_order) VALUES (?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM dialogue_nodes WHERE graph_id = ?), 0))').run(graph.id, nodeType, body.content || '', lineId, graph.id)
  return db.prepare('SELECT * FROM dialogue_nodes WHERE id = ?').get(result.lastInsertRowid)
})
