import { getDb } from '~~/server/utils/db'
import { requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => { const db = getDb(); const id = requireCampaign(db, getRouterParam(event, 'id')); const body = await readBody<{ title: string }>(event); if (!body.title) throw createError({ statusCode: 400, message: 'Title is required' }); const result = db.prepare('INSERT INTO quests (campaign_id, title) VALUES (?, ?)').run(id, body.title); return db.prepare('SELECT * FROM quests WHERE id = ?').get(result.lastInsertRowid) })
