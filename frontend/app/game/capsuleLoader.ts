// capsuleLoader.ts
// Merges two static data files into the formats needed by Swift and JS:
//
//   positions.json     — from capture tool. Has { id, position: [x,y,z] }
//   capsuleContent.json — authored separately. Has { id, name, funFact, keyFragment, color, ... }
//
// Returns:
//   forSwift  — [{id, position, color}] sent to ARWorldMapModule.placeCapsules()
//               (Swift only needs position + color to render spheres)
//   forState  — full content objects sorted by sequence, used by JS game UI
//               (shows name, fun fact, key fragment when player taps a capsule)
//
// IDs must match between the two files. If a position has no matching content,
// it falls back to gold (#FFD700) color.

import positions from '../../data/positions.json';
import content from '../../data/capsuleContent.json';

export interface CapsuleForSwift {
  id: string;
  position: number[];
  color: string;
}

export interface CapsuleContent {
  id: string;
  name: string;
  funFact: string;
  keyFragment: string;
  sequence: number;
  color: string;
}

export function loadCapsules() {
  const contentMap = new Map(content.map(c => [c.id, c]));

  const forSwift: CapsuleForSwift[] = positions.map(p => {
    const c = contentMap.get(p.id);
    return {
      id: p.id,
      position: p.position,
      // CONFIGURABLE: Fallback color when a position has no matching content entry.
      // '#FFD700' is gold. Should match the fallback in ARWorldMapView.swift.
      color: c?.color ?? '#FFD700',
    };
  });

  const forState: CapsuleContent[] = [...content].sort(
    (a, b) => a.sequence - b.sequence,
  );

  return { forSwift, forState };
}
