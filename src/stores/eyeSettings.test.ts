// Targets the actions that are easy to silently break later: per-eye reset,
// reset-all, copy (deep-clone semantics), and the anyEnabled computed.
//
// Note: linked-mode propagation is intentionally not tested here. The
// per-spec design (dev-docs/06-state-management.md §Reactivity rules) keeps
// the propagation logic in a future `useEyeParam` composable, not in this
// store. Tests for that composable land alongside its implementation in
// Phase 5. The test below only confirms the `linked` flag itself is
// reactive and toggleable.

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useEyeSettingsStore } from './eyeSettings';

describe('useEyeSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('resetEye', () => {
    it('resets only the requested eye and leaves the other untouched', () => {
      const store = useEyeSettingsStore();
      store.left.myopia.enabled = true;
      store.left.myopia.strength = 0.5;
      store.right.myopia.enabled = true;
      store.right.myopia.strength = 0.7;

      store.resetEye('left');

      expect(store.left.myopia.enabled).toBe(false);
      expect(store.left.myopia.strength).toBe(0);
      expect(store.right.myopia.enabled).toBe(true);
      expect(store.right.myopia.strength).toBe(0.7);
    });

    it('works symmetrically for the right eye', () => {
      const store = useEyeSettingsStore();
      store.left.cataract.enabled = true;
      store.right.cataract.enabled = true;
      store.right.cataract.cloudiness = 0.4;

      store.resetEye('right');

      expect(store.right.cataract.enabled).toBe(false);
      expect(store.right.cataract.cloudiness).toBe(0);
      expect(store.left.cataract.enabled).toBe(true);
    });
  });

  describe('resetAll', () => {
    it('resets both eyes to defaults', () => {
      const store = useEyeSettingsStore();
      store.left.glaucoma.enabled = true;
      store.right.amd.enabled = true;
      store.right.amd.scotomaRadius = 0.3;

      store.resetAll();

      expect(store.left.glaucoma.enabled).toBe(false);
      expect(store.right.amd.enabled).toBe(false);
      expect(store.right.amd.scotomaRadius).toBe(0);
    });
  });

  describe('copy', () => {
    it('makes the destination structurally equal to the source', () => {
      const store = useEyeSettingsStore();
      store.left.cataract.enabled = true;
      store.left.cataract.cloudiness = 0.4;
      store.left.colorVision.enabled = true;
      store.left.colorVision.type = 'deuteranopia';

      store.copy('left', 'right');

      expect(store.right.cataract.enabled).toBe(true);
      expect(store.right.cataract.cloudiness).toBe(0.4);
      expect(store.right.colorVision.type).toBe('deuteranopia');
    });

    it('does not share nested object references between source and destination', () => {
      const store = useEyeSettingsStore();
      store.left.cataract.cloudiness = 0.4;

      store.copy('left', 'right');
      store.right.cataract.cloudiness = 0.9;

      expect(store.left.cataract.cloudiness).toBe(0.4);
    });

    it('is a no-op when from === to', () => {
      const store = useEyeSettingsStore();
      store.left.myopia.strength = 0.6;

      store.copy('left', 'left');

      expect(store.left.myopia.strength).toBe(0.6);
    });
  });

  describe('anyEnabled', () => {
    it('returns false on a fresh store for both eyes', () => {
      const store = useEyeSettingsStore();
      expect(store.anyEnabled('left')).toBe(false);
      expect(store.anyEnabled('right')).toBe(false);
    });

    it('returns true once any single condition is enabled', () => {
      const store = useEyeSettingsStore();
      store.left.floaters.enabled = true;
      expect(store.anyEnabled('left')).toBe(true);
      expect(store.anyEnabled('right')).toBe(false);
    });
  });

  describe('linked', () => {
    it('defaults to false and is toggleable', () => {
      const store = useEyeSettingsStore();
      expect(store.linked).toBe(false);
      store.linked = true;
      expect(store.linked).toBe(true);
    });
  });
});
