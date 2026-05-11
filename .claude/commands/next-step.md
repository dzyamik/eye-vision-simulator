---
description: Find the first unchecked step in the roadmap and execute it per the project workflow.
---

You are continuing implementation of the Eye Vision Simulator. Follow this exact sequence:

1. **Read `CLAUDE.md`** at the project root if you have not already in this session. Re-read it if anything is unclear about the workflow.

2. **Open `dev-docs/07-roadmap.md`** and find the **first unchecked checkbox** (`- [ ]`). That is your task.

3. **Read every doc referenced by that step**. At minimum scan:
   - `dev-docs/01-architecture.md` for module boundaries
   - `dev-docs/08-coding-standards.md` for conventions
   - The specific doc the step points to (e.g. `04-shaders-reference.md` for shader steps, `06-state-management.md` for store steps, `05-ui-ux-design.md` for UI steps)

4. **Check for a matching skill** in `.claude/skills/`:
   - Shader/GLSL work → invoke the `shader-development` skill
   - New Vue component → invoke the `vue-component` skill
   - Adding a new eye condition end-to-end → invoke the `eye-condition` skill

5. **State the plan in one short paragraph** (3–6 sentences). What files you will create or modify, and why. Do not write code yet.

6. **Implement the step**. Stay strictly within its acceptance criteria — do not pull work forward from later steps.

7. **Verify**:
   - Run `npm run typecheck` and fix any errors
   - Run `npm run build` and confirm it succeeds with output in `docs/`
   - If the step has a visual outcome, briefly describe what the user should see when they run `npm run dev`

8. **Mark the checkbox done** in `dev-docs/07-roadmap.md` by changing `- [ ]` to `- [x]`.

9. **Stop and report**. Output a short summary: what was done, any decisions you made that deviated from the doc (with justification), and what the next unchecked step is. **Do not start the next step.** Wait for the user to invoke `/next-step` again.

## Hard rules

- **One step at a time.** Even if a step is small, finish it and stop.
- **No new dependencies** without the user explicitly approving in this conversation.
- **No invented features.** If the roadmap doesn't ask for it, don't build it.
- **If a step is ambiguous**, ask one clarifying question instead of guessing.
- **If a step is blocked** by a missing prerequisite, say so clearly and propose what to do — don't silently skip ahead.
