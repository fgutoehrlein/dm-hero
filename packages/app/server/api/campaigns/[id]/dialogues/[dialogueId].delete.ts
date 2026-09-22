import { getDb } from '~~/server/utils/db'
import { deleteCampaignRecord, requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const deleted = deleteCampaignRecord(db, 'dialogue_graphs', Number(getRouterParam(event, 'dialogueId')), campaignId)
  if (!deleted) throw createError({ statusCode: 404, message: 'Dialogue not found' })
  return { ok: true }
})
