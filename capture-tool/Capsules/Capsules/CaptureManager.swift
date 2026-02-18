// CaptureManager.swift
// Core AR logic for the capture tool. Manages the ARKit session, handles
// tap-to-place, saves the world map, and exports capsule positions to JSON.
//
// Ported from ARWorldMapTest/ARSessionManager.swift with these changes:
//   - Removed play mode, loadWorldMap(), isRelocalized (capture-only)
//   - Added placedCapsules array to track UUIDs + positions
//   - Added exportPositions() to write positions.json
//   - Added getShareItems() for the share sheet
//   - anchor.name is set to UUID (prototype used "capsule" for all)
//
// Architecture notes:
//   - ObservableObject so SwiftUI CaptureView can bind to @Published props
//   - ARKit delegate callbacks arrive off-main-thread, so they're marked
//     `nonisolated` and hop back to MainActor via Task {} (Swift 6 pattern)
//   - sceneView is created once and reused (not recreated on reset)

import ARKit
import Combine
import SceneKit

/// Represents a single placed capsule. Exported to positions.json and later
/// consumed by the RN app's capsuleLoader.ts to merge with capsuleContent.json.
struct CapsulePosition: Codable {
    let id: String          // UUID string — must match across positions.json and capsuleContent.json
    let position: [Float]   // [x, y, z] in ARKit world coordinates (meters)
}

class CaptureManager: NSObject, ObservableObject {

    let sceneView = ARSCNView()

    @Published var statusMessage = "Point at surfaces. Tap to place capsules."
    @Published var worldMapStatus: ARFrame.WorldMappingStatus = .notAvailable
    @Published var anchorsPlaced = 0
    @Published var placedCapsules: [CapsulePosition] = []

    // CONFIGURABLE: Colors used for preview spheres in the capture tool.
    // These are just for visual feedback while placing — the real colors
    // come from capsuleContent.json in the RN app. Add/remove colors to
    // change the palette. Used in renderer(_:didAdd:for:) below.
    private let sphereColors: [UIColor] = [
        .systemRed, .systemBlue, .systemGreen, .systemYellow,
        .systemOrange, .systemPurple, .systemPink, .systemCyan
    ]

    override init() {
        super.init()
        sceneView.autoenablesDefaultLighting = true
        sceneView.automaticallyUpdatesLighting = true
    }

    func setupDelegates() {
        sceneView.delegate = self
        sceneView.session.delegate = self
    }

    // MARK: - Session management

    func startSession() {
        let config = ARWorldTrackingConfiguration()
        // CONFIGURABLE: Change planeDetection to [.horizontal] only if you're
        // placing capsules on floors/tables, or [.vertical] for walls only.
        config.planeDetection = [.horizontal, .vertical]
        sceneView.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        anchorsPlaced = 0
        placedCapsules = []
        statusMessage = "Point at surfaces. Tap to place capsules."
    }

    // MARK: - Place capsule
    // Raycasts from the tap point to find an estimated plane surface,
    // then creates an ARAnchor at that position. The anchor triggers
    // renderer(_:didAdd:for:) which renders the visible sphere.

    func handleTap(at point: CGPoint) {
        guard let query = sceneView.raycastQuery(from: point, allowing: .estimatedPlane, alignment: .any) else {
            statusMessage = "No surface found — try again"
            return
        }

        let results = sceneView.session.raycast(query)
        guard let result = results.first else {
            statusMessage = "No surface found — try again"
            return
        }

        let capsuleId = UUID().uuidString
        let anchor = ARAnchor(name: capsuleId, transform: result.worldTransform)
        sceneView.session.add(anchor: anchor)

        let col3 = result.worldTransform.columns.3
        let pos = CapsulePosition(id: capsuleId, position: [col3.x, col3.y, col3.z])
        placedCapsules.append(pos)

        anchorsPlaced += 1
        statusMessage = "\(anchorsPlaced) capsule(s) placed."
    }

    // MARK: - Save world map
    // Serializes the current ARWorldMap (includes all anchors + spatial data)
    // to Documents/arworldmap.data. This file is loaded by the RN app's
    // ARWorldMapView.swift to relocalize players in the same physical space.

    func saveWorldMap() {
        sceneView.session.getCurrentWorldMap { worldMap, error in
            Task { @MainActor [weak self] in
                guard let self else { return }

                guard let map = worldMap else {
                    self.statusMessage = "Can't get world map yet: \(error?.localizedDescription ?? "unknown"). Keep scanning."
                    return
                }

                do {
                    let data = try NSKeyedArchiver.archivedData(withRootObject: map, requiringSecureCoding: true)
                    try data.write(to: self.mapFileURL)
                    let anchorCount = map.anchors.count
                    self.statusMessage = "Saved! \(anchorCount) anchor(s) in map."
                } catch {
                    self.statusMessage = "Save failed: \(error.localizedDescription)"
                }
            }
        }
    }

    // MARK: - Export positions
    // Writes placedCapsules to Documents/positions.json as pretty-printed JSON.
    // This file goes into frontend/data/positions.json in the repo.

    func exportPositions() {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let data = try encoder.encode(placedCapsules)
            try data.write(to: positionsFileURL)
            statusMessage = "Exported \(placedCapsules.count) positions to positions.json"
        } catch {
            statusMessage = "Export failed: \(error.localizedDescription)"
        }
    }

    // MARK: - Share
    // Returns file URLs for the share sheet (AirDrop). Only includes files
    // that actually exist — so if you haven't saved/exported yet, they won't appear.

    func getShareItems() -> [URL] {
        var items: [URL] = []
        if FileManager.default.fileExists(atPath: mapFileURL.path) {
            items.append(mapFileURL)
        }
        if FileManager.default.fileExists(atPath: positionsFileURL.path) {
            items.append(positionsFileURL)
        }
        return items
    }

    // MARK: - File URLs

    // CONFIGURABLE: Output filenames. Change these if you want separate files
    // per venue (e.g. "venue-a-worldmap.data", "venue-a-positions.json").
    private var mapFileURL: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("arworldmap.data")
    }

    private var positionsFileURL: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("positions.json")
    }
}

// MARK: - ARSCNViewDelegate
// Called by ARKit when an anchor is added to the scene. We attach a colored
// sphere to each capsule anchor. The color is deterministic (based on anchor
// hash) so the same capsule gets the same color across sessions.
// `nonisolated` because ARKit calls this from a background thread.

extension CaptureManager: ARSCNViewDelegate {
    nonisolated func renderer(_ renderer: any SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
        // Skip plane anchors and other system anchors (only render our named capsules)
        guard anchor.name != nil, anchor.name != "" else { return }

        // Use the instance property sphereColors via MainActor-isolated access
        let colors: [UIColor] = [
            .systemRed, .systemBlue, .systemGreen, .systemYellow,
            .systemOrange, .systemPurple, .systemPink, .systemCyan
        ]
        let colorIndex = abs(anchor.hash) % colors.count

        // CONFIGURABLE: Sphere radius in meters. 0.05 = 5cm diameter (tennis ball size).
        // Increase for easier visibility during capture, decrease for subtlety.
        let sphere = SCNSphere(radius: 0.05)
        sphere.firstMaterial?.diffuse.contents = colors[colorIndex]
        sphere.firstMaterial?.lightingModel = .physicallyBased

        let sphereNode = SCNNode(geometry: sphere)
        node.addChildNode(sphereNode)

        // CONFIGURABLE: Hover animation height (meters) and speed (seconds per cycle).
        // 0.02m = 2cm up/down, 1.0s = gentle bob. Increase for more dramatic float.
        let hover = SCNAction.sequence([
            SCNAction.moveBy(x: 0, y: 0.02, z: 0, duration: 1.0),
            SCNAction.moveBy(x: 0, y: -0.02, z: 0, duration: 1.0)
        ])
        sphereNode.runAction(SCNAction.repeatForever(hover))
    }
}

// MARK: - ARSessionDelegate
// Tracks world mapping status (notAvailable → limited → extending → mapped).
// The UI uses this to enable/disable the "Save Map" button — you need at least
// .mapped or .extending for a reliable world map save.

extension CaptureManager: ARSessionDelegate {
    nonisolated func session(_ session: ARSession, didUpdate frame: ARFrame) {
        let status = frame.worldMappingStatus
        Task { @MainActor [weak self] in
            guard let self else { return }
            self.worldMapStatus = status
        }
    }

    nonisolated func session(_ session: ARSession, didFailWithError error: any Error) {
        let message = error.localizedDescription
        Task { @MainActor [weak self] in
            self?.statusMessage = "Session error: \(message)"
        }
    }
}
