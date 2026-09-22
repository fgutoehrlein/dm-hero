import { getDb } from '~~/server/utils/db'
import { requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  return db.prepare('SELECT * FROM campaign_variables WHERE campaign_id = ? ORDER BY name').all(campaignId)
})
