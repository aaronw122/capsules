# Capsules -- Planning & Review Notes (v2)

**Date:** 2026-02-17
**Status:** Updated with v2 subagent feedback (PM, Senior Dev, AR Dev)

---

## What Changed (PRD v1 → v2)

| Aspect | PRD v1 | PRD v2 | Impact |
|--------|--------|--------|--------|
| **Platform** | Mobile web, no install | React Native iOS, TestFlight install | Entire tech stack changes |
| **AR approach** | AR.js / WebXR (browser) | ARWorldMap generated with Swift (native ARKit) | No markers needed, but Swift bridge required |
| **Distribution** | QR → browser URL | QR → TestFlight install | Adds deployment friction + review time |
| **Android** | Supported | Explicitly dropped | Simplifies device matrix |
| **Leaderboard** | Out of scope | **Must** | Requires server/shared state |
| **Two-tier puzzle** | Must | **Should** (stretch) | Good -- reduces core scope |
| **Summary page** | Must | **Should** (stretch) | Good -- can add later |

### PRD Internal Inconsistencies (MUST Fix Today)
The **Constraints section** (lines 118-148) was NOT updated. It still references:
- "TypeScript, mobile-first **web app**"
- "AR.js" and "Vite"
- "Vercel or Netlify" for deployment
- "iOS Safari and Android Chrome"
- Milestones still say "Deployed to Vercel/Netlify", "Tested on both iOS and Android"

**This is not cosmetic.** It signals the team hasn't fully processed the implications of the pivot. If the milestones still reference web deployment, has anyone thought about what "deployed" means in the TestFlight context? (Apple review time, beta tester limits, build expiration, iteration cycle 10-50x slower than Vercel). Someone needs to spend 30 minutes doing a full pass on the PRD today.

---

## Reviewer Disagreement: Should the Pivot Stand?

The three reviewers split on the fundamental question:

### PM: "Pivot is correct, but eyes open"
The pivot is justified because **v1 couldn't actually work** -- iOS Safari has no WebXR, and AR.js marker-based tracking is a poor experience. The team traded one set of problems (bad AR on Safari) for a different set (Swift bridge, TestFlight friction, ARWorldMap reliability). The key is to keep scope tight and have fallbacks ready.

### Cynical Senior Dev: "Go back to web. This is a panicked pivot."
AR.js marker-based tracking DOES work on iOS Safari via `getUserMedia()` + JavaScript computer vision. It's not "real" AR (no plane detection, no occlusion), but it works in a browser with zero install. The team saw "WebXR not supported" and leapt to "we need native ARKit" -- but the actual conclusion should have been "marker-based AR.js is fine for a 3.5-day demo."

The team went from **1 unfamiliar technology** (AR.js) to **5 unfamiliar technologies** (React Native native modules, Swift/ARKit, ARWorldMap, Firebase backend, TestFlight pipeline). The senior dev's blunt assessment: "This pivot, as scoped, will not ship."

If committed to native and can't revert: **drop React Native entirely, go pure Swift/SwiftUI.** The AR view IS the app. SwiftUI can handle the simple UI (name entry, capsule detail, leaderboard) in far fewer lines than the RN↔Swift bridge requires.

### AR Dev: "ARWorldMap is high-risk but viable with fallbacks"
60% chance ARWorldMap works well enough for demo (12-15 of 17 devices re-localize). 25% chance you need the image-detection fallback. 15% chance you need QR fallback. The key technical recommendation: **Alternative D (image detection + relative offsets)** as the primary fallback to ARWorldMap.

### The Decision for the Team
This is a judgment call that depends on the team's risk appetite and what they're optimizing for:
- **Optimize for reliability of demo day?** → Web AR.js. Lower ceiling, higher floor.
- **Optimize for impressiveness if it works?** → Native ARKit. Higher ceiling, floor of zero.
- **Middle ground?** → Native ARKit with image-detection fallback (Alternative D) + QR fallback. Still native, but with graceful degradation.

---

## Executive Summary

The pivot to native iOS + ARWorldMap resolves the biggest blocker from v1 (iOS Safari has no WebXR), and gives access to ARKit's full capabilities -- real spatial mapping, markerless object placement, occlusion. But it introduces a new set of risks: TestFlight deployment friction, Swift/React Native bridge complexity, and the need for a server (leaderboard is now a Must).

**The critical path is Aaron's ARKit module.** If it's not functional by end of Day 2, activate Fallback C (QR mode) as the primary experience and demote AR to a stretch demo.

---

## Critical Concerns

### 1. ARWorldMap Re-localization is the Biggest Risk

ARWorldMap captures a snapshot of the room's visual features (point cloud, planes, anchors). Other devices load the same map and attempt to match their live camera feed against it.

**How it works technically:**
- ARKit extracts visual features (corners, edges, texture patterns) from camera frames
- Builds a 3D point cloud by triangulating features across frames
- Serialized ARWorldMap is typically **10-20 MB** for a single room
- Re-localization requires the user to look at areas with enough feature overlap
- Tracking state progresses: `.notAvailable` → `.limited(.relocalizing)` → `.normal`
- ARKit provides NO progress percentage -- only the binary state transition

**Failure modes:**
- **Lighting changes** -- feature descriptors are not fully lighting-invariant. Morning light vs afternoon fluorescents degrades matching severely.
- **Featureless environments** -- white walls, glass, uniform carpet provide zero features.
- **Different devices** -- different camera intrinsics (focal length, distortion). iPhone 11 vs 15 Pro will have different feature extraction.
- **Crowded room** -- 17 people standing around occlude the features that were captured in an empty room.
- **Environmental changes** -- moved furniture, closed laptops, different objects on tables.

**Success rate estimates (reviewers disagree):**
- AR Dev: 80-90% of devices re-localize within 15-30 seconds (optimistic)
- Senior Dev: 40-60% of devices re-localize (pessimistic)
- Reality is likely somewhere in between. **Plan for 2-5 out of 17 devices to struggle or fail.**

**Position accuracy after re-localization:** 1-5 cm in well-captured areas, up to 10-15 cm in sparse areas. For floating capsules this is fine. If offset reaches 30cm+ the capsule is noticeably wrong.

**Mitigations:**
- Capture in same lighting conditions as demo, as close to demo time as possible
- Test on 3+ different iPhone models in the actual venue
- Build calibration screen with tracking state feedback
- **Distribute the world map at runtime** (Firebase Storage or URL download) -- NOT bundled in the app binary. This allows re-capture on demo morning without a new TestFlight build.
- Build a "capture mode" into the app for re-capture without recompiling

### 2. TestFlight Distribution -- Major UX Downgrade

**v1 flow:** Scan QR → playing in 10 seconds. Zero friction.
**v2 flow:** Install TestFlight → accept invite → download app → open → grant permissions → calibrate AR. **3-5 minutes per person.**

For a demo day where you want 17 people playing within the first 2 minutes, the v2 flow is a significant regression. The original "scan QR and you're in" magic is gone.

**Mitigations:**
- Pre-distribute TestFlight link the night before (email/Slack)
- Require installation before the session starts
- Use a **public TestFlight link** (avoids per-email invite workflow)
- Have a "waiting room" / lobby screen so installed players see "Game starting soon..."

**Critical risk:** First TestFlight build review can take **24-48 hours**. Submit a hello-world build on Day 1. This is non-negotiable.

**Does someone have an Apple Developer account?** If not, enrollment can also take 24-48 hours. This is a Day 0 blocker.

### 3. React Native ↔ Swift Bridge -- The Complexity Bomb

The senior dev's strongest objection. The team needs to build, from scratch:

1. **React Native app** (haven't even decided Expo vs bare)
2. **Swift ARKit native module** (ARSCNView, session management, world map loading, anchor placement, hit testing)
3. **The bridge** (RCTViewManager for the AR view, RCTBridgeModule for imperative methods, ObjC bridging headers, event emission)
4. **Firebase backend** (leaderboard, game lifecycle, timer sync)
5. **TestFlight pipeline** (Xcode archive, App Store Connect, provisioning)

That's 5 unfamiliar technologies in 3.5 days. Every layer depends on every other layer. You can't test the ARKit module without the bridge. You can't test the bridge without the RN app. You can't test on real devices without TestFlight.

**The senior dev's alternative:** Drop React Native entirely. Build a pure **Swift/SwiftUI** app. The AR camera IS the UI. SwiftUI handles the simple screens (name entry, capsule detail, leaderboard) in far fewer lines than the RN↔Swift bridge requires. This eliminates an entire technology layer.

**AR dev's recommendation (if staying with RN):**
- Use raw `RCTViewManager` + `RCTBridgeModule` pattern, NOT Expo Modules API
- If using Expo, run `npx expo prebuild` immediately to get bare iOS project
- Use **SceneKit** (ARSCNView), NOT RealityKit -- more documentation, simpler API
- Bundle world map file in app bundle, load from disk on Swift side (avoids 20MB bridge transfer)
- Keep the bridge interface narrow: 5 methods in, 4 events out

**Bridge files needed:**
```
ios/
  CapsuleAR/
    ARWorldMapView.swift              # Native ARSCNView wrapper
    ARWorldMapViewManager.swift       # RCTViewManager bridge
    ARWorldMapViewManager.m           # ObjC bridge declarations
    ARWorldMapModule.swift            # Imperative methods
    ARWorldMapModule.m                # ObjC bridge declarations
```

### 4. Server -- Firebase, Not Express (Unanimous)

All three reviewers agree: **Firebase Realtime DB, not a custom Express server.** The PRD mentions "Express + WebSockets" -- veto this immediately. Firebase gives you everything needed with zero server code:

- Leaderboard (sorted query on discovered count)
- Game start/end (write `gameState` node, all clients listen)
- Timer sync (server timestamp as source of truth)
- Player progress (each player writes to their own node)

The leaderboard promotion from "out of scope" to "Must" is **defensible only if using Firebase.** If anyone suggests building a custom backend, the leaderboard should be demoted back to Should.

### 5. Open Questions from PRD (With Recommended Answers)

| Question | Recommendation |
|----------|---------------|
| **Lobby/gamestate: how to start/end a game?** | Admin writes to Firebase: `{ status: "active", startTime: serverTimestamp(), durationSeconds: 1800 }`. All clients listen. Game ends when timer hits 0 or admin writes `status: "ended"`. |
| **Should we even start/end?** | Yes. Facilitator starts game for demo day. Late joiners get remaining time. |
| **Discovered capsule: personal or shared?** | **Both.** Personal: your own progress (12/17). Shared: leaderboard shows everyone's count. Do NOT show which specific capsules others found -- that removes the fun of discovery. |
| **How does server broadcast end game?** | Firebase listener on game status node. No WebSocket server needed. |
| **Who is the user?** | Cohort member. No auth. Name entry on first launch. Player writes progress to Firebase under a random ID. |

---

## Updated Scope Assessment

### MUST (Ship or Fail)
- TestFlight-distributed iOS app
- AR camera view with capsules placed at real-world positions via ARWorldMap
- Capsule tap → reveal content (name, fun fact, key fragment)
- Onboarding flow (name entry + simple instructions)
- Countdown timer (server-synced)
- Final phrase input → win/lose
- Leaderboard (shared, real-time via Firebase)

### Further Cuts Recommended by Reviewers
The Must scope above is already tight. Three additional cuts to create margin:

| Cut | Why | Saves |
|-----|-----|-------|
| **Intro story narrative screens** | "Enter your name" + "Find all 17 capsules before time runs out" is sufficient. Narrative flavor is a Should. | ~2-3 hours |
| **Capsule photos** | Text-only capsules (name + fun fact + fragment) are 10x easier to author and render. Photos require asset management, image loading, layout. | ~3-4 hours |
| **Fancy calibration UX** | Just show "Point your phone around the room slowly" text. Progress bar and guided calibration are a Should. | ~2-3 hours |

### SHOULD (If Time Permits)
- Two-tier puzzle (12 open + 5 locked)
- Intro story narrative screens
- Capsule photos
- Holographic Andrew
- Sound/haptics
- Capsule collection animations
- Summary page
- Calibration progress UI

### CUT / DEFER
- Admin website (JSON config + Firebase console)
- Android support
- Accounts / saved progress
- Outdoor/multi-venue support
- Custom Express server (use Firebase)

---

## Fallback Strategy (Ranked)

Build fallbacks in layers. Each is independent and can be activated at runtime.

### Fallback D: Image Detection + Relative Offsets (Best Alternative to ARWorldMap)
**This is the AR dev's top recommendation if ARWorldMap proves unreliable.**

Print ONE reference image (poster) and place it at a known location (e.g., by the front door). When a player's device detects this image via `ARImageTrackingConfiguration`, it establishes a coordinate origin. All 17 capsule positions are defined as offsets from that origin. Capsules persist in world space after detection (not tied to the poster being visible).

**Pros:** Shared coordinate system, persistent capsules, simple image detection (very reliable), one thing to print and tape to a wall.
**Cons:** Capsule positions may drift 10-20cm at the far end of the room (ARKit world tracking drift over distance). For a single room this is acceptable.
**Effort to switch:** ~4 hours of code changes from ARWorldMap approach.

```swift
func renderer(_ renderer: SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
    guard let imageAnchor = anchor as? ARImageAnchor,
          imageAnchor.referenceImage.name == "origin-poster" else { return }
    let originTransform = imageAnchor.transform
    for capsuleData in allCapsules {
        let worldTransform = originTransform * capsuleData.relativeTransform
        let anchor = ARAnchor(name: capsuleData.id, transform: worldTransform)
        session.add(anchor: anchor)
    }
}
```

### Fallback C: QR Code Scavenger Hunt (No AR) -- BUILD THIS ON DAY 2
**All three reviewers agree: this is not optional.** It's 2-3 hours of insurance that guarantees a working demo.

Print QR codes at each physical capsule location. Scan → see capsule content. The game logic (Firebase leaderboard, timer, collection tracking) works identically. The only difference is the discovery mechanism.

This can be built as a parallel screen in the app. The game state module doesn't change at all.

### Fallback B: Simplified AR (No Shared World Map)
Each player's AR session is independent. Capsules appear at fixed distances/angles from the user's starting position. Less impressive but the AR experience still functions.

### When to Activate Fallbacks

| Checkpoint | Condition | Action |
|------------|-----------|--------|
| **End of Day 1** | ARKit session doesn't render a 3D object on a real iPhone | Red alert. Consider reverting to web. |
| **End of Day 2** | Cross-device ARWorldMap re-localization doesn't work | Pivot to **Fallback D** (image detection + offsets). Still native AR, just different anchoring. |
| **Day 3 at venue** | Re-localization works but is unreliable (>30% failure rate) | Keep ARWorldMap as primary, enable **Fallback D** as auto-fallback after 45s timeout |
| **Demo day** | AR fails on a specific device | That player uses **Fallback C** (QR scan mode) |

---

## Recommended Architecture

### Three-Layer Split (Now Justified)

The native approach genuinely has two different tech domains. The 3-layer split makes sense, but boundaries must be clean.

```
capsules/
  app/                          # React Native (Expo or bare RN)
    (tabs)/
      index.tsx                 # Home / lobby
      ar.tsx                    # AR view (wraps native Swift module)
      leaderboard.tsx           # Real-time leaderboard
    components/
      CapsuleDetail.tsx         # Portrait content modal
      HUD.tsx                   # Timer + progress overlay on AR view
      Onboarding.tsx            # Name entry + brief instructions
      Victory.tsx               # Win screen + phrase reveal
    game/
      state.ts                  # Local game state machine
      firebase.ts               # Firebase client
      capsuleData.ts            # Static capsule content
    types/
      capsule.ts
      game.ts

  ios/                          # Native Swift AR module
    ARWorldMapModule/
      ARWorldMapView.swift      # ARSCNView wrapper + SceneKit rendering
      ARWorldMapViewManager.swift + .m  # RCT bridge
      ARWorldMapModule.swift + .m       # Imperative methods bridge
    Resources/
      worldmap.arworldmap       # Saved ARWorldMap (or downloaded at runtime)

  data/
    capsules.json               # Capsule content + positions
    config.json                 # Game settings
```

**Alternative (Senior Dev recommendation):** Drop the `app/` layer entirely. Build a pure Swift/SwiftUI app. Eliminates the bridge complexity. The AR view is the app, SwiftUI handles the simple UI screens.

### Bridge Interface Contract

```typescript
// React Native → Swift (imperative calls)
interface ARWorldMapModule {
  startSession(worldMapBase64?: string): Promise<void>;
  placeCapsules(capsules: CapsulePosition[]): void;
  captureWorldMap(): Promise<string>;  // Admin mode: returns base64
  removeCapsule(id: string): void;
  pauseSession(): void;
}

// Swift → React Native (events)
interface ARWorldMapEvents {
  onCapsuleTapped: (capsuleId: string) => void;
  onTrackingStateChanged: (state: 'normal' | 'relocalizing' | 'insufficientFeatures' | 'excessiveMotion' | 'notAvailable') => void;
  onRelocalizationComplete: () => void;
  onCalibrationProgress: (progress: number) => void;  // Approximate, based on feature count
}
```

### Firebase Schema

```
capsules-game/
  games/{gameId}/
    status: "waiting" | "active" | "ended"
    startTime: <server timestamp>
    durationSeconds: 1800

  players/{gameId}/{playerId}/
    name: "Alice"
    joinedAt: <server timestamp>
    discoveredCount: 2
    discoveredCapsules: ["capsule-01", "capsule-05"]
    completedAt: null | <server timestamp>
```

### Capsule Content Schema (`capsules.json`)

```json
{
  "gameConfig": {
    "title": "Time Capsules",
    "year": "2126",
    "escapePhrase": "THE BEST COHORT FRACTAL EVER HAD",
    "introText": "Find all 17 capsules before time runs out!",
    "timerSeconds": 1800,
    "totalCapsules": 17
  },
  "capsules": [
    {
      "id": "capsule-01",
      "owner": {
        "name": "Alice Smith",
        "funFact": "Once debugged a production issue while skydiving"
      },
      "keyFragment": "THE",
      "sequence": 1,
      "worldPosition": {
        "transform": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0.5,1.2,-3.0,1]
      },
      "color": "#FFD700"
    }
  ]
}
```

---

## Server vs Client Evaluation

| Concern | Client-Only | Firebase | Verdict |
|---------|-------------|----------|---------|
| Player progress | Local state | Player doc | **Both** -- local for speed, Firebase for sharing |
| Capsule content | Static JSON | Remote | **Client** -- content is static |
| **Leaderboard** | Not possible | Realtime query | **Firebase** (Must) |
| **Game start/end** | Can't sync | Status node | **Firebase** (Must) |
| **Timer sync** | Drifts | Server timestamp | **Firebase** (Must) |
| Discovery visibility | Local only | Leaderboard feed | **Firebase** |
| Cheat prevention | None | Server validation | **Not worth it** for 17 trusted players |

**Verdict: Firebase Realtime DB for shared state. No custom server. Non-negotiable given the timeline.**

---

## Work Separation

| Person | Domain | Technology |
|--------|--------|-----------|
| **Aaron** (System Integrator) | AR World + Bridge | Swift, ARKit, ARWorldMap, RN native modules |
| **Beckham** (Fullstack) | Client + Firebase | React Native UI, Firebase, game state, leaderboard |
| **Erik** (UX Designer) | Design + Content + Venue | UI design, capsule content authoring, venue capture, testing |

**Critical integration point:** Aaron↔Beckham at the bridge interface. Define the contract on Day 1 before writing any code.

**Aaron is the critical path.** If his ARKit module isn't functional by end of Day 2, the project is in trouble. The fallback activation decision happens at that checkpoint.

---

## Things That Will Break (Ordered by Likelihood)

1. **ARWorldMap re-localization** -- lighting, featureless surfaces, crowded room, different devices. Test in the actual venue with actual phones.
2. **TestFlight review delays** -- submit Day 1. If you wait until Day 3, you may not have a distributable app.
3. **React Native ↔ Swift bridge bugs** -- data serialization, async timing, ObjC bridging header hell, view lifecycle. This is where most debugging time goes.
4. **ARKit tracking state transitions** -- users will wave phones erratically. Handle `.limited` states gracefully with user-facing prompts.
5. **Crowded room occludes features** -- 17 people standing in the room block the visual features captured in an empty room. Re-localization may need to happen before everyone enters, or users need to point at ceiling/upper walls.
6. **Content pipeline** -- 17 portraits need authoring. If not done by end of Day 2, devs build with placeholders and scramble.
7. **"Every capsule must be found" fragility** -- if one capsule drifts due to re-localization error, the game is unwinnable. Make the phrase guessable with 14/17 fragments.
8. **App backgrounding kills AR session** -- ARKit camera access is revoked on background. Need to handle resume gracefully (may require re-localization).

---

## Recommended Development Plan

### Day 1 (Today -- Setup + AR Spike + TestFlight Pipeline)

| Who | Task |
|-----|------|
| **Aaron** | Set up RN project. Create minimal Swift native module: ARSCNView rendering camera + ONE 3D sphere in world space. Tap detection crossing the bridge to JS. Get running on real iPhone. **Submit hello-world to TestFlight by EOD.** |
| **Beckham** | Set up Firebase project (Realtime DB). Build game state module: `createGame()`, `joinGame()`, `discoverCapsule()`, `getLeaderboard()`. Build onboarding screen (name entry). |
| **Erik** | Design UI screens. Start content collection from cohort ("write 3-4 sentences about yourself, due tomorrow"). Define the final escape phrase and assign key fragments. |

**Day 1 gate:** ARKit renders a 3D object on a real iPhone. Tap event crosses bridge to JS. TestFlight pipeline works. Firebase has basic read/write. **If ARKit doesn't work on a real device by EOD, seriously consider reverting to web.**

### Day 2 (Wednesday -- Core Loop + Bridge + Fallback C)

| Who | Task |
|-----|------|
| **Aaron** | Full ARWorldMap module: load world map, place capsules, hit testing. Capture ARWorldMap of a test space. Test cross-device re-localization (two different iPhones). |
| **Beckham** | AR screen in RN wrapping native module. CapsuleDetail modal on tap. Timer with Firebase sync. Leaderboard with real-time listener. **Build QR fallback screen (Fallback C) -- 2-3 hours of insurance.** |
| **Erik** | Build CapsuleDetail component, HUD overlay, leaderboard UI. Continue content integration. |

**Day 2 gate:** Tap capsule in AR → see content. Leaderboard updates across 2 devices. Timer works. QR fallback mode exists. **If cross-device re-localization fails, pivot to Fallback D (image detection + offsets) for Day 3.**

### Day 3 (Thursday -- Integration + Venue)

| Who | Task |
|-----|------|
| **Aaron** | Capture ARWorldMap of **actual demo venue**. Place all 17 capsule positions. Test re-localization on 3+ iPhones. If using Fallback D: set up origin poster + relative positions instead. |
| **Beckham** | End-to-end integration: onboarding → AR → collect all → victory. Edge cases (tracking lost, app background, already-collected capsules). Push TestFlight build. |
| **Erik** | Finalize all 17 capsule contents. Full playthrough testing. Polish. Prepare demo script. |

**Day 3 gate:** Full game loop on TestFlight. At least one non-team-member has played through.

### Day 3.5 (Friday -- Buffer + Demo Prep)

- Fix whatever broke
- Re-capture ARWorldMap if venue lighting changed
- 3-5 full run-throughs in actual venue
- Pre-distribute TestFlight link to all 17 cohort members (night before or morning of)
- Practice demo walkthrough
- Verify fallback modes work
- Print QR codes for Fallback C as physical backup

---

## Key Decisions

| # | Decision | Status | Answer |
|---|----------|--------|--------|
| 1 | Platform | **Decided** | React Native, iOS only, TestFlight |
| 2 | AR approach | **Decided** | ARWorldMap primary, image detection (Fallback D) secondary |
| 3 | Server | **Decided** | Firebase Realtime DB. **No Express server.** |
| 4 | Locked capsules | **Should** | Stretch goal only |
| 5 | Admin tool | **Decided** | Capture mode screen in-app + JSON config. No admin website. |
| 6 | Timer | **Must** | Server-synced via Firebase startTime |
| 7 | Discovery model | **Recommend** | Individual progress, shared leaderboard. Don't show which specific capsules others found. |
| 8 | Escape phrase | **DECIDE TODAY** | Blocks content pipeline. Pick the phrase, assign fragments. Make guessable with 14/17 for resilience. |
| 9 | Apple Dev account | **CONFIRM TODAY** | If nobody has one, enrollment can take 24-48 hours. Day 0 blocker. |
| 10 | Expo or bare RN? | **Recommend bare** | AR dev recommends raw RN native modules over Expo Modules API for directness and debuggability. If using Expo, run `npx expo prebuild` immediately. |
| 11 | RN or pure Swift? | **Team decision** | Senior dev recommends dropping RN entirely for pure Swift/SwiftUI -- eliminates bridge complexity. Trade-off: team may be more comfortable with TypeScript for game UI. |

---

## Risk Probability Assessment (AR Dev's Estimate)

| Outcome | Probability | Action |
|---------|-------------|--------|
| ARWorldMap works for demo (12-15 of 17 devices) | **60%** | Ship it |
| Need Fallback D (image detection origin) | **25%** | Pivot on Day 2/3, still native AR |
| Need Fallback C (QR codes, no AR) | **15%** | Game logic still works, just no AR visuals |

**In all three scenarios, the game ships.** The question is how impressive the AR layer is. Build the fallbacks early so any outcome is a working demo.
