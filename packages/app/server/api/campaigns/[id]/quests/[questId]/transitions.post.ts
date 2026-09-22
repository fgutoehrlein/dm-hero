import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  const body = await readBody<{ from_status: string, to_status: string }>(event)
  if (!body.from_status || !body.to_status || body.from_status === body.to_status) {
    throw createError({ statusCode: 400, message: 'Different source and target statuses are required' })
  }
  const result = db.prepare('INSERT INTO quest_transitions (quest_id, from_status, to_status) VALUES (?, ?, ?)').run(quest.id, body.from_status, body.to_status)
  return db.prepare('SELECT * FROM quest_transitions WHERE id = ?').get(result.lastInsertRowid)
})
