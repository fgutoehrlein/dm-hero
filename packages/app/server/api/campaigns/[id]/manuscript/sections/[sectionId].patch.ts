import { getDb } from '~~/server/utils/db'
import { extractUids, requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const sectionId = Number(getRouterParam(event, 'sectionId')); const body = await readBody<{ title?: string, content?: string, section_type?: string, viewpoint?: string, location_entity_id?: number | null, story_date?: string }>(event)
  const section = db.prepare('SELECT s.id FROM manuscript_sections s JOIN manuscripts m ON m.id = s.manuscript_id WHERE s.id = ? AND m.campaign_id = ?').get(sectionId, campaignId)
  if (!section) throw createError({ statusCode: 404, message: 'Section not found' })
  if (body.section_type && !['book', 'part', 'chapter', 'scene'].includes(body.section_type)) throw createError({ statusCode: 400, message: 'Invalid section type' })
  db.prepare('UPDATE manuscript_sections SET title = COALESCE(?, title), content = COALESCE(?, content), section_type = COALESCE(?, section_type), viewpoint = COALESCE(?, viewpoint), location_entity_id = COALESCE(?, location_entity_id), story_date = COALESCE(?, story_date), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(body.title, body.content, body.section_type, body.viewpoint, body.location_entity_id, body.story_date, sectionId)
  const updated = db.prepare('SELECT * FROM manuscript_sections WHERE id = ?').get(sectionId) as Record<string, unknown>
  db.prepare('INSERT INTO record_revisions (campaign_id, record_type, record_id, snapshot) VALUES (?, ?, ?, ?)')
    .run(campaignId, 'manuscript_section', sectionId, JSON.stringify(updated))
  db.prepare("DELETE FROM narrative_links WHERE campaign_id = ? AND source_type = 'manuscript_section' AND source_id = ?").run(campaignId, sectionId)
  const insertLink = db.prepare("INSERT OR IGNORE INTO narrative_links (campaign_id, source_type, source_id, target_uid) VALUES (?, 'manuscript_section', ?, ?)")
  for (const uid of extractUids(String(updated.content || ''))) insertLink.run(campaignId, sectionId, uid)
  return updated
})
