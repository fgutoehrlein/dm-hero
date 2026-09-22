import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  const body = await readBody<{ title?: string, description?: string, status?: string }>(event)
  const result = db.prepare('UPDATE quest_objectives SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status) WHERE id = ? AND quest_id = ?').run(body.title, body.description, body.status, Number(getRouterParam(event, 'objectiveId')), quest.id)
  if (!result.changes) throw createError({ statusCode: 404, message: 'Objective not found' })
  return db.prepare('SELECT * FROM quest_objectives WHERE id = ?').get(Number(getRouterParam(event, 'objectiveId')))
})
