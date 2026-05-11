// Directional-blur adapter for astigmatism. Reuses Phaser.Filters.Blur but
// drives x and y independently from the axis angle so the blur kernel
// elongates along one direction. dev-docs/04-shaders-reference.md
// §Astigmatism describes a custom directional Gaussian; Filters.Blur with
// asymmetric x/y is functionally equivalent and avoids a second shader.
//
// Geometry refresher (medical convention, counterclockwise from east):
//   axis =   0° → cylinder is horizontal → blur kernel runs VERTICALLY
//                 (so horizontal lines blur, vertical lines stay sharp).
//   axis =  90° → cylinder is vertical   → blur kernel runs HORIZONTALLY
//                 (so vertical lines blur, horizontal lines stay sharp).
//   axis =  45° → diagonal kernel.
//
// Mapping: x = sin(axis_rad), y = cos(axis_rad). At 0° this yields x=0,
// y=1 (vertical-only blur); at 90° x=1, y=0 (horizontal-only blur).
// Multiplied by magnitude and a tuned MAX offset.

import type Phaser from 'phaser';

const MAX_ASTIG_OFFSET = 8;
const ACTIVE_THRESHOLD = 0.005;

interface AstigParams {
  leftActive: boolean;
  leftMagnitude: number;
  leftAxis: number;
  rightActive: boolean;
  rightMagnitude: number;
  rightAxis: number;
}

let filter: Phaser.Filters.Blur | null = null;

function pickAxis(p: AstigParams): number {
  // When both eyes are enabled, use the higher-magnitude side's axis. With
  // matching magnitudes left wins (arbitrary but stable). When only one
  // side is enabled, use that side's axis. Phase 7 will pick per viewMode.
  if (p.leftActive && p.rightActive) {
    return p.leftMagnitude >= p.rightMagnitude ? p.leftAxis : p.rightAxis;
  }
  return p.leftActive ? p.leftAxis : p.rightAxis;
}

export function syncAstigmatism(
  camera: Phaser.Cameras.Scene2D.Camera,
  params: AstigParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  // Average magnitudes for Phase 6's blend-both-eyes view; Phase 7 splits.
  const blendedMagnitude = (params.leftMagnitude + params.rightMagnitude) / 2;

  if (anyActive && blendedMagnitude > ACTIVE_THRESHOLD) {
    if (filter === null) {
      filter = camera.filters.internal.addBlur(0, 0, 0, 1, 0xffffff, 4);
    }
    const axisRad = (pickAxis(params) * Math.PI) / 180;
    const scale = blendedMagnitude * MAX_ASTIG_OFFSET;
    // x/y are absolute pixel offsets per step; never negative.
    filter.x = Math.abs(Math.sin(axisRad)) * scale;
    filter.y = Math.abs(Math.cos(axisRad)) * scale;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
}

export function disposeAstigmatism(camera: Phaser.Cameras.Scene2D.Camera): void {
  if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
}
