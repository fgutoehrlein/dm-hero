import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'
import { simulateDialogue } from '~~/server/utils/narrative-validation'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const graph = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId)
  const body = await readBody<{ start_node_id: number, choices?: number[], state?: Record<string, boolean | number | string> }>(event)
  const node = db.prepare('SELECT id FROM dialogue_nodes WHERE id = ? AND graph_id = ?').get(body.start_node_id, graph.id)
  if (!node) throw createError({ statusCode: 400, message: 'Start node not found' })
  const edges = db.prepare('SELECT source_node_id, target_node_id, condition_ast, effect_ast FROM dialogue_edges WHERE graph_id = ? ORDER BY id').all(graph.id) as Array<{ source_node_id: number, target_node_id: number, condition_ast: string, effect_ast: string }>
  return simulateDialogue(body.start_node_id, edges, body.choices || [], body.state || {})
})
