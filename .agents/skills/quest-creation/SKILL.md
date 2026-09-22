---
name: quest-creation
description: Use when designing, creating, or revising a DM Hero quest, its objectives, transitions, dependencies, outcomes, or recovery paths.
---

# Quest Creation

Use `dm-hero-authoring` for campaign resolution, proposals, approval, writes, and canon safety.

Produce a structured package containing title, premise, lifecycle/canon state, ordered objectives, safe condition/effect AST transitions, dependencies, outcomes, recovery notes, and explicit NPC/Faction/Location/Lore/Dialogue links.

1. Read campaign context, variables, related records, and similar quests.
2. Draft the player goal, stakes, objective order, branches, consequences, and recovery path.
3. Propose every quest record and relationship before writing.
4. After approval, persist the package with quest and link tools.
5. Validate broken links, undefined variables, invalid transitions, unreachable objectives, and dead ends.

Each objective must change knowledge, state, access, risk, or allegiance. Failure needs a consequence or declared campaign strand. Conditions/effects reference only declared typed variables. Referenced dialogue must exist or be listed as a separate proposal.

Report the quest ID, objective/transition counts, linked records, validation results, and approved material still marked proposed.
