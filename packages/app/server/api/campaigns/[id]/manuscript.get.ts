import { getDb } from '../../../utils/db'
import { requireCampaign } from '../../../utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const manuscript = db.prepare('SELECT * FROM manuscripts WHERE campaign_id = ?').get(campaignId)
  const sections = db.prepare('SELECT * FROM manuscript_sections WHERE manuscript_id = ? ORDER BY sort_order, id').all((manuscript as { id: number }).id)
  return { manuscript, sections }
})
