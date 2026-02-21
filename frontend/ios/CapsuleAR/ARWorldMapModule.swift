// ARWorldMapModule.swift
// React Native native module — the Swift side of the JS bridge.
// This is an RCTEventEmitter, meaning it can both:
//   - Receive method calls from JS (startSession, placeCapsules)
//   - Send events to JS (onCapsuleTapped, onRelocalized, onTrackingStateChanged)
//
// It holds a reference to the ARWorldMapView instance (set by ARWorldMapViewManager
// when the view is created) and forwards method calls to it. Events flow the
// other direction: the view calls closures, this module converts them to
// sendEvent() calls that cross the bridge.
//
// ObjC bridge declarations are in ARWorldMapModule.m (required by RN architecture).

import Foundation
import React

@objc(ARWorldMapModule)
class ARWorldMapModule: RCTEventEmitter {

    private var arView: ARWorldMapView?
    private var pendingCommands: [() -> Void] = []

    override static func moduleName() -> String! {
        return "ARWorldMapModule"
    }

    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["onCapsuleTapped", "onRelocalized", "onTrackingStateChanged", "onCameraPermissionDenied"]
    }

    // Called by ARWorldMapViewManager to link the view.
    // If JS already called methods before the view was ready,
    // they'll be queued in pendingCommands and replayed now.
    func setARView(_ view: ARWorldMapView) {
        self.arView = view
        print("[ARWorldMapModule] AR view linked")

        view.onCapsuleTapped = { [weak self] capsuleId in
            self?.sendEvent(withName: "onCapsuleTapped", body: ["capsuleId": capsuleId])
        }

        view.onRelocalized = { [weak self] in
            self?.sendEvent(withName: "onRelocalized", body: nil)
        }

        view.onTrackingStateChanged = { [weak self] status in
            self?.sendEvent(withName: "onTrackingStateChanged", body: ["status": status])
        }

        view.onCameraPermissionDenied = { [weak self] in
            self?.sendEvent(withName: "onCameraPermissionDenied", body: nil)
        }

        // Replay any commands that arrived before the view was ready
        let commands = pendingCommands
        pendingCommands.removeAll()
        for command in commands {
            print("[ARWorldMapModule] Replaying queued command")
            command()
        }
    }

    @objc func startSession(_ worldMapBase64: String) {
        runOnView { view in
            if worldMapBase64.isEmpty {
                view.startSession()
            } else {
                guard let data = Data(base64Encoded: worldMapBase64) else {
                    print("[ARWorldMapModule] Invalid base64 world map data")
                    return
                }
                view.loadWorldMap(data: data)
            }
        }
    }

    @objc func startSessionFromBundle(_ filename: String) {
        runOnView { view in
            guard let url = Bundle.main.url(forResource: filename, withExtension: nil),
                  let data = try? Data(contentsOf: url) else {
                print("[ARWorldMapModule] No bundled world map '\(filename)' found, starting without map")
                view.startSession()
                return
            }
            print("[ARWorldMapModule] Loading bundled world map: \(filename)")
            view.loadWorldMap(data: data)
        }
    }

    @objc func placeCapsules(_ capsules: NSArray) {
        runOnView { view in
            guard let capsuleArray = capsules as? [[String: Any]] else {
                print("[ARWorldMapModule] placeCapsules failed — invalid capsule array format")
                return
            }
            view.placeCapsules(capsules: capsuleArray)
        }
    }

    @objc func markCapsuleOpened(_ capsuleId: String) {
        runOnView { view in
            view.markCapsuleOpened(capsuleId)
        }
    }

    /// Runs a block on the main queue with the AR view. If the view isn't
    /// linked yet, the block is queued and replayed when setARView is called.
    private func runOnView(_ block: @escaping (ARWorldMapView) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let view = self.arView {
                block(view)
            } else {
                print("[ARWorldMapModule] View not ready, queuing command")
                self.pendingCommands.append { [weak self] in
                    guard let view = self?.arView else { return }
                    block(view)
                }
            }
        }
    }
}
