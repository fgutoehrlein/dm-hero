import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId); const body = await readBody<{ title?: string, description?: string, status?: string, recovery_notes?: string }>(event)
  db.prepare('UPDATE quests SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), recovery_notes = COALESCE(?, recovery_notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(body.title, body.description, body.status, body.recovery_notes, quest.id)
  return db.prepare('SELECT * FROM quests WHERE id = ?').get(quest.id)
})
