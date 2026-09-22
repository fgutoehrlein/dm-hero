import { getDb } from '~~/server/utils/db'
import { deleteCampaignRecord, requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const deleted = deleteCampaignRecord(db, 'quests', Number(getRouterParam(event, 'questId')), campaignId)
  if (!deleted) throw createError({ statusCode: 404, message: 'Quest not found' })
  return { ok: true }
})
