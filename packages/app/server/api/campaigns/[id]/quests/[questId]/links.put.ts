import { getDb } from '~~/server/utils/db'
import { replaceNarrativeLinks, requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  const body = await readBody<{ npc_uids?: string[], dialogue_ids?: number[] }>(event); const npcUids = [...new Set(body.npc_uids || [])]; const dialogueIds = [...new Set(body.dialogue_ids || [])]
  const validNpcs = db.prepare(`SELECT uid FROM entities e JOIN entity_types t ON t.id = e.type_id WHERE e.campaign_id = ? AND t.name = 'NPC' AND e.archived_at IS NULL AND uid IN (${npcUids.length ? npcUids.map(() => '?').join(',') : "''"})`).all(campaignId, ...npcUids) as Array<{ uid: string }>
  if (validNpcs.length !== npcUids.length) throw createError({ statusCode: 400, message: 'One or more NPCs do not belong to this campaign' })
  const validDialogues = dialogueIds.length ? db.prepare(`SELECT id FROM dialogue_graphs WHERE campaign_id = ? AND id IN (${dialogueIds.map(() => '?').join(',')})`).all(campaignId, ...dialogueIds) as Array<{ id: number }> : []
  if (validDialogues.length !== dialogueIds.length) throw createError({ statusCode: 400, message: 'One or more dialogues do not belong to this campaign' })
  replaceNarrativeLinks(db, campaignId, 'quest', Number(quest.id), [...npcUids, ...dialogueIds.map(id => `dialogue:${id}`)])
  return { ok: true }
})
