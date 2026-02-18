# React Native ↔ Swift Bridge

## Object Lifecycle

### Phase A — Admin Setup (Swift/ARKit)

Admin walks the room, taps surfaces to place capsules. Each tap:

1. Swift does a raycast (hit test against detected planes)
2. Gets a 3D world coordinate `[2.1, 0.5, -3.4]`
3. Creates an `ARAnchor` at that position
4. Renders a placeholder sphere so admin sees where they placed it
5. Generates an ID
6. Sends `{ id: "asd124b", position: [2.1, 0.5, -3.4] }` across bridge to RN

RN collects these into the **Object Positions JSON** — just positions, no game content:

```json
[
  { "id": "asd124b", "position": [2.1, 0.5, -3.4] },
  { "id": "f82k39x", "position": [0.8, 1.2, -1.7] }
]
```

Admin also saves the ARWorldMap binary. Both files get uploaded to the server.

### Phase B — Content Authoring (separate step)

Someone maps each position ID to game content:

```json
[
  {
    "id": "asd124b",
    "label": "Beckham",
    "letter": "F",
    "sequence": 2,
    "content": { "name": "Beckham", "funFact": "..." }
  }
]
```

This is a manual step — "the capsule I placed by the window is Beckham's."

### Phase C — Runtime Merge (RN on app load)

```typescript
// Merge positions + content by ID
const capsules = positions.map(pos => ({
  ...pos,
  ...contentMap[pos.id],
}));

// Split for each layer
const forSwift = capsules.map(c => ({ id: c.id, position: c.position }));
const forState = capsules.map(c => ({
  id: c.id, label: c.label, letter: c.letter, content: c.content,
}));

// Send positions to Swift
ARWorldMapModule.placeCapsules(forSwift);

// Store game data in RN state
setGameCapsules(forState);
```

---

## Tying Interactive Components to AR Positions

React Native never needs to know where on screen the capsule is. The connection is purely the **ID crossing the bridge**.

### Tap Flow

```
User taps capsule in AR view
  → Swift does SCNHitTest on the tap point
  → Finds the 3D node (node.name = "asd124b")
  → Fires event: onCapsuleTapped("asd124b")
  → React Native receives "asd124b"
  → Looks up game state for that ID
  → Shows a React Native modal/sheet on top of the AR view
```

### Swift Side — Tap Handler

```swift
@objc func handleTap(_ gesture: UITapGestureRecognizer) {
    let location = gesture.location(in: arView)
    let hitResults = arView.hitTest(location)

    if let node = hitResults.first?.node,
       let capsuleId = node.name {

        // Fire event across bridge to React Native
        sendEvent("onCapsuleTapped", ["capsuleId": capsuleId])
    }
}
```

### React Native Side — Event Listener

```typescript
useEffect(() => {
  const listener = arEvents.addListener("onCapsuleTapped", (event) => {
    const capsule = gameState.capsules[event.capsuleId];
    showCapsuleModal(capsule);
    markDiscovered(event.capsuleId);
  });
  return () => listener.remove();
}, []);
```

### UI Layering

```
┌─────────────────────────┐
│                         │
│   AR Camera View        │  ← Swift ARSCNView (full screen)
│      (capsules float    │
│       in 3D space)      │
│                         │
│  ┌───────────────────┐  │
│  │  Beckham          │  │  ← React Native Modal (overlays AR)
│  │  Fun fact: ...    │  │     triggered by ID from Swift
│  │  Letter: F        │  │
│  │  [Collect]        │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

The AR view and the RN UI are **stacked layers**, not interleaved. Swift handles all 3D rendering and hit testing. RN handles all 2D UI and game logic. The ID is the only thing that crosses the bridge at interaction time.
