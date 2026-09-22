import { describe, expect, it } from 'vitest'
import { getTestDb } from '../utils/test-db'
import { simulateDialogue, validateDialogue } from '../../server/utils/narrative-validation'
import { deleteCampaignRecord, replaceNarrativeLinks } from '../../server/utils/narrative'

describe('narrative foundations migration', () => {
  it('gives existing entities stable UIDs and relation metadata defaults', () => {
    const db = getTestDb()
    const entity = db.prepare('SELECT uid FROM entities LIMIT 1').get() as { uid: string }
    const relationColumns = db.prepare('PRAGMA table_info(entity_relations)').all() as Array<{ name: string }>

    expect(entity.uid).toMatch(/^ent_[0-9a-f]{32}$/)
    expect(relationColumns.map(column => column.name)).toEqual(expect.arrayContaining([
      'direction', 'label', 'valid_from', 'valid_to', 'metadata',
    ]))
  })

  it('stores campaign-scoped manuscript sections and beats independently from entity metadata', () => {
    const db = getTestDb()
    const campaign = db.prepare('INSERT INTO campaigns (name) VALUES (?)').run('Narrative campaign')
    const campaignId = Number(campaign.lastInsertRowid)
    const manuscript = db.prepare('SELECT id FROM manuscripts WHERE campaign_id = ?').get(campaignId) as { id: number }
    const section = db.prepare(`
      INSERT INTO manuscript_sections (manuscript_id, parent_section_id, title, section_type, sort_order, content)
      VALUES (?, NULL, ?, ?, ?, ?)
    `).run(manuscript.id, 'Opening scene', 'scene', 0, '# Dawn')
    db.prepare('INSERT INTO story_beats (campaign_id, manuscript_section_id, title, sort_order) VALUES (?, ?, ?, ?)')
      .run(campaignId, section.lastInsertRowid, 'The call arrives', 0)

    const saved = db.prepare(`
      SELECT s.content, b.title AS beat_title
      FROM manuscript_sections s JOIN story_beats b ON b.manuscript_section_id = s.id
    `).get() as { content: string, beat_title: string }
    expect(saved).toEqual({ content: '# Dawn', beat_title: 'The call arrives' })
  })

  it('gives each campaign one manuscript plus quest and dialogue libraries', () => {
    const db = getTestDb()
    const campaign = db.prepare('INSERT INTO campaigns (name) VALUES (?)').run('Authoring campaign')
    const campaignId = Number(campaign.lastInsertRowid)
    const manuscript = db.prepare('SELECT id FROM manuscripts WHERE campaign_id = ?').get(campaignId)
    const quest = db.prepare('INSERT INTO quests (campaign_id, title) VALUES (?, ?)').run(campaignId, 'Find the key')
    const dialogue = db.prepare('INSERT INTO dialogue_graphs (campaign_id, title) VALUES (?, ?)').run(campaignId, 'Gatekeeper')
    db.prepare('INSERT INTO dialogue_nodes (graph_id, node_type, line_id, content, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(dialogue.lastInsertRowid, 'line', 'gatekeeper-001', 'State your business.', 0)

    expect(manuscript).toBeDefined()
    expect(Number(quest.lastInsertRowid)).toBeGreaterThan(0)
    expect(db.prepare('SELECT COUNT(*) AS count FROM dialogue_nodes WHERE graph_id = ?').get(dialogue.lastInsertRowid))
      .toEqual({ count: 1 })
  })

  it('keeps manuscript section order within its manuscript', () => {
    const db = getTestDb()
    const campaignId = Number(db.prepare('INSERT INTO campaigns (name) VALUES (?)').run('Ordered story').lastInsertRowid)
    const manuscript = db.prepare('SELECT id FROM manuscripts WHERE campaign_id = ?').get(campaignId) as { id: number }
    db.prepare('INSERT INTO manuscript_sections (manuscript_id, title, section_type, sort_order) VALUES (?, ?, ?, ?)').run(manuscript.id, 'Second', 'scene', 1)
    db.prepare('INSERT INTO manuscript_sections (manuscript_id, title, section_type, sort_order) VALUES (?, ?, ?, ?)').run(manuscript.id, 'First', 'scene', 0)
    const titles = db.prepare('SELECT title FROM manuscript_sections WHERE manuscript_id = ? ORDER BY sort_order').all(manuscript.id)
    expect(titles).toEqual([{ title: 'First' }, { title: 'Second' }])
  })

  it('validates safe dialogue ASTs and returns a deterministic state trace', () => {
    const variables = new Set(['gateOpen'])
    expect(validateDialogue([{ id: 1, node_type: 'line', condition_ast: '{"all":[]}' }, { id: 2, node_type: 'end', condition_ast: '{"all":[]}' }], [{ source_node_id: 1, target_node_id: 2, condition_ast: '{"all":[]}', effect_ast: '[{"variable":"gateOpen","value":true}]' }], variables)).toEqual([])
    expect(simulateDialogue(1, [{ source_node_id: 1, target_node_id: 2, condition_ast: '{"all":[]}', effect_ast: '[{"variable":"gateOpen","value":true}]' }], [0])).toEqual({ trace: [1, 2], state: { gateOpen: true } })
  })

  it('deletes only campaign-owned quests and dialogues with their children', () => {
    const db = getTestDb()
    const campaignA = Number(db.prepare('INSERT INTO campaigns (name) VALUES (?)').run('Delete A').lastInsertRowid)
    const campaignB = Number(db.prepare('INSERT INTO campaigns (name) VALUES (?)').run('Delete B').lastInsertRowid)
    const quest = Number(db.prepare('INSERT INTO quests (campaign_id, title) VALUES (?, ?)').run(campaignA, 'Quest A').lastInsertRowid)
    db.prepare('INSERT INTO quest_objectives (quest_id, title, sort_order) VALUES (?, ?, 0)').run(quest, 'Objective A')
    const dialogue = Number(db.prepare('INSERT INTO dialogue_graphs (campaign_id, title) VALUES (?, ?)').run(campaignA, 'Dialogue A').lastInsertRowid)
    db.prepare('INSERT INTO dialogue_nodes (graph_id, node_type, line_id, content, sort_order) VALUES (?, ?, ?, ?, 0)').run(dialogue, 'line', 'a-1', 'Hello')
    const otherQuest = Number(db.prepare('INSERT INTO quests (campaign_id, title) VALUES (?, ?)').run(campaignB, 'Quest B').lastInsertRowid)

    expect(deleteCampaignRecord(db, 'quests', quest, campaignA)).toBe(true)
    expect(deleteCampaignRecord(db, 'dialogue_graphs', dialogue, campaignA)).toBe(true)
    expect(db.prepare('SELECT COUNT(*) AS count FROM quest_objectives WHERE quest_id = ?').get(quest)).toEqual({ count: 0 })
    expect(db.prepare('SELECT COUNT(*) AS count FROM dialogue_nodes WHERE graph_id = ?').get(dialogue)).toEqual({ count: 0 })
    expect(db.prepare('SELECT COUNT(*) AS count FROM quests WHERE id = ?').get(otherQuest)).toEqual({ count: 1 })
    expect(deleteCampaignRecord(db, 'quests', otherQuest, campaignA)).toBe(false)
  })

  it('replaces narrative links for one source without touching another source', () => {
    const db = getTestDb()
    const campaignId = Number(db.prepare('INSERT INTO campaigns (name) VALUES (?)').run('Links').lastInsertRowid)
    replaceNarrativeLinks(db, campaignId, 'quest', 11, ['ent_npc', 'dialogue:3'])
    replaceNarrativeLinks(db, campaignId, 'quest', 11, ['ent_npc', 'dialogue:4'])
    replaceNarrativeLinks(db, campaignId, 'dialogue_graph', 3, ['ent_npc'])
    expect(db.prepare('SELECT source_type, source_id, target_uid FROM narrative_links WHERE campaign_id = ? ORDER BY source_type, source_id, target_uid').all(campaignId)).toEqual([
      { source_type: 'dialogue_graph', source_id: 3, target_uid: 'ent_npc' },
      { source_type: 'quest', source_id: 11, target_uid: 'dialogue:4' },
      { source_type: 'quest', source_id: 11, target_uid: 'ent_npc' },
    ])
  })
})
