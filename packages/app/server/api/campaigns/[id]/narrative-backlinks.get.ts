import { getDb } from '../../../utils/db'
import { requireCampaign } from '../../../utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const uid = String(getQuery(event).uid || '')
  if (!/^ent_[0-9a-f]{32}$/.test(uid)) throw createError({ statusCode: 400, message: 'A valid entity UID is required' })
  return db.prepare('SELECT source_type, source_id, label FROM narrative_links WHERE campaign_id = ? AND target_uid = ?').all(campaignId, uid)
})
