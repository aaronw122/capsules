import ARKit
import SceneKit
import UIKit

class ARWorldMapView: ARSCNView, ARSCNViewDelegate, ARSessionDelegate {

    private var isRelocalized = false
    var onCapsuleTapped: ((_ capsuleId: String) -> Void)?
    var onRelocalized: (() -> Void)?
    var onTrackingStateChanged: ((_ status: String) -> Void)?

    override init(frame: CGRect, options: [String: Any]? = nil) {
        super.init(frame: frame, options: options)
        self.delegate = self
        self.session.delegate = self
        self.autoenablesDefaultLighting = true
        self.automaticallyUpdatesLighting = true

        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        self.addGestureRecognizer(tapGesture)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Session

    func startSession() {
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        self.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        isRelocalized = false
    }

    func loadWorldMap(data: Data) {
        do {
            guard let worldMap = try NSKeyedUnarchiver.unarchivedObject(ofClass: ARWorldMap.self, from: data) else {
                print("[ARWorldMapView] Failed to decode world map")
                return
            }

            let config = ARWorldTrackingConfiguration()
            config.planeDetection = [.horizontal, .vertical]
            config.initialWorldMap = worldMap

            self.session.run(config, options: [.resetTracking, .removeExistingAnchors])
            isRelocalized = false
        } catch {
            print("[ARWorldMapView] Load world map error: \(error.localizedDescription)")
        }
    }

    // MARK: - Place capsules

    func placeCapsules(capsules: [[String: Any]]) {
        for capsule in capsules {
            guard let id = capsule["id"] as? String,
                  let position = capsule["position"] as? [Double],
                  position.count == 3 else { continue }

            let color = capsule["color"] as? String ?? "#FFD700"

            var transform = matrix_identity_float4x4
            transform.columns.3.x = Float(position[0])
            transform.columns.3.y = Float(position[1])
            transform.columns.3.z = Float(position[2])

            let anchor = ARAnchor(name: id, transform: transform)
            self.session.add(anchor: anchor)

            // Store color for use in renderer
            capsuleColors[id] = UIColor(hex: color)
        }
    }

    private var capsuleColors: [String: UIColor] = [:]

    // MARK: - Tap handling

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: self)
        let hitResults = hitTest(location, options: [
            SCNHitTestOption.searchMode: SCNHitTestSearchMode.all.rawValue
        ])

        for result in hitResults {
            // Walk up the node hierarchy to find one with a capsule name
            var node: SCNNode? = result.node
            while let current = node {
                if let name = current.name, !name.isEmpty {
                    onCapsuleTapped?(name)
                    return
                }
                node = current.parent
            }
        }
    }

    // MARK: - ARSCNViewDelegate

    func renderer(_ renderer: any SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
        guard let name = anchor.name, !name.isEmpty else { return }

        let color = capsuleColors[name] ?? .systemYellow

        let sphere = SCNSphere(radius: 0.05)
        sphere.firstMaterial?.diffuse.contents = color
        sphere.firstMaterial?.lightingModel = .physicallyBased

        let sphereNode = SCNNode(geometry: sphere)
        sphereNode.name = name
        node.addChildNode(sphereNode)

        let hover = SCNAction.sequence([
            SCNAction.moveBy(x: 0, y: 0.02, z: 0, duration: 1.0),
            SCNAction.moveBy(x: 0, y: -0.02, z: 0, duration: 1.0)
        ])
        sphereNode.runAction(SCNAction.repeatForever(hover))
    }

    // MARK: - ARSessionDelegate

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        let status = frame.worldMappingStatus

        switch status {
        case .mapped:
            onTrackingStateChanged?("mapped")
            if !isRelocalized {
                isRelocalized = true
                onRelocalized?()
            }
        case .extending:
            onTrackingStateChanged?("extending")
        case .limited:
            onTrackingStateChanged?("limited")
        case .notAvailable:
            onTrackingStateChanged?("notAvailable")
        @unknown default:
            onTrackingStateChanged?("unknown")
        }
    }

    func session(_ session: ARSession, didFailWithError error: any Error) {
        print("[ARWorldMapView] Session error: \(error.localizedDescription)")
    }
}

// MARK: - UIColor hex helper

extension UIColor {
    convenience init(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
        let g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
        let b = CGFloat(rgb & 0x0000FF) / 255.0

        self.init(red: r, green: g, blue: b, alpha: 1.0)
    }
}
