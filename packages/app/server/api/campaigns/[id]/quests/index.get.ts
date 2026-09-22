import { getDb } from '~~/server/utils/db'
import { requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler((event) => { const db = getDb(); const id = requireCampaign(db, getRouterParam(event, 'id')); return db.prepare('SELECT * FROM quests WHERE campaign_id = ? ORDER BY updated_at DESC').all(id) })
