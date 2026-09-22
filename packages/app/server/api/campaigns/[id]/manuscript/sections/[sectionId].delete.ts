import { getDb } from '~~/server/utils/db'
import { requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const sectionId = Number(getRouterParam(event, 'sectionId'))
  const result = db.prepare('DELETE FROM manuscript_sections WHERE id = ? AND manuscript_id IN (SELECT id FROM manuscripts WHERE campaign_id = ?)').run(sectionId, campaignId)
  if (!result.changes) throw createError({ statusCode: 404, message: 'Section not found' })
  return { ok: true }
})
