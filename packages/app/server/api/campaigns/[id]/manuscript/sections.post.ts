import { getDb } from '../../../../utils/db'
import { requireCampaign } from '../../../../utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const body = await readBody<{ title: string, section_type: string, parent_section_id?: number | null }>(event)
  if (!body.title || !['book', 'part', 'chapter', 'scene'].includes(body.section_type)) throw createError({ statusCode: 400, message: 'Title and valid section type are required' })
  const manuscript = db.prepare('SELECT id FROM manuscripts WHERE campaign_id = ?').get(campaignId) as { id: number }
  const result = db.prepare('INSERT INTO manuscript_sections (manuscript_id, parent_section_id, title, section_type, sort_order) VALUES (?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM manuscript_sections WHERE manuscript_id = ?), 0))').run(manuscript.id, body.parent_section_id || null, body.title, body.section_type, manuscript.id)
  return db.prepare('SELECT * FROM manuscript_sections WHERE id = ?').get(result.lastInsertRowid)
})
