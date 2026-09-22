import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  return db.prepare('SELECT q.id, q.title, q.status FROM quest_dependencies d JOIN quests q ON q.id = d.depends_on_quest_id WHERE d.quest_id = ?').all(quest.id)
})
