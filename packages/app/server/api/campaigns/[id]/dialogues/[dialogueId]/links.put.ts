import { getDb } from '~~/server/utils/db'
import { replaceNarrativeLinks, requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'

export default defineEventHandler(async (event) => {
  const db = getDb(); const campaignId = requireCampaign(db, getRouterParam(event, 'id')); const dialogue = requireCampaignRecord(db, 'dialogue_graphs', getRouterParam(event, 'dialogueId'), campaignId)
  const body = await readBody<{ npc_uids?: string[], quest_ids?: number[] }>(event); const npcUids = [...new Set(body.npc_uids || [])]; const questIds = [...new Set(body.quest_ids || [])]
  const validNpcs = db.prepare(`SELECT uid FROM entities e JOIN entity_types t ON t.id = e.type_id WHERE e.campaign_id = ? AND t.name = 'NPC' AND e.archived_at IS NULL AND uid IN (${npcUids.length ? npcUids.map(() => '?').join(',') : "''"})`).all(campaignId, ...npcUids) as Array<{ uid: string }>
  if (validNpcs.length !== npcUids.length) throw createError({ statusCode: 400, message: 'One or more NPCs do not belong to this campaign' })
  const validQuests = questIds.length ? db.prepare(`SELECT id FROM quests WHERE campaign_id = ? AND id IN (${questIds.map(() => '?').join(',')})`).all(campaignId, ...questIds) as Array<{ id: number }> : []
  if (validQuests.length !== questIds.length) throw createError({ statusCode: 400, message: 'One or more quests do not belong to this campaign' })
  replaceNarrativeLinks(db, campaignId, 'dialogue_graph', Number(dialogue.id), [...npcUids, ...questIds.map(id => `quest:${id}`)])
  return { ok: true }
})
