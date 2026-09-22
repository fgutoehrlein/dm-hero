/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'
import { validateDialogue } from '~~/server/utils/narrative-validation'

export default defineEventHandler((event) => { const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const graph = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId); const nodes = db.prepare('SELECT id, node_type, condition_ast, effect_ast FROM dialogue_nodes WHERE graph_id = ?').all(graph.id) as any[]; const edges = db.prepare('SELECT source_node_id, target_node_id, condition_ast, effect_ast FROM dialogue_edges WHERE graph_id = ?').all(graph.id) as any[]; const variables = new Set((db.prepare('SELECT name FROM campaign_variables WHERE campaign_id = ?').all(campaignId) as Array<{ name: string }>).map(row => row.name)); return { errors: validateDialogue(nodes, edges, variables) } })
