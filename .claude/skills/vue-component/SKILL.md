---
name: vue-component
description: Use this skill when creating or refactoring a Vue 3 component in this project, including new components in src/components/, splitting a component that's grown too large, or wiring a component to a Pinia store. Triggers on anything touching .vue files, anything mentioning "component", "props", "v-model", "computed", "<script setup>", or any reference to the sidebar / viewer / panel UI.
---

# Vue Component Development

This skill enforces the Vue conventions used in this project. Components here are intentionally simple: dumb-ish presentation glued to Pinia stores. Logic lives in stores and composables.

## Before you create a component

1. Check whether the component should exist at all. Is there an existing component that should grow a bit? Is this view-local state that should be a local `ref`, or shared state that should be in Pinia?
2. Read `dev-docs/05-ui-ux-design.md` for the visual spec.
3. Read `dev-docs/06-state-management.md` for the store shape you'll bind to.
4. Skim `dev-docs/08-coding-standards.md` § "Vue" and § "CSS".

## Component template

This is the canonical structure for a component in this project. Every new component starts from this.

```vue
<script setup lang="ts">
import { computed } from 'vue';

// External imports
// Internal imports (alphabetical)
import { useEyeSettingsStore } from '@/stores/eyeSettings';
import RangeInput from '@/components/sidebar/RangeInput.vue';
import type {} from /* ... */ '@/types/eyeSettings';

const props = defineProps<{
  /* typed props */
}>();

const emit = defineEmits<{
  /* typed events */
}>();

const store = useEyeSettingsStore();

// Computed bindings (writable v-models that point at the store)
const value = computed<number>({
  get: () => store.left.myopia.strength,
  set: (v) => {
    store.left.myopia.strength = v;
  },
});
</script>

<template>
  <div class="component-name">
    <!-- markup -->
  </div>
</template>

<style scoped>
.component-name {
  /* Use only var(...) from tokens.css; no hard-coded colors or spacing */
  background: var(--bg-2);
  padding: var(--pad);
  border-radius: var(--radius);
}
</style>
```

## The rules

### Script

- **Only `<script setup lang="ts">`.** No Options API. No `defineComponent` wrappers.
- **Typed `defineProps` / `defineEmits`.** Always use the generic form: `defineProps<{ ... }>()`. Never the runtime object form.
- **`const` everything.** Reassigning a variable is a code smell here; use `ref().value =` for reactivity.
- **Don't import Phaser** in components. Phaser is the impaired view's concern only, encapsulated in `usePhaser`.
- **No business logic in components.** If your script has more than ~30 lines, you probably want a composable.

### Template

- **One root element.** Vue 3 allows multiple, but a single root with a clear class is easier to style and debug.
- **`v-model` for two-way bindings.** Don't roll your own `:value + @input`.
- **Conditionals stay simple.** `v-if="condition"`, not `v-if="someExpression && otherExpression || maybeThird"`. Compute first.
- **`v-for` with `:key`.** Always. The key should be stable across renders.
- **No inline styles** for anything that has a design token. Inline `style` is fine for truly dynamic values (e.g. a calculated position).

### Style

- **`<style scoped>`** always.
- **Only design tokens** from `src/styles/tokens.css`. No hard-coded `#abcdef` or `12px`. If you need a value the tokens don't cover, add it to the tokens file first.
- **Mobile-first** media queries: `@media (min-width: 900px)`, not `max-width`.
- **No `!important`** unless overriding a third-party global, in which case leave a comment why.

## Common patterns

### Per-eye binding

The store has `left` and `right`. Components that edit one eye take an `eye` prop:

```ts
const props = defineProps<{ eye: 'left' | 'right' }>();
const settings = computed(() => store[props.eye]);

const strength = computed<number>({
  get: () => settings.value.myopia.strength,
  set: (v) => {
    settings.value.myopia.strength = v;
  },
});
```

### Linked mode (Both)

When `useEyeSettingsStore.linked` is true, edits should apply to both eyes. Wrap the setter:

```ts
const set = (mutator: (eye: EyeSettings) => void) => {
  mutator(store.left);
  if (store.linked) mutator(store.right);
};

const strength = computed<number>({
  get: () => store.left.myopia.strength,
  set: (v) =>
    set((eye) => {
      eye.myopia.strength = v;
    }),
});
```

In practice, factor this into a composable `useEyeParam(condition, key)` to avoid repetition.

### Slot-based composition

Use slots for layout components (`<ConditionPanel>`, `<ConditionGroup>`) that wrap arbitrary content. Don't pass an array of "condition specs" as a prop and render them with `v-for` — explicit JSX-ish composition is easier to read here.

```vue
<!-- good -->
<ConditionGroup title="Refractive errors">
  <MyopiaPanel :eye="eye" />
  <HyperopiaPanel :eye="eye" />
  <AstigmatismPanel :eye="eye" />
</ConditionGroup>

<!-- bad -->
<ConditionGroup title="Refractive errors" :conditions="refractiveConditions" />
```

### Watching a store from a component

Avoid it. If you find yourself writing `watch()` inside a component, the logic probably belongs in a composable or the pipeline manager. Components should declare data flow, not orchestrate it.

The one legitimate case: triggering a UI effect (focus, scroll) based on store state.

## When to split a component

Split when **any** of these are true:

- The template exceeds ~80 lines.
- The script exceeds ~50 lines.
- The component has more than one "concept" (e.g. layout + a complex form + a popover).
- A piece of the template is reusable elsewhere.

Splitting always wins — small components compose well.

## Accessibility checklist

For every interactive component:

- Reachable by keyboard (Tab focus order makes sense).
- `aria-label` on icon-only buttons.
- Toggle states use `aria-pressed`; expanded/collapsed regions use `aria-expanded`.
- Color contrast meets AA on the dark theme.
- Respects `prefers-reduced-motion` for animations.

## Anti-patterns to avoid

- ❌ Component does `fetch()` directly. Move into a composable, then call from the component.
- ❌ Component imports a Pinia store **and** mutates fields from a child component's emit. Pick one ownership.
- ❌ A component prop named `data` that's actually used for three different things. Name props after their use, not their shape.
- ❌ `defineExpose({...})` to share state up. That's a sign Pinia should own it.
- ❌ Template logic that mutates store state inside a v-if (e.g., `v-if="store.set(...)"`).

## After you write the component

1. Check it renders in isolation (no console errors).
2. Check it interacts with the store correctly — drag a slider, see Pinia update in DevTools.
3. If it's user-facing, eyeball it against the layout spec in `dev-docs/05-ui-ux-design.md`.
4. Tick the relevant roadmap step in `dev-docs/07-roadmap.md`.
