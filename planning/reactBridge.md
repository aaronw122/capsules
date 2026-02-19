# React Native ↔ Swift Bridge

## Two Separate Apps

There are **two Xcode projects**, not one. This decouples venue capture from the main app and removes the TestFlight dependency for world map generation.

### 1. Capture Tool (Erik's dev tool — never goes to TestFlight)

A standalone SwiftUI app. Erik runs it on his phone directly from Xcode (plugged in via USB, no TestFlight needed). Used to scan the venue and place capsule positions.

```
capture-tool/Capsules/                ← Separate Xcode project
  Capsules/
    CaptureAppMain.swift              ← SwiftUI app entry point
    CaptureManager.swift              ← Core AR logic (ObservableObject)
      - Runs ARKit session (ARSCNView + ARWorldTrackingConfiguration)
      - Tap to place capsule → raycast → drops a sphere, generates UUID + position
      - "Save World Map" button → serializes ARWorldMap binary to device
      - "Export Positions" button → writes positions JSON to device
      - AirDrop / share sheet to get both files off the phone
    CaptureView.swift                 ← SwiftUI view binding to CaptureManager
```

**Outputs two files:**

- `arworldmap.data` — the ARWorldMap binary (spatial features for relocalization)
- `positions.json` — capsule positions with UUIDs

**Why separate?** Erik can capture the venue with just Xcode + his phone. No React Native, no bridge, no TestFlight review. If the venue changes or lighting shifts, he re-runs the capture tool in 5 minutes — no rebuild of the main app needed.

### 2. Main App (the player-facing app — goes to TestFlight)

The React Native + Swift app that players install. It **consumes** the files from the capture tool. It never needs to generate a world map or place capsule positions itself.

---

## Object Lifecycle

### Phase A — Venue Capture (Capture Tool, Erik)

Erik walks the room with the capture tool, taps surfaces to place capsules. Each tap:

1. Swift does a raycast (hit test against estimated planes)
2. Gets a 3D world coordinate `[2.1, 0.5, -3.4]`
3. Creates an `ARAnchor` at that position (with UUID as the anchor name)
4. Renders a placeholder sphere so Erik sees where he placed it
5. Stores `{ id, position }` in a local array

When done, Erik exports:

**positions.json** — just positions, no game content:

```json
[
  { "id": "A1B2C3D4-E5F6-...", "position": [2.1, 0.5, -3.4] },
  { "id": "F82K39X0-B2C3-...", "position": [0.8, 1.2, -1.7] }
]
```

**arworldmap.data** — the ARWorldMap binary. Contains the room's spatial features (point cloud, planes) AND the capsule anchors. However, in production the anchors embedded in the world map are ignored — capsule placement is controlled by the server so capsules only appear after game start.

Both files are AirDropped to the team.

### Phase B — Content Authoring (one-time setup)

Capsule content is authored separately from positions. The content schema:

```json
[
  {
    "id": "A1B2C3D4-E5F6-...",
    "name": "Beckham",
    "funFact": "Once debugged a production issue while skydiving",
    "keyFragment": "THE",
    "color": "#FFD700",
    "sequence": 1
  }
]
```

The IDs must match between positions.json and the content data. Positions define where capsules appear in 3D space; content defines what the player sees when they tap one.

### Phase C — Game Start + Capsule Placement (ar.tsx)

The world map and capsule placement are **two separate steps** with different timing:

**On app load** — start AR session with the world map for relocalization only. The player sees the camera feed and ARKit begins matching the physical space. No capsules are visible yet.

```typescript
// ar.tsx — on mount
ARWorldMapModule.startSession(worldMapBase64);
// Player sees AR camera, ARKit relocalizes in background
// No capsules visible — player is in the lobby
```

**After game start** — the server broadcasts game start. ar.tsx fetches capsule data, splits it, and calls placeCapsules(). Only now do spheres appear in AR.

```typescript
// ar.tsx — after server broadcasts gameStart
const capsules = await fetch('/capsules').then((r) => r.json());

// Split: positions go to Swift, content stays in RN state
const forSwift = capsules.map((c) => ({ id: c.id, position: c.position, color: c.color }));
const forState = capsules.map((c) => ({
  id: c.id,
  name: c.name,
  funFact: c.funFact,
  keyFragment: c.keyFragment,
  sequence: c.sequence,
}));

// NOW capsules appear in AR
ARWorldMapModule.placeCapsules(forSwift);
setGameCapsules(forState);
```

This separation means:

- Players can calibrate/relocalize while waiting in the lobby
- Capsules only appear when the game starts (server-controlled)
- Capsule data comes from the server, not baked into the app binary

---

## Tying Interactive Components to AR Positions

React Native never needs to know where on screen the capsule is. The connection is purely the **ID crossing the bridge**.

### How the Capsule ID Threads Through Every Layer

The same ID you pass into `placeCapsules` is the same ID you get back on tap. Here's how it's preserved at each step:

**1. placeCapsules stores the ID as the anchor name** (`ARWorldMapView.swift`)

```swift
let anchor = ARAnchor(name: id, transform: transform)  // id = "A1B2C3D4-..."
self.session.add(anchor: anchor)
```

**2. Renderer copies the ID to the visible sphere node** (`ARWorldMapView.swift`)

```swift
func renderer(_, didAdd node: SCNNode, for anchor: ARAnchor) {
    guard let name = anchor.name else { return }  // name = "A1B2C3D4-..."
    let sphereNode = SCNNode(geometry: sphere)
    sphereNode.name = name   // ID now lives on the tappable 3D node
    node.addChildNode(sphereNode)
}
```

**3. Tap handler walks the node tree to find the ID** (`ARWorldMapView.swift`)

```swift
// User taps → SCNHitTest finds the node → walks up parent chain
if let name = current.name, !name.isEmpty {
    onCapsuleTapped?(name)  // fires closure with "A1B2C3D4-..."
}
```

**4. Module sends the ID across the bridge** (`ARWorldMapModule.swift`)

```swift
view.onCapsuleTapped = { [weak self] capsuleId in
    self?.sendEvent(withName: "onCapsuleTapped", body: ["capsuleId": capsuleId])
}
```

**5. JS receives the same ID** (`ar.tsx`)

```typescript
ARWorldMapModule.onCapsuleTapped((e) => {
  console.log(e.capsuleId); // "A1B2C3D4-..." — same ID from step 1
});
```

The ID is the contract between Swift and React Native. It goes in via `placeCapsules`, gets stored on the anchor, copied to the node, extracted on tap, and sent back to JS unchanged.

### Tap Flow

```
User taps capsule in AR view
  → ARWorldMapView.swift does SCNHitTest on the tap point
  → Walks node hierarchy, finds node.name = "A1B2C3D4-E5F6-..."
  → Calls onCapsuleTapped closure
  → ARWorldMapModule.swift converts closure to sendEvent()
  → Event crosses the RN bridge
  → ar.tsx receives the capsule ID
  → Looks up game state for that ID
  → Shows a React Native modal/sheet on top of the AR view
```

### Swift Side — How Tap Events Cross the Bridge

The view and module are separate. The view fires closures; the module converts them to bridge events.

**ARWorldMapView.swift** — handles the tap, calls a closure:

```swift
@objc private func handleTap(_ gesture: UITapGestureRecognizer) {
    let location = gesture.location(in: self)
    let hitResults = hitTest(location, options: [
        SCNHitTestOption.searchMode: SCNHitTestSearchMode.all.rawValue
    ])
    for result in hitResults {
        var node: SCNNode? = result.node
        while let current = node {
            if let name = current.name, !name.isEmpty {
                onCapsuleTapped?(name)   // closure, NOT sendEvent
                return
            }
            node = current.parent
        }
    }
}
```

**ARWorldMapModule.swift** — wires the closure to sendEvent when the view is linked:

```swift
func setARView(_ view: ARWorldMapView) {
    self.arView = view
    view.onCapsuleTapped = { [weak self] capsuleId in
        self?.sendEvent(withName: "onCapsuleTapped", body: ["capsuleId": capsuleId])
    }
}
```

The view doesn't know about the bridge. The module is the translator.

### React Native Side — Event Listener

```typescript
// ar.tsx
useEffect(() => {
  const tapSub = ARWorldMapModule.onCapsuleTapped((e) => {
    // Look up content for this capsule
    const capsule = gameCapsules.find((c) => c.id === e.capsuleId);
    showCapsuleModal(capsule);
    markDiscovered(e.capsuleId);
  });
  return () => tapSub.remove();
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
│  │  Fragment: THE    │  │
│  │  [Collect]        │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

The AR view and the RN UI are **stacked layers**, not interleaved. Swift handles all 3D rendering and hit testing. RN handles all 2D UI and game logic. The ID is the only thing that crosses the bridge at interaction time.

---

> For full project directory layout, file descriptions, and explanation of why each folder exists, see [projectStructure.md](./projectStructure.md).

---

## Data Flow

```
App load:
  ARWorldMapModule.startSession(worldMapBase64)
       ↓
  ARKit relocalizes (matches physical space to saved map)
       ↓
  onRelocalized fires → player is calibrated, waiting in lobby

Game start (server broadcast):
  GET /capsules (server sends capsule positions + content)
       ↓
  ar.tsx splits response
       ├─→ forSwift [{id, position, color}]
       │         ↓
       │   ARWorldMapModule.placeCapsules()
       │         ↓
       │   Swift creates ARAnchor per capsule
       │         ↓
       │   ARKit fires renderer → SCNSphere appears at each anchor
       │
       └─→ forState [{id, name, funFact, keyFragment, sequence}]
                    ↓
             RN game state (lookup by id)

Capsule tap:
  User taps sphere in AR
       ↓
  ARWorldMapView: SCNHitTest → finds node.name → onCapsuleTapped?(name)
       ↓
  ARWorldMapModule: closure → sendEvent("onCapsuleTapped", {capsuleId})
       ↓
  ar.tsx: receives ID → looks up forState → shows modal
```

---

## Bridge Methods (Actual)

### JS → Swift (via ARWorldMapModule.ts → ARWorldMapModule.swift)

| Method                                   | Purpose                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `startSession(worldMapBase64)`           | Start AR session. Pass base64 world map data for relocalization, or empty string for plain AR.                                |
| `startSessionFromBundle(filename)`       | Load world map from app bundle by filename. Falls back to plain AR if file not found. Used for testing.                       |
| `placeCapsules([{id, position, color}])` | Place capsule spheres at 3D positions. Call after game start. Creates ARAnchor per capsule; renderer creates visible spheres. |

### Swift → JS (events via NativeEventEmitter)

| Event                    | Payload                 | When                                                                  |
| ------------------------ | ----------------------- | --------------------------------------------------------------------- |
| `onCapsuleTapped`        | `{ capsuleId: string }` | Player tapped a capsule sphere                                        |
| `onRelocalized`          | none                    | ARKit matched the physical space to the world map                     |
| `onTrackingStateChanged` | `{ status: string }`    | ARKit tracking status changed (mapped/limited/notAvailable/extending) |
