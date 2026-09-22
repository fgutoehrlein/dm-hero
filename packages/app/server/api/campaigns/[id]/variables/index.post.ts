import { getDb } from '~~/server/utils/db'
import { requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const body = await readBody<{ name: string, value_type: string, default_value: string, description?: string }>(event)
  if (!body.name || !['boolean', 'integer', 'decimal', 'string'].includes(body.value_type)) {
    throw createError({ statusCode: 400, message: 'Name and valid type are required' })
  }
  const result = db.prepare('INSERT INTO campaign_variables (campaign_id, name, value_type, default_value, description) VALUES (?, ?, ?, ?, ?)').run(campaignId, body.name, body.value_type, body.default_value, body.description || null)
  return db.prepare('SELECT * FROM campaign_variables WHERE id = ?').get(result.lastInsertRowid)
})
