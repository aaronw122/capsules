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
        return ["onCapsuleTapped", "onRelocalized", "onTrackingStateChanged"]
    }

    // Called by ARWorldMapViewManager to link the view
    func setARView(_ view: ARWorldMapView) {
        self.arView = view

        view.onCapsuleTapped = { [weak self] capsuleId in
            self?.sendEvent(withName: "onCapsuleTapped", body: ["capsuleId": capsuleId])
        }

        view.onRelocalized = { [weak self] in
            self?.sendEvent(withName: "onRelocalized", body: nil)
        }

        view.onTrackingStateChanged = { [weak self] status in
            self?.sendEvent(withName: "onTrackingStateChanged", body: ["status": status])
        }
    }

    @objc func startSession(_ worldMapBase64: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let view = self.arView else { return }

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

    @objc func placeCapsules(_ capsules: NSArray) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let view = self.arView else { return }
            guard let capsuleArray = capsules as? [[String: Any]] else { return }
            view.placeCapsules(capsules: capsuleArray)
        }
    }
}
