/* eslint-disable @stylistic/quotes */
import { getDb } from '~~/server/utils/db'
import { getNarrativeLinks, requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const dialogue = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId)
  const links = getNarrativeLinks(db, campaignId, 'dialogue_graph', Number(dialogue.id)).map(link => link.target_uid)
  const npcUids = links.filter(uid => uid.startsWith('ent_')); const questIds = links.filter(uid => uid.startsWith('quest:')).map(uid => Number(uid.slice(6)))
  return { npc_uids: npcUids, npcs: db.prepare(`SELECT e.id, e.uid, e.name FROM entities e JOIN entity_types t ON t.id = e.type_id WHERE e.campaign_id = ? AND t.name = 'NPC' AND e.archived_at IS NULL ORDER BY e.name`).all(campaignId), quest_ids: questIds, quests: questIds.length ? db.prepare(`SELECT id, title, status FROM quests WHERE campaign_id = ? AND id IN (${questIds.map(() => '?').join(',')}) ORDER BY title`).all(campaignId, ...questIds) : [] }
})
