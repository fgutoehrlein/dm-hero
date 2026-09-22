import type Database from 'better-sqlite3'

export function requireCampaign(db: Database.Database, campaignId: string | undefined) {
  const id = Number(campaignId)
  const campaign = id && db.prepare('SELECT id FROM campaigns WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!campaign) throw createError({ statusCode: 404, message: 'Campaign not found' })
  return id
}

export function requireCampaignRecord(db: Database.Database, table: 'quests' | 'dialogue_graphs', id: string | undefined, campaignId: number) {
  const recordId = Number(id)
  const record = recordId && db.prepare(`SELECT * FROM ${table} WHERE id = ? AND campaign_id = ?`).get(recordId, campaignId)
  if (!record) throw createError({ statusCode: 404, message: 'Record not found' })
  return record as Record<string, unknown>
}

export function deleteCampaignRecord(db: Database.Database, table: 'quests' | 'dialogue_graphs', recordId: number, campaignId: number) {
  const deleted = db.transaction(() => {
    const targetUid = table === 'quests' ? `quest:${recordId}` : `dialogue:${recordId}`
    db.prepare('DELETE FROM narrative_links WHERE campaign_id = ? AND ((source_type = ? AND source_id = ?) OR target_uid = ?)').run(campaignId, table === 'quests' ? 'quest' : 'dialogue_graph', recordId, targetUid)
    return db.prepare(`DELETE FROM ${table} WHERE id = ? AND campaign_id = ?`).run(recordId, campaignId).changes > 0
  })()
  return deleted
}

export function replaceNarrativeLinks(db: Database.Database, campaignId: number, sourceType: 'quest' | 'dialogue_graph', sourceId: number, targetUids: string[]) {
  db.transaction(() => {
    db.prepare('DELETE FROM narrative_links WHERE campaign_id = ? AND source_type = ? AND source_id = ?').run(campaignId, sourceType, sourceId)
    const insert = db.prepare('INSERT OR IGNORE INTO narrative_links (campaign_id, source_type, source_id, target_uid) VALUES (?, ?, ?, ?)')
    for (const targetUid of [...new Set(targetUids.filter(Boolean))]) insert.run(campaignId, sourceType, sourceId, targetUid)
  })()
}

export function getNarrativeLinks(db: Database.Database, campaignId: number, sourceType: 'quest' | 'dialogue_graph', sourceId: number) {
  return db.prepare('SELECT target_uid FROM narrative_links WHERE campaign_id = ? AND source_type = ? AND source_id = ? ORDER BY target_uid').all(campaignId, sourceType, sourceId) as Array<{ target_uid: string }>
}

export function extractUids(text: string) {
  return [...new Set(text.match(/ent_[0-9a-f]{32}/g) || [])]
}
