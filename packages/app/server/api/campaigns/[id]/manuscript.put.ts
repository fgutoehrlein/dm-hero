import { getDb } from '../../../utils/db'
import { requireCampaign } from '../../../utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const body = await readBody<{ title?: string, description?: string }>(event)
  db.prepare('UPDATE manuscripts SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE campaign_id = ?')
    .run(body.title, body.description, campaignId)
  return db.prepare('SELECT * FROM manuscripts WHERE campaign_id = ?').get(campaignId)
})
