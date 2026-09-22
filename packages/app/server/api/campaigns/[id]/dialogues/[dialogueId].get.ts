import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler((event) => { const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const graph = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId); return { graph, nodes: db.prepare('SELECT * FROM dialogue_nodes WHERE graph_id = ? ORDER BY sort_order').all(graph.id), edges: db.prepare('SELECT * FROM dialogue_edges WHERE graph_id = ?').all(graph.id) } })
