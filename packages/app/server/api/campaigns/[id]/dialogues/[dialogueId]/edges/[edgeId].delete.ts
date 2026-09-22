import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const graph = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId)
  const result = db.prepare('DELETE FROM dialogue_edges WHERE id = ? AND graph_id = ?').run(Number(getRouterParam(event, 'edgeId')), graph.id)
  if (!result.changes) throw createError({ statusCode: 404, message: 'Edge not found' })
  return { ok: true }
})
