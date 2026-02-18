# React Native ↔ Swift Bridge

## Two Separate Apps

There are **two Xcode projects**, not one. This decouples venue capture from the main app and removes the TestFlight dependency for world map generation.

### 1. Capture Tool (Erik's dev tool — never goes to TestFlight)

A standalone Swift app, ~100 lines. Erik runs it on his phone directly from Xcode (plugged in via USB, no TestFlight needed). Used to scan the venue and place capsule positions.

```
CapsuleCaptureTools/              ← Separate Xcode project
  CaptureApp.swift                ← Minimal SwiftUI app
    - Runs ARKit session (ARSCNView + ARWorldTrackingConfiguration)
    - Tap to place capsule → raycast → drops a sphere, generates UUID + position
    - "Save World Map" button → serializes ARWorldMap binary to device
    - "Export Positions" button → writes positions JSON to device
    - AirDrop / share sheet to get both files off the phone
```

**Outputs two files:**
- `worldmap.arworldmap` — the ARWorldMap binary
- `positions.json` — capsule positions with IDs

**Why separate?** Erik can capture the venue on Day 1 with just Xcode + his phone. No React Native, no bridge, no TestFlight review. If the venue changes or lighting shifts, he re-runs the capture tool in 5 minutes — no rebuild of the main app needed.

### 2. Main App (the player-facing app — goes to TestFlight)

The React Native + Swift app that players install. It **consumes** the files from the capture tool. It never needs to generate a world map or place capsule positions itself.

---

## Object Lifecycle

### Phase A — Venue Capture (Capture Tool, Erik)

Erik walks the room with the capture tool, taps surfaces to place capsules. Each tap:

1. Swift does a raycast (hit test against detected planes)
2. Gets a 3D world coordinate `[2.1, 0.5, -3.4]`
3. Creates an `ARAnchor` at that position
4. Renders a placeholder sphere so Erik sees where he placed it
5. Generates a UUID
6. Stores `{ id, position }` in a local array

When done, Erik exports:

**positions.json** — just positions, no game content:

```json
[
  { "id": "asd124b", "position": [2.1, 0.5, -3.4] },
  { "id": "f82k39x", "position": [0.8, 1.2, -1.7] }
]
```

**worldmap.arworldmap** — the ARWorldMap binary.

Both files are AirDropped to the team. Positions are merged with content into `backend/data/capsules.json`.

### Phase B — Content Authoring + Merge (one-time setup)

Someone merges Erik's positions with game content into a single `capsules.json` on the server:

```json
[
  {
    "id": "asd124b",
    "position": [2.1, 0.5, -3.4],
    "label": "Beckham",
    "letter": "F",
    "content": { "name": "Beckham", "funFact": "..." }
  }
]
```

This file lives at `backend/data/capsules.json` — single source of truth. Update it without rebuilding the app.

### Phase C — Client Fetch + Split (RN on app load)

```typescript
// Fetch merged capsule data from server
const capsules = await fetch("/capsules").then(r => r.json());

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

---

> For full project directory layout, file descriptions, and explanation of why each folder exists, see [projectStructure.md](./projectStructure.md).

---

## Data Flow

> Maps to the diagram's **Sequence** box: "app loads ARWorldMap binary → hands it to ARKit via Swift → user looks around → ARKit matches visual features, fires onRelocalized → React Native reads capsule positions JSON, renders objects at those coordinates."

```
GET /capsules (server serves backend/data/capsules.json)
       ↓
  Client splits response
       ├─→ forSwift [{id, position}]
       │         ↓
       │   ARWorldMapModule.placeCapsules()
       │         ↓
       │   Swift creates SCNNodes (node.name = id)
       │
       └─→ forState [{id, label, letter, content}]
                    ↓
             RN game state (lookup by id)
                    ↑
         onCapsuleTapped("asd124b")
                    ↑
         Swift bridge event (id only)
```
