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
  const contentMap = new Map(content.map((c) => [c.id, c]));

  const forSwift: CapsuleForSwift[] = positions
    .map((p) => {
      const c = contentMap.get(p.id);
      return {
        id: p.id,
        position: p.position,
        color: c?.color ?? '#FFD700',
      };
    });

  const forState: CapsuleContent[] = content.sort(
    (a, b) => a.sequence - b.sequence
  );

  return { forSwift, forState };
}
