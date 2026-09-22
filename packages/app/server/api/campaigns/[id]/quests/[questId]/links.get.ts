/* eslint-disable @stylistic/quotes */
import { getDb } from '~~/server/utils/db'
import { getNarrativeLinks, requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler((event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  const links = getNarrativeLinks(db, campaignId, 'quest', Number(quest.id)).map(link => link.target_uid)
  const npcUids = links.filter(uid => uid.startsWith('ent_')); const dialogueIds = links.filter(uid => uid.startsWith('dialogue:')).map(uid => Number(uid.slice(9)))
  return {
    npc_uids: npcUids,
    npcs: db.prepare(`SELECT e.id, e.uid, e.name FROM entities e JOIN entity_types t ON t.id = e.type_id WHERE e.campaign_id = ? AND t.name = 'NPC' AND e.archived_at IS NULL ORDER BY e.name`).all(campaignId),
    dialogue_ids: dialogueIds,
    dialogues: dialogueIds.length ? db.prepare(`SELECT id, title FROM dialogue_graphs WHERE campaign_id = ? AND id IN (${dialogueIds.map(() => '?').join(',')}) ORDER BY title`).all(campaignId, ...dialogueIds) : [],
  }
})
