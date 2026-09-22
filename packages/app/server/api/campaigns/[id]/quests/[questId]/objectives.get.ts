import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler((event) => { const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId); return db.prepare('SELECT * FROM quest_objectives WHERE quest_id = ? ORDER BY sort_order, id').all(quest.id) })
