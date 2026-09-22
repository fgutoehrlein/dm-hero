import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  const result = db.prepare('DELETE FROM quest_objectives WHERE id = ? AND quest_id = ?').run(Number(getRouterParam(event, 'objectiveId')), quest.id)
  if (!result.changes) throw createError({ statusCode: 404, message: 'Objective not found' })
  return { ok: true }
})
