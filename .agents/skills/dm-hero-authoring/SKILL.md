---
name: dm-hero-authoring
description: Use when working with campaign content, canon, narrative records, or world entities in DM Hero.
---

# DM Hero Authoring

Treat DM Hero as the campaign source of truth. Read freely; make every mutation reviewable and explicitly approved.

1. Call `list_campaigns` and resolve the campaign. Never guess a campaign ID.
2. Read bounded campaign context and search existing entities before proposing content.
3. Separate established canon from assumptions and proposed additions.
4. Present records, relationships, canon impact, and open assumptions.
5. Wait for explicit approval covering those writes.
6. Write through DM Hero MCP/API confirmation payloads; never edit SQLite directly or execute arbitrary expressions.
7. Validate and report IDs/UIDs, links, warnings, and unresolved items.

Prefer stable UIDs for links, retain numeric IDs where required, reuse existing records, and create explicit relations. Use structured condition/effect ASTs only.

| Need | Tools |
|---|---|
| Resolve/context | `list_campaigns`, `get_campaign_context`, `search_entities`, `get_entity` |
| Entities | `get_contract`, `preview_import`, approved `import_entities`, `preview_update`, approved `update_entities` |
| Quests | `list_quests`, `get_quest`, `preview_quest`, approved `create_quest`, `validate_quest` |
| Manuscript | `get_manuscript`, `preview_manuscript_change`, approved section tools |
| Dialogues | list/get, approved create/update, validate, simulate |
| Links | `link_narrative_records` |

Proposal format:

```markdown
Campaign: <resolved campaign>
Established canon: <facts used>
Proposed changes: <records and fields>
Relationships: <source -> type -> target>
Open assumptions: <new or uncertain material>
Validation: <checks after approval>
```

Confirm that writes match the proposal, links stay in the campaign, validation ran, and proposed material remains visibly non-canon until accepted.
