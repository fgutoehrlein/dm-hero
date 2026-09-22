import { getDb } from '~~/server/utils/db'
import { requireCampaign, requireCampaignRecord } from '~~/server/utils/narrative'
import { parseCondition, parseEffects } from '~~/server/utils/narrative-validation'

export default defineEventHandler((event) => {
  const db = getDb()
  const campaignId = requireCampaign(db, getRouterParam(event, 'id'))
  const quest = requireCampaignRecord(db, 'quests', getRouterParam(event, 'questId'), campaignId)
  const errors: string[] = []
  const transitions = db.prepare('SELECT from_status, to_status FROM quest_transitions WHERE quest_id = ?').all(quest.id) as Array<{ from_status: string, to_status: string }>
  for (const transition of transitions) if (transition.from_status === transition.to_status) errors.push('Transition does not change state')
  const dependencies = db.prepare('SELECT depends_on_quest_id FROM quest_dependencies WHERE quest_id = ?').all(quest.id) as Array<{ depends_on_quest_id: number }>
  if (dependencies.some(dependency => dependency.depends_on_quest_id === quest.id)) errors.push('Quest depends on itself')
  const visited = new Set<number>()
  const visit = (id: number): boolean => {
    if (id === Number(quest.id)) return true
    if (visited.has(id)) return false
    visited.add(id)
    return (db.prepare('SELECT depends_on_quest_id FROM quest_dependencies WHERE quest_id = ?').all(id) as Array<{ depends_on_quest_id: number }>).some(row => visit(row.depends_on_quest_id))
  }
  if (dependencies.some(row => visit(row.depends_on_quest_id))) errors.push('Quest dependency cycle')
  const variables = new Set((db.prepare('SELECT name FROM campaign_variables WHERE campaign_id = ?').all(campaignId) as Array<{ name: string }>).map(row => row.name))
  for (const transition of db.prepare('SELECT condition_ast, effect_ast FROM quest_transitions WHERE quest_id = ?').all(quest.id) as Array<{ condition_ast: string, effect_ast: string }>) {
    const conditionError = parseCondition(transition.condition_ast, variables)
    const effectError = parseEffects(transition.effect_ast, variables)
    if (conditionError) errors.push(conditionError)
    if (effectError) errors.push(effectError)
  }
  return { errors }
})
