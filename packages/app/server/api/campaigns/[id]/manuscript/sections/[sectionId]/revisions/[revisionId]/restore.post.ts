import { getDb } from '~~/server/utils/db'
import { requireCampaign } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const sectionId = Number(getRouterParam(event, 'sectionId'))
  const revisionId = Number(getRouterParam(event, 'revisionId'))
  const revision = db.prepare("SELECT snapshot FROM record_revisions WHERE id = ? AND campaign_id = ? AND record_type = 'manuscript_section' AND record_id = ?").get(revisionId, campaignId) as { snapshot: string } | undefined
  if (!revision) throw createError({ statusCode: 404, message: 'Revision not found' })
  const section = db.prepare('SELECT s.id FROM manuscript_sections s JOIN manuscripts m ON m.id = s.manuscript_id WHERE s.id = ? AND m.campaign_id = ?').get(sectionId, campaignId)
  if (!section) throw createError({ statusCode: 404, message: 'Section not found' })
  const snapshot = JSON.parse(revision.snapshot) as { title: string, content: string }
  db.prepare('UPDATE manuscript_sections SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(snapshot.title, snapshot.content, sectionId)
  return db.prepare('SELECT * FROM manuscript_sections WHERE id = ?').get(sectionId)
})
