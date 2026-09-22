import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  const { depends_on_quest_id } = await readBody<{ depends_on_quest_id: number }>(event)
  const dependency = requireCampaignRecord(db, 'quests', String(depends_on_quest_id), campaignId)
  if (dependency.id === quest.id) throw createError({ statusCode: 400, message: 'A quest cannot depend on itself' })
  db.prepare('INSERT OR IGNORE INTO quest_dependencies (quest_id, depends_on_quest_id) VALUES (?, ?)').run(quest.id, dependency.id)
  return { ok: true }
})
