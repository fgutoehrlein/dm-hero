import { getDb } from '~~/server/utils/db'
import { requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const sectionId = Number(getRouterParam(event, 'sectionId'))
  return db.prepare("SELECT * FROM record_revisions WHERE campaign_id = ? AND record_type = 'manuscript_section' AND record_id = ? ORDER BY id DESC").all(campaignId, sectionId)
})
