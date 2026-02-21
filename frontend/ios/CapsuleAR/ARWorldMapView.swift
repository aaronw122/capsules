// ARWorldMapView.swift
// The core AR view for the React Native app. Subclasses ARSCNView to provide:
//   - World map loading + relocalization (player returns to the mapped venue)
//   - Capsule rendering (colored spheres at positions from positions.json)
//   - Tap detection (SCNHitTest → walk node hierarchy → find capsule ID)
//
// This is the PLAY-mode counterpart to the capture tool's CaptureManager.
// The capture tool places capsules and saves the world map.
// This view loads that world map and renders capsules for players to find.
//
// Communication with JS is indirect — callbacks (onCapsuleTapped, onRelocalized,
// onTrackingStateChanged) are set by ARWorldMapModule.swift, which converts
// them to RCTEventEmitter events that cross the bridge to JS.
//

import ARKit
import AVFoundation
import SceneKit
import UIKit

class ARWorldMapView: ARSCNView, ARSCNViewDelegate, ARSessionDelegate {

    private var isRelocalized = false
    private var lastTrackingStatus: String = ""
    private var capsulesEnabled = false
    private var pendingAnchors: [(SCNNode, ARAnchor)] = []
    private var openedCapsuleIDs: Set<String> = []
    var onCameraPermissionDenied: (() -> Void)?

    private lazy var capsuleModelTemplate: SCNNode? = {
        guard let url = Bundle.main.url(forResource: "capsule_pin_glow", withExtension: "usdz"),
              let scene = try? SCNScene(url: url, options: nil) else {
            print("[ARWorldMapView] Failed to load capsule_pin_glow.usdz")
            return nil
        }
        return scene.rootNode
    }()

    private lazy var openedModelTemplate: SCNNode? = {
        guard let url = Bundle.main.url(forResource: "capsule_pin_opened", withExtension: "usdz"),
              let scene = try? SCNScene(url: url, options: nil) else {
            print("[ARWorldMapView] Failed to load capsule_pin_opened.usdz")
            return nil
        }
        return scene.rootNode
    }()
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

    // Session

    /// Checks camera permission before running the given block.
    /// Requests access if not yet determined, or fires onCameraPermissionDenied if denied.
    private func requireCamera(_ block: @escaping () -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            block()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    if granted {
                        block()
                    } else {
                        print("[ARWorldMapView] Camera permission denied by user")
                        self?.onCameraPermissionDenied?()
                    }
                }
            }
        default:
            print("[ARWorldMapView] Camera permission denied/restricted")
            onCameraPermissionDenied?()
        }
    }

    func startSession() {
        requireCamera { [weak self] in
            guard let self = self else { return }
            let config = ARWorldTrackingConfiguration()
            config.planeDetection = [.horizontal, .vertical]
            self.session.run(config, options: [.resetTracking, .removeExistingAnchors])
            self.isRelocalized = false
        }
    }

    func loadWorldMap(data: Data) {
        requireCamera { [weak self] in
            guard let self = self else { return }
            do {
                guard let worldMap = try NSKeyedUnarchiver.unarchivedObject(ofClass: ARWorldMap.self, from: data) else {
                    print("[ARWorldMapView] Failed to decode world map, starting without map")
                    self.startSession()
                    return
                }

                print("[ARWorldMapView] World map loaded with \(worldMap.anchors.count) anchor(s)")

                let config = ARWorldTrackingConfiguration()
                config.planeDetection = [.horizontal, .vertical]
                config.initialWorldMap = worldMap

                // .removeExistingAnchors clears anchors from the current session, then
                // ARKit loads the world map's anchors fresh — triggering didAdd for each.
                self.session.run(config, options: [.resetTracking, .removeExistingAnchors])
                self.isRelocalized = false
            } catch {
                print("[ARWorldMapView] Load world map error: \(error.localizedDescription), starting without map")
                self.startSession()
            }
        }
    }

    // Place capsules
    // Called from JS via ARWorldMapModule.placeCapsules().
    // Each capsule dict has { id: String, position: [Double], color: String }.
    // Creates an ARAnchor at each position — the renderer callback then
    // attaches a colored sphere. Colors are stored in capsuleColors dict
    // and looked up by anchor name in renderer(_:didAdd:for:).

    func placeCapsules(capsules: [[String: Any]]) {
        capsulesEnabled = true

        // Build set of valid capsule IDs from backend data
        knownCapsuleIDs = Set(capsules.compactMap { $0["id"] as? String })

        // Only render pending anchors that match a known capsule
        for (node, anchor) in pendingAnchors {
            if let name = anchor.name, knownCapsuleIDs.contains(name) {
                renderCapsule(on: node, for: anchor)
            }
        }
        pendingAnchors.removeAll()

        let existingNames = Set(self.session.currentFrame?.anchors.compactMap { $0.name } ?? [])
        for capsule in capsules {
            guard let id = capsule["id"] as? String,
                  let position = capsule["position"] as? [Double],
                  position.count == 3 else { continue }
            guard !existingNames.contains(id) else {
                print("[ARWorldMapView] Anchor already exists, skipping: \(id)")
                continue
            }

            if let isOpened = capsule["isOpened"] as? Bool, isOpened {
                openedCapsuleIDs.insert(id)
            }

            // CONFIGURABLE: Fallback color if capsule has no color defined in capsuleContent.json.
            // Gold (#FFD700) is the default. Change to match your game's theme.
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
    private var knownCapsuleIDs: Set<String> = []
    private var renderedAnchorIDs: Set<String> = []

    // Tap handling
    // Uses SceneKit hit testing (not ARKit raycasting) to find which 3D node
    // the user tapped. Walks up the node parent chain to find one with a name
    // (our capsule IDs are set as node.name). This handles the case where the
    // user taps a child node of the capsule's anchor node.

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: self)
        // CONFIGURABLE: searchMode .all checks every node. Use .closest for
        // better performance if you have many capsules (50+), but .all is safer
        // for small counts since it won't miss occluded spheres.
        let hitResults = hitTest(location, options: [
            SCNHitTestOption.searchMode: SCNHitTestSearchMode.all.rawValue
        ])

        for result in hitResults {
            // Walk up the node hierarchy to find one with a known capsule ID
            var node: SCNNode? = result.node
            while let current = node {
                if let name = current.name, renderedAnchorIDs.contains(name) {
                    onCapsuleTapped?(name)
                    return
                }
                node = current.parent
            }
        }
    }

    // ARSCNViewDelegate

    func renderer(_ renderer: any SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
        print("[ARWorldMapView] didAdd anchor: type=\(type(of: anchor)) name=\(anchor.name ?? "nil")")
        guard let name = anchor.name, !name.isEmpty else { return }

        if !capsulesEnabled {
            print("[ARWorldMapView] Capsules not enabled yet, queuing: \(name)")
            pendingAnchors.append((node, anchor))
            return
        }

        renderCapsule(on: node, for: anchor)
    }

    private func renderCapsule(on node: SCNNode, for anchor: ARAnchor) {
        guard let name = anchor.name, !name.isEmpty else { return }
        guard knownCapsuleIDs.isEmpty || knownCapsuleIDs.contains(name) else {
            print("[ARWorldMapView] Skipping unknown anchor: \(name)")
            return
        }
        guard !renderedAnchorIDs.contains(name) else {
            print("[ARWorldMapView] Skipping duplicate anchor: \(name)")
            return
        }
        renderedAnchorIDs.insert(name)

        let isOpened = openedCapsuleIDs.contains(name)

        if isOpened {
            print("[ARWorldMapView] Rendering opened capsule for: \(name)")
            addOpenedNode(to: node, name: name)
        } else {
            print("[ARWorldMapView] Rendering unopened capsule (USDZ) for: \(name)")
            addUSDZNode(to: node, name: name)
        }
    }

    private func addOpenedNode(to node: SCNNode, name: String) {
        guard let template = openedModelTemplate else {
            print("[ARWorldMapView] Opened USDZ template unavailable, falling back to sphere for: \(name)")
            // Fallback to simple sphere if USDZ missing
            let sphere = SCNSphere(radius: 0.05)
            sphere.firstMaterial?.diffuse.contents = capsuleColors[name] ?? .systemYellow
            sphere.firstMaterial?.lightingModel = .physicallyBased
            let sphereNode = SCNNode(geometry: sphere)
            sphereNode.name = name
            node.addChildNode(sphereNode)
            return
        }

        let modelNode = template.clone()
        modelNode.name = name
        modelNode.scale = SCNVector3(0.29, 0.29, 0.29)
        node.addChildNode(modelNode)

        let hover = SCNAction.sequence([
            SCNAction.moveBy(x: 0, y: 0.02, z: 0, duration: 1.0),
            SCNAction.moveBy(x: 0, y: -0.02, z: 0, duration: 1.0)
        ])
        modelNode.runAction(SCNAction.repeatForever(hover))
    }

    private func addUSDZNode(to node: SCNNode, name: String) {
        guard let template = capsuleModelTemplate else {
            print("[ARWorldMapView] USDZ template unavailable, falling back to sphere for: \(name)")
            let sphere = SCNSphere(radius: 0.05)
            sphere.firstMaterial?.diffuse.contents = capsuleColors[name] ?? .systemYellow
            sphere.firstMaterial?.lightingModel = .physicallyBased
            let sphereNode = SCNNode(geometry: sphere)
            sphereNode.name = name
            node.addChildNode(sphereNode)
            return
        }

        let modelNode = template.clone()
        modelNode.name = name
        modelNode.scale = SCNVector3(0.25, 0.25, 0.25)
        node.addChildNode(modelNode)

        let hover = SCNAction.sequence([
            SCNAction.moveBy(x: 0, y: 0.02, z: 0, duration: 1.0),
            SCNAction.moveBy(x: 0, y: -0.02, z: 0, duration: 1.0)
        ])
        modelNode.runAction(SCNAction.repeatForever(hover))
    }

    func markCapsuleOpened(_ capsuleId: String) {
        openedCapsuleIDs.insert(capsuleId)

        // Find the node for this capsule and swap unopened → opened model
        guard let frame = self.session.currentFrame else { return }
        for anchor in frame.anchors {
            guard anchor.name == capsuleId else { continue }
            self.scene.rootNode.enumerateChildNodes { node, stop in
                if node.name == capsuleId {
                    guard let parentNode = node.parent else { return }
                    node.removeFromParentNode()
                    self.addOpenedNode(to: parentNode, name: capsuleId)
                    stop.pointee = true
                }
            }
            break
        }
    }

    // ARSessionDelegate

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        let mappingStatus = frame.worldMappingStatus

        let statusStr: String
        switch mappingStatus {
        case .mapped: statusStr = "mapped"
        case .extending: statusStr = "extending"
        case .limited: statusStr = "limited"
        case .notAvailable: statusStr = "notAvailable"
        @unknown default: statusStr = "unknown"
        }

        // Only fire the event when the status actually changes (not every frame)
        if statusStr != lastTrackingStatus {
            lastTrackingStatus = statusStr
            onTrackingStateChanged?(statusStr)
        }
    }

    // Relocalization is detected via camera tracking state, not world mapping status.
    // When a world map is loaded, ARKit enters .limited/.relocalizing while it tries
    // to match features. Once it succeeds, tracking transitions to .normal — that's
    // when the coordinate system is aligned to the captured space.
    func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
        switch camera.trackingState {
        case .normal:
            if !isRelocalized {
                isRelocalized = true
                print("[ARWorldMapView] Relocalized — coordinate system aligned")
                onRelocalized?()
            }
        case .limited(let reason):
            if reason == .relocalizing {
                print("[ARWorldMapView] Relocalizing — point at the captured area")
            }
        default:
            break
        }
    }

    func session(_ session: ARSession, didFailWithError error: any Error) {
        print("[ARWorldMapView] Session error: \(error.localizedDescription)")
    }
}

// UIColor hex helper
// Converts hex color strings from capsuleContent.json (e.g. "#FF6B6B") to UIColor.

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
