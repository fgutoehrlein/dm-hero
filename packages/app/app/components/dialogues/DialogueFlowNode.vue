<template>
  <div class="dialogue-node" :class="`dialogue-node--${nodeType}`">
    <Handle type="target" :position="Position.Left" class="dialogue-handle" />
    <div class="dialogue-node__topline">
      <span class="dialogue-node__icon">{{ icon }}</span>
      <span class="dialogue-node__type">{{ nodeLabel }}</span>
      <span class="dialogue-node__id">{{ data.lineId || `#${id}` }}</span>
    </div>
    <div class="dialogue-node__content">{{ data.content || nodeLabel }}</div>
    <div v-if="data.participant" class="dialogue-node__participant">{{ data.participant }}</div>
    <Handle type="source" :position="Position.Right" class="dialogue-handle" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()
const data = props.data as { nodeType?: string, content?: string, lineId?: string, participant?: string }
const id = props.id
const nodeType = data.nodeType || 'note'
const labels: Record<string, string> = { line: 'Action', choice: 'Decision Node', condition: 'Guard', effect: 'Action', note: 'Note', end: 'Activity Final' }
const icons: Record<string, string> = { line: '↗', choice: '◇', condition: '⛨', effect: '✦', note: '▤', end: '●' }
const nodeLabel = labels[nodeType] || 'Note'
const icon = icons[nodeType] || '•'
</script>

<style scoped>
.dialogue-node { position: relative; min-width: 230px; max-width: 300px; overflow: visible; border: 1px solid rgba(255,255,255,.14); border-left: 4px solid #8b93ff; border-radius: 14px; background: linear-gradient(145deg, rgba(37,42,70,.98), rgba(22,25,43,.98)); box-shadow: 0 12px 28px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.08); color: #f4f5ff; transition: transform .15s ease, box-shadow .15s ease; }
.dialogue-node:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(0,0,0,.38), 0 0 0 1px rgba(139,147,255,.45); }
.dialogue-node__topline { display: flex; align-items: center; gap: 7px; padding: 10px 12px 7px; border-bottom: 1px solid rgba(255,255,255,.1); }
.dialogue-node__icon { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; background: rgba(255,255,255,.1); font-size: 14px; }
.dialogue-node__type { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #cdd1ff; }
.dialogue-node__id { margin-left: auto; color: rgba(255,255,255,.42); font: 10px ui-monospace, monospace; }
.dialogue-node__content { padding: 13px 14px 8px; white-space: pre-wrap; line-height: 1.4; font-size: 14px; }
.dialogue-node__participant { padding: 0 14px 12px; color: #aeb5d8; font-size: 11px; }
.dialogue-handle { width: 10px; height: 10px; border: 2px solid #20243e; background: #aeb5ff; }
.dialogue-node--choice { border-left-color: #f0b45f; }
.dialogue-node--condition { border-left-color: #d27cff; }
.dialogue-node--effect { border-left-color: #57d6b0; }
.dialogue-node--note { border-left-color: #70a7ff; }
.dialogue-node--end { border-left-color: #ff7187; background: linear-gradient(145deg, rgba(71,34,57,.98), rgba(36,24,44,.98)); }
.dialogue-node--end .dialogue-node__content { font-weight: 700; }
</style>
