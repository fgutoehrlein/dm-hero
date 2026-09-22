export interface DialogueNode { id: number, node_type: string, condition_ast: string, effect_ast?: string }
export interface DialogueEdge { source_node_id: number, target_node_id: number, condition_ast: string, effect_ast?: string }

type Values = Record<string, boolean | number | string>
type Condition = { all?: Condition[], any?: Condition[], not?: Condition, variable?: string, equals?: boolean | number | string }
type Effect = { variable: string, value: boolean | number | string }

export function parseCondition(value: string, variableNames: Set<string>) {
  let ast: Condition
  try {
    ast = JSON.parse(value || '{"all":[]}') as Condition
  }
  catch {
    return 'Invalid condition'
  }
  const validate = (node: Condition): string | undefined => {
    if (node.variable && !variableNames.has(node.variable)) return `Undefined variable: ${node.variable}`
    for (const child of [...(node.all || []), ...(node.any || []), ...(node.not ? [node.not] : [])]) { const error = validate(child); if (error) return error }
  }
  return validate(ast)
}

export function parseEffects(value: string, variableNames: Set<string>) {
  let effects: Effect[]
  try {
    effects = JSON.parse(value || '[]') as Effect[]
  }
  catch {
    return 'Invalid effects'
  }
  if (!Array.isArray(effects) || effects.some(effect => !effect?.variable || !variableNames.has(effect.variable))) return 'Undefined or invalid effect variable'
}

function matches(value: string, state: Values) {
  const condition = JSON.parse(value || '{"all":[]}') as Condition
  const test = (node: Condition): boolean => {
    if (node.all) return node.all.every(test)
    if (node.any) return node.any.some(test)
    if (node.not) return !test(node.not)
    return node.variable ? state[node.variable] === node.equals : true
  }
  return test(condition)
}

function apply(value: string | undefined, state: Values) {
  const effects = JSON.parse(value || '[]') as Effect[]
  for (const effect of effects) state[effect.variable] = effect.value
}

export function validateDialogue(nodes: DialogueNode[], edges: DialogueEdge[], variableNames: Set<string>) {
  const errors: string[] = []
  const ids = new Set(nodes.map(node => node.id))
  if (!nodes.some(node => node.node_type === 'end')) errors.push('Dialogue has no ending')
  for (const edge of edges) if (!ids.has(edge.source_node_id) || !ids.has(edge.target_node_id)) errors.push('Dialogue has an edge with a missing node')
  for (const item of [...nodes, ...edges]) {
    const conditionError = parseCondition(item.condition_ast, variableNames)
    const effectError = parseEffects(item.effect_ast || '[]', variableNames)
    if (conditionError) errors.push(conditionError)
    if (effectError) errors.push(effectError)
  }
  return [...new Set(errors)]
}

export function simulateDialogue(startNodeId: number, edges: DialogueEdge[], choices: number[], initialState: Values = {}) {
  const trace = [startNodeId]
  const state = { ...initialState }
  let current = startNodeId
  for (const choice of choices) {
    const outgoing = edges.filter(edge => edge.source_node_id === current && matches(edge.condition_ast, state))
    const edge = outgoing[choice]
    if (!edge) break
    apply(edge.effect_ast, state)
    current = edge.target_node_id
    trace.push(current)
  }
  return { trace, state }
}
