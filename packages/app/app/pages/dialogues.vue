<!-- eslint-disable @typescript-eslint/no-explicit-any, @stylistic/brace-style -->
<template>
  <v-container>
    <UiPageHeader title="Dialogue" subtitle="Campaign dialogue graphs">
      <template #actions><v-btn data-testid="dialogue-add" color="primary" @click="addDialogue">Add dialogue</v-btn></template>
    </UiPageHeader>
    <v-alert v-if="!campaignId" type="info">Choose a campaign first.</v-alert>
    <v-row v-else>
      <v-col cols="12" md="3">
        <v-list>
          <v-list-item v-for="dialogue in dialogues" :key="dialogue.id" :data-testid="`dialogue-${dialogue.title}`" :active="selectedId === dialogue.id" :title="dialogue.title" @click="selectDialogue(dialogue.id)" />
        </v-list>
      </v-col>
      <v-col cols="12" md="9">
        <v-card v-if="detail">
          <v-card-title class="d-flex">{{ detail.graph.title }}<v-spacer /><v-btn data-testid="dialogue-delete" color="error" variant="text" size="small" @click="requestDelete">Delete</v-btn><v-btn data-testid="dialogue-add-line" size="small" @click="addNode('line')">Add line</v-btn><v-btn data-testid="dialogue-add-ending" size="small" class="ml-2" @click="addNode('end')">Add ending</v-btn></v-card-title>
          <v-tabs v-model="tab"><v-tab value="transcript">Transcript</v-tab><v-tab data-testid="dialogue-tab-canvas" value="canvas">Canvas</v-tab></v-tabs>
          <div class="px-4 pt-3"><div class="text-subtitle-1">Story links</div><v-select v-model="linkedNpcUids" :items="linkData.npcs" item-title="name" item-value="uid" label="NPCs" multiple chips closable-chips data-testid="dialogue-npc-links" @update:model-value="saveLinks" /><v-select v-model="linkedQuestIds" :items="linkData.quests" item-title="title" item-value="id" label="Quests" multiple chips closable-chips data-testid="dialogue-quest-links" @update:model-value="saveLinks" /></div>
          <v-card-text v-if="tab === 'transcript'"><v-list><v-list-item v-for="node in detail.nodes" :key="node.id" data-testid="dialogue-node"><v-select v-model="node.node_type" :items="nodeTypes" density="compact" hide-details style="max-width: 120px" @update:model-value="saveNode(node)" /><v-text-field v-model="node.content" :label="node.node_type" density="compact" hide-details @blur="saveNode(node)" /><template #append><v-btn data-testid="dialogue-node-delete" aria-label="Delete dialogue node" icon="mdi-delete" size="small" variant="text" @click="removeNode(node)" /></template></v-list-item></v-list><v-divider class="my-3" /><div class="text-subtitle-1">Connect lines</div><v-list density="compact"><v-list-item v-for="edge in detail.edges" :key="edge.id" data-testid="dialogue-edge" :title="`${nodeName(edge.source_node_id)} → ${nodeName(edge.target_node_id)}`"><template #append><v-btn data-testid="dialogue-edge-delete" aria-label="Delete dialogue edge" icon="mdi-delete" size="small" variant="text" @click="removeEdge(edge.id)" /></template></v-list-item></v-list></v-card-text>
          <v-card-text v-else class="dialogue-canvas-panel">
            <div class="dialogue-node-legend" aria-label="Dialogue node types">
              <span v-for="item in nodeLegend" :key="item.type" class="dialogue-node-legend__item"><b>{{ item.label }}</b><span>{{ item.type }}</span></span>
            </div>
            <VueFlow data-testid="dialogue-canvas" v-model:nodes="flowNodes" :edges="flowEdges" :node-types="nodeTypesMap" fit-view-on-init :default-viewport="{ zoom: 0.85, x: 0, y: 0 }" style="height: 450px" @connect="connect" @node-drag-stop="position" />
          </v-card-text>
          <v-card-actions><v-btn data-testid="dialogue-validate" variant="tonal" @click="validate">Validate</v-btn><v-btn data-testid="dialogue-simulate" variant="tonal" @click="simulate">Simulate first path</v-btn><span v-if="trace.length">Trace: {{ trace.join(' → ') }}</span></v-card-actions>
          <v-alert v-if="error" type="error" class="mx-4 mb-4">{{ error }}</v-alert><v-alert v-else-if="errors.length" type="warning" class="mx-4 mb-4">{{ errors.join(', ') }}</v-alert>
        </v-card>
      </v-col>
    </v-row>
    <UiDeleteConfirmDialog v-model="showDeleteDialog" title="Delete dialogue" :message="`Delete '${detail?.graph.title}' and all its nodes?`" :loading="deleting" @confirm="confirmDelete" @cancel="showDeleteDialog = false" />
  </v-container>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, @stylistic/brace-style */
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import DialogueFlowNode from '~/components/dialogues/DialogueFlowNode.vue'

type Dialogue = { id: number, title: string }
type Node = { id: number, node_type: string, content: string, line_id?: string, participant?: string, position_x: number, position_y: number }
type Detail = { graph: Dialogue, nodes: Node[], edges: any[] }
const campaign = useCampaignStore()
const campaignId = computed(() => campaign.activeCampaignIdNumber)
const nodeTypes = ['line', 'choice', 'condition', 'effect', 'note', 'end']
const nodeLegend = [
  { type: 'line', label: 'Action' }, { type: 'choice', label: 'Decision Node' }, { type: 'condition', label: 'Guard' },
  { type: 'effect', label: 'Action' }, { type: 'note', label: 'Note' }, { type: 'end', label: 'Activity Final' },
]
const nodeTypesMap = { dialogue: DialogueFlowNode }
const dialogues = ref<Dialogue[]>([])
const selectedId = ref<number | null>(null)
const detail = ref<Detail | null>(null)
const tab = ref('transcript')
const errors = ref<string[]>([])
const error = ref('')
const trace = ref<number[]>([])
const showDeleteDialog = ref(false)
const deleting = ref(false)
const linkData = ref<any>({ npcs: [], quests: [] })
const linkedNpcUids = ref<string[]>([])
const linkedQuestIds = ref<number[]>([])
const flowNodes = ref<any[]>([])
const flowEdges = computed(() => detail.value?.edges.map(edge => ({ id: String(edge.id), source: String(edge.source_node_id), target: String(edge.target_node_id), label: edge.label })) || [])
watch(detail, (value) => {
  flowNodes.value = value?.nodes.map((node, index) => ({
    id: String(node.id),
    type: 'dialogue',
    position: { x: node.position_x || 80 + (index % 3) * 220, y: node.position_y || 80 + Math.floor(index / 3) * 140 },
    data: { nodeType: node.node_type, content: node.content, lineId: node.line_id, participant: node.participant },
  })) || []
}, { immediate: true })

async function loadDialogues() { if (campaignId.value) dialogues.value = await $fetch<Dialogue[]>(`/api/campaigns/${campaignId.value}/dialogues`) }
async function loadDetail() { if (campaignId.value && selectedId.value) detail.value = await $fetch<Detail>(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}`) }
async function loadLinks() { if (campaignId.value && selectedId.value) { const result = await $fetch<any>(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/links`); linkData.value = result; linkedNpcUids.value = result.npc_uids; linkedQuestIds.value = result.quest_ids } }
async function selectDialogue(id: number) { selectedId.value = id; error.value = ''; await loadDetail() }
async function saveLinks() { if (campaignId.value && selectedId.value) await $fetch(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/links`, { method: 'PUT', body: { npc_uids: linkedNpcUids.value, quest_ids: linkedQuestIds.value } }) }
async function addDialogue() { if (!campaignId.value) return; const title = prompt('Dialogue title'); if (!title) return; const created = await $fetch<Dialogue>(`/api/campaigns/${campaignId.value}/dialogues`, { method: 'POST', body: { title } }); await loadDialogues(); await selectDialogue(created.id) }
function requestDelete() { if (detail.value) showDeleteDialog.value = true }
async function confirmDelete() { if (!campaignId.value || !selectedId.value) return; deleting.value = true; try { await $fetch(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}`, { method: 'DELETE' }); showDeleteDialog.value = false; selectedId.value = null; detail.value = null; await loadDialogues() } finally { deleting.value = false } }
async function addNode(node_type: string) { if (!campaignId.value || !selectedId.value) return; error.value = ''; try { const created = await $fetch<Node>(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/nodes`, { method: 'POST', body: { node_type } }); if (detail.value) detail.value = { ...detail.value, nodes: [...detail.value.nodes, created] }; await loadDetail() } catch (cause: any) { error.value = cause?.data?.message || cause?.message || 'Unable to add dialogue node' } }
function nodeName(id: number) { return detail.value?.nodes.find(node => node.id === id)?.content || `#${id}` }
async function saveNode(node: Node) { if (campaignId.value && selectedId.value) await $fetch(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/nodes/${node.id}`, { method: 'PATCH', body: node }) }
async function removeNode(node: Node) { if (campaignId.value && selectedId.value) { await $fetch(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/nodes/${node.id}`, { method: 'DELETE' }); await loadDetail() } }
async function connect(connection: any) { if (campaignId.value && selectedId.value && connection.source && connection.target) { await $fetch(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/edges`, { method: 'POST', body: { source_node_id: Number(connection.source), target_node_id: Number(connection.target) } }); await loadDetail() } }
async function position(event: any) { if (campaignId.value && selectedId.value && event.node) await saveNode({ ...event.node, id: Number(event.node.id), position_x: event.node.position.x, position_y: event.node.position.y }) }
async function removeEdge(id: number) { if (campaignId.value && selectedId.value) { await $fetch(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/edges/${id}`, { method: 'DELETE' }); await loadDetail() } }
async function validate() { if (campaignId.value && selectedId.value) errors.value = (await $fetch<{ errors: string[] }>(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/validate`)).errors }
async function simulate() { if (campaignId.value && selectedId.value && detail.value?.nodes.length) trace.value = (await $fetch<{ trace: number[] }>(`/api/campaigns/${campaignId.value}/dialogues/${selectedId.value}/simulate`, { method: 'POST', body: { start_node_id: detail.value.nodes[0].id, choices: [] } })).trace }
watch(campaignId, loadDialogues, { immediate: true })
watch(selectedId, loadLinks)
</script>

<style scoped>
.dialogue-canvas-panel { padding: 0; background: #15182b; }
.dialogue-node-legend { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, .1); background: rgba(37, 42, 70, .72); }
.dialogue-node-legend__item { display: inline-flex; gap: 5px; align-items: baseline; padding: 4px 8px; border: 1px solid rgba(255, 255, 255, .12); border-radius: 999px; color: #b4bbda; font-size: 11px; }
.dialogue-node-legend__item b { color: #f4f5ff; }
:deep(.vue-flow) { background-color: #15182b; background-image: radial-gradient(circle, rgba(139, 147, 255, .3) 1px, transparent 1px), radial-gradient(circle at 20% 10%, rgba(93, 103, 190, .18), transparent 42%); background-size: 24px 24px, auto; }
:deep(.vue-flow__edge-path) { stroke: #aeb5ff; stroke-width: 2; }
</style>
