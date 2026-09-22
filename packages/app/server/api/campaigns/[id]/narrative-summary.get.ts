import { getDb } from '../../../utils/db'
import { requireCampaign } from '../../../utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const count = (table: string) => Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE campaign_id = ?`).get(campaignId) as { count: number }).count)
  const manuscript = db.prepare('SELECT id FROM manuscripts WHERE campaign_id = ?').get(campaignId) as { id: number }
  const scenes = Number((db.prepare("SELECT COUNT(*) AS count FROM manuscript_sections WHERE manuscript_id = ? AND section_type = 'scene'").get(manuscript.id) as { count: number }).count)
  return { scenes, quests: count('quests'), dialogues: count('dialogue_graphs') }
})
