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

Both files are AirDropped to the team and uploaded to the server.

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

---

## File Structure

> Reference: [Excalidraw diagram](../Downloads/diagram_pt_2.excalidraw.png) — "Positioning the capsules (AR)" section shows the three-way relationship between ARWorldMap, Object Positions JSON, and the React Native client.

### Capture Tool — `CapsuleCaptureTools/` (separate Xcode project)

```
CaptureApp.swift
```
- Standalone SwiftUI app, ~100 lines
- Runs ARKit session, tap to place capsules, save world map
- Exports `positions.json` + `worldmap.arworldmap`
- Run directly from Xcode on Erik's phone — no TestFlight

### Main App Swift (ARKit) — `ios/CapsuleAR/`

```
ARWorldMapView.swift
```
- Subclasses `ARSCNView` — the actual AR camera view
- Runs the ARKit session
- Renders 3D capsule nodes in world space
- Handles tap gesture → `SCNHitTest` → finds `node.name` (capsule ID)
- `placeCapsules([{id, position}])` — creates `SCNNode`s, sets `node.name = id`
- `loadWorldMap(filename)` — deserializes and relocalizes (user mode only)

> Maps to the **ARWorldMap** box in the diagram: `loadWorldMap()` and `onRelocalized` are exposed to React Native. `saveWorldMap()` lives in the capture tool, not here.

```
ARWorldMapModule.swift
```
- Imperative methods RN can call: `startSession()`, `placeCapsules()`, `pauseSession()`
- Emits events back to RN: `onCapsuleTapped`, `onRelocalized`, `onTrackingStateChanged`

### Bridge (ObjC glue) — `ios/CapsuleAR/`

```
ARWorldMapViewManager.swift    # Exposes ARWorldMapView as a RN <View>
ARWorldMapViewManager.m        # ObjC: RCT_EXTERN_MODULE(ARWorldMapView, RCTViewManager)
ARWorldMapModule.m             # ObjC: RCT_EXTERN_MODULE / RCT_EXTERN_METHOD declarations
CapsuleAR-Bridging-Header.h   # #import <React/RCTBridgeModule.h> etc.
```

These are boilerplate. The `.m` files are one-liners that tell React Native "these Swift classes exist." The bridging header lets Swift import React Native's ObjC types.

### React Native — `app/`

```
native/ARWorldMapModule.ts
```
- JS typed wrapper around `NativeModules.ARWorldMapModule`
- Exposes: `startSession()`, `placeCapsules()`, `captureWorldMap()`
- Subscribes to native events via `NativeEventEmitter`

```
native/ARWorldMapView.tsx
```
- `requireNativeComponent("ARWorldMapView")`
- Renders the Swift AR view as a React component: `<ARWorldMapView style={{flex: 1}} />`

> Maps to the diagram's note: "we handle interaction with objects, and what they look like all in react native."

```
data/positions.json
```
- Object Positions JSON from admin setup
- `[{ "id": "asd124b", "position": [2.1, 0.5, -3.4] }, ...]`

> Maps to the **Object Positions JSON** box in the diagram: "your placed objects with coordinates, labels, types."

```
data/capsuleContent.json
```
- Game content authored separately
- `[{ "id": "asd124b", "label": "Beckham", "letter": "F", "content": {...} }, ...]`

> Maps to the diagram's **React Native/Client State** section: capsuleState with type, decryption key part, and content.

```
game/capsuleLoader.ts
```
- Merges `positions.json` + `capsuleContent.json` by ID
- Returns `{ forSwift: [{id, position}], forState: [{id, label, letter, content}] }`

```
(tabs)/ar.tsx
```
- The AR screen
- Renders `<ARWorldMapView />` full screen
- On mount: loads world map, calls `placeCapsules(forSwift)`
- Listens for `onCapsuleTapped` → looks up `forState` by ID → shows modal
- Listens for `onTrackingStateChanged` → shows calibration prompts

---

## Data Flow

> Maps to the diagram's **Sequence** box: "app loads ARWorldMap binary → hands it to ARKit via Swift → user looks around → ARKit matches visual features, fires onRelocalized → React Native reads capsule positions JSON, renders objects at those coordinates."

```
positions.json ─┐
                 ├→ capsuleLoader.ts ─→ forSwift [{id, position}]
capsuleContent.json ┘        │              ↓
                              │     ARWorldMapModule.placeCapsules()
                              │              ↓
                              │     Swift creates SCNNodes (node.name = id)
                              │
                              └─→ forState [{id, label, letter, content}]
                                         ↓
                                  RN game state (lookup by id)
                                         ↑
                              onCapsuleTapped("asd124b")
                                         ↑
                              Swift bridge event (id only)
```
