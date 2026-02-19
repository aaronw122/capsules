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

    override static func moduleName() -> String! {
        return "ARWorldMapModule"
    }

    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["onCapsuleTapped", "onRelocalized", "onTrackingStateChanged", "onViewReady"]
    }

    // Called by ARWorldMapViewManager to link the view
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

        // Notify JS that the native view is ready to receive commands
        self.sendEvent(withName: "onViewReady", body: nil)
    }

    @objc func startSession(_ worldMapBase64: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let view = self.arView else {
                print("[ARWorldMapModule] startSession failed — arView is nil")
                return
            }

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
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let view = self.arView else {
                print("[ARWorldMapModule] startSessionFromBundle failed — arView is nil")
                return
            }

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
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let view = self.arView else {
                print("[ARWorldMapModule] placeCapsules failed — arView is nil")
                return
            }
            guard let capsuleArray = capsules as? [[String: Any]] else {
                print("[ARWorldMapModule] placeCapsules failed — invalid capsule array format")
                return
            }
            view.placeCapsules(capsules: capsuleArray)
        }
    }
}
