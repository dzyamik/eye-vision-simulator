# 10 — Initial Prompt

This is the prompt to paste into Claude Code when you start the project. Everything else flows from here.

## The prompt

> You're working on the **Eye Vision Simulator** project. This is a fresh repo and nothing is built yet.
>
> Start by reading `CLAUDE.md` in the project root — it tells you how this project is organized and how I want you to work. Then read `dev-docs/00-overview.md` and `dev-docs/07-roadmap.md`.
>
> Once you've read those, do this:
>
> 1. Briefly confirm back to me, in 5–10 lines, what the project is and which roadmap step you're about to start. Don't summarize the entire spec — just enough that I can see we're aligned.
> 2. Then start **Phase 1, step 1.1** ("Initialize the project") from the roadmap.
> 3. Stop after completing 1.1 and its acceptance criteria. Show me what's on disk, run `npm run dev` if it makes sense, and wait for me to say "next" before continuing.
>
> Rules:
> - Don't skip ahead in the roadmap. One step at a time, with my "next" between each.
> - If a step is ambiguous, ask before guessing.
> - Follow `dev-docs/08-coding-standards.md` from the first file you touch.
> - Don't add dependencies that aren't in `dev-docs/02-tech-stack.md` without asking first.
>
> Go.

## Variants

If you'd rather have Claude Code go further before pausing, replace step 3 with:

> Then start **Phase 1** of the roadmap and complete all of phase 1 (steps 1.1 through 1.5). Stop at the end of phase 1, show me a summary, and wait for me to say "next" before starting phase 2.

For maximum autonomy (use cautiously — you'll want to review at the end):

> Then work through **Phases 1 and 2** end to end. Pause at the end of phase 2 and summarize. After that, I want to review before continuing to phase 3.

## Mid-project prompts

Once you're a few sessions in, you can use `/next-step` (defined in `.claude/commands/next-step.md`) to continue from wherever the last session left off. The same effect with prose:

> Pick up where we left off. Look at `dev-docs/07-roadmap.md`, find the first unchecked step, and do it. Pause at the end of the step.

## When something goes wrong

> Something looks off. The [describe what]. Before fixing anything, read `dev-docs/01-architecture.md` section "Data flow walkthrough" again, then explain in 3–5 sentences what you think is happening. Don't change code until I've agreed with your diagnosis.

## Adding a new condition mid-project

> I want to add a new eye condition: [name]. Use the `eye-condition` skill (under `.claude/skills/eye-condition/`). Walk me through the 6-step checklist; pause for my input on the parameter ranges before writing any code.

## After a long pause

> It's been a while. Re-read `CLAUDE.md` and the last 2 commits to get oriented. Then check `dev-docs/07-roadmap.md` for the current state and tell me what's done and what's next, in a few lines. Don't start coding until I confirm.
