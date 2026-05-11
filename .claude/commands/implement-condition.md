---
description: Add a new eye condition end-to-end (types, store, shader, pipeline, UI) using the eye-condition skill.
---

You are adding a new eye condition to the Eye Vision Simulator.

**Step 1 — Clarify before coding.** If the user has not already specified all of the following, ask in one consolidated message:

1. **Name** of the condition (kebab-case id + human-readable label)
2. **Group** in the sidebar (`refractive` / `colorVision` / `media` / `field` / `other`)
3. **Parameters** the user should be able to control, with ranges and default values
4. **Visual approach** — is this best done as a color matrix, blur, vignette, distortion, overlay, or sprite layer? Reference `dev-docs/04-shaders-reference.md` for examples.
5. **Stacking position** — where in the pipeline order does it belong? (See `dev-docs/01-architecture.md` § "Pipeline order".)
6. **Per-eye or shared?** Most conditions are per-eye. Confirm.

Do not proceed until these are settled.

**Step 2 — Invoke the `eye-condition` skill** at `.claude/skills/eye-condition/SKILL.md` and follow its 6-step workflow exactly:

1. Extend `src/types/eyeSettings.ts` with the new parameters
2. Extend `src/constants/defaults.ts` with default values
3. Add a sidebar panel component under `src/components/sidebar/conditions/`
4. Write the fragment shader at `src/phaser/shaders/<condition>.frag.glsl`
5. Write the pipeline class at `src/phaser/pipelines/<Condition>Pipeline.ts`
6. Wire it into `src/phaser/PipelineManager.ts` in the correct stacking position

**Step 3 — Verify.**
- `npm run typecheck` passes
- `npm run build` succeeds
- Manually walk through: load the sample image, toggle the new condition on, move each parameter slider, confirm visual response is real-time (<16 ms frame) and per-eye if applicable.

**Step 4 — Document.**
- Add an entry to `dev-docs/03-eye-conditions.md` with parameters, ranges, defaults, and a one-sentence "what this represents" note.
- If the implementation deviated from a reference, note it under a "Notes" subsection.
- If this condition was not in the original roadmap, append a checked-off line to `dev-docs/07-roadmap.md` under a "Post-roadmap additions" section (create the section if it doesn't exist).

**Step 5 — Stop and report.** Summarize: condition added, files touched, any defaults you chose on the user's behalf, and any visual quirks you noticed.

## Hard rules

- **No medical claims.** This is an educational simulation. Avoid wording like "this is what people with X see" — prefer "a simplified visual approximation of X".
- **Respect existing pipeline order.** If you think the order should change, raise it as a question — don't reshuffle silently.
- **One condition per invocation.** If the user lists three, do the first and stop.
