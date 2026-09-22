import { getDb } from '../../../../../utils/db'
import { requireCampaign } from '../../../../../utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const { ids } = await readBody<{ ids: number[] }>(event)
  if (!Array.isArray(ids)) throw createError({ statusCode: 400, message: 'ids are required' })
  const manuscript = db.prepare('SELECT id FROM manuscripts WHERE campaign_id = ?').get(campaignId) as { id: number }
  const update = db.prepare('UPDATE manuscript_sections SET sort_order = ? WHERE id = ? AND manuscript_id = ?')
  db.transaction(() => ids.forEach((id, index) => update.run(index, id, manuscript.id)))()
  return { ok: true }
})
