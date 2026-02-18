import ARKit
import Combine
import SceneKit

struct CapsulePosition: Codable {
    let id: String
    let position: [Float]  // [x, y, z]
}

class CaptureManager: NSObject, ObservableObject {

    let sceneView = ARSCNView()

    @Published var statusMessage = "Point at surfaces. Tap to place capsules."
    @Published var worldMapStatus: ARFrame.WorldMappingStatus = .notAvailable
    @Published var anchorsPlaced = 0
    @Published var placedCapsules: [CapsulePosition] = []

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
        config.planeDetection = [.horizontal, .vertical]
        sceneView.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        anchorsPlaced = 0
        placedCapsules = []
        statusMessage = "Point at surfaces. Tap to place capsules."
    }

    // MARK: - Place capsule

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

extension CaptureManager: ARSCNViewDelegate {
    nonisolated func renderer(_ renderer: any SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
        guard anchor.name != nil, anchor.name != "" else { return }

        let colors: [UIColor] = [
            .systemRed, .systemBlue, .systemGreen, .systemYellow,
            .systemOrange, .systemPurple, .systemPink, .systemCyan
        ]
        let colorIndex = abs(anchor.hash) % colors.count

        let sphere = SCNSphere(radius: 0.05)
        sphere.firstMaterial?.diffuse.contents = colors[colorIndex]
        sphere.firstMaterial?.lightingModel = .physicallyBased

        let sphereNode = SCNNode(geometry: sphere)
        node.addChildNode(sphereNode)

        let hover = SCNAction.sequence([
            SCNAction.moveBy(x: 0, y: 0.02, z: 0, duration: 1.0),
            SCNAction.moveBy(x: 0, y: -0.02, z: 0, duration: 1.0)
        ])
        sphereNode.runAction(SCNAction.repeatForever(hover))
    }
}

// MARK: - ARSessionDelegate

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
