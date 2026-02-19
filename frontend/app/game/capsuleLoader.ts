import positions from '../../data/positions.json';

export interface CapsuleForSwift {
  id: string;
  position: number[];
  color: string;
}

export function loadCapsules() {
  const forSwift: CapsuleForSwift[] = positions.map(p => ({
    id: p.id,
    position: p.position,
    color: '#FFD700',
  }));

  return { forSwift };
}
