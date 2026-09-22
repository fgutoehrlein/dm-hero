import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const dialogue = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId)
  const body = await readBody<{ title?: string, description?: string, lifecycle_state?: string }>(event)
  db.prepare('UPDATE dialogue_graphs SET title = COALESCE(?, title), description = COALESCE(?, description), lifecycle_state = COALESCE(?, lifecycle_state), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(body.title, body.description, body.lifecycle_state, dialogue.id)
  return db.prepare('SELECT * FROM dialogue_graphs WHERE id = ?').get(dialogue.id)
})
