import React

@objc(ARWorldMapViewManager)
class ARWorldMapViewManager: RCTViewManager {

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func view() -> UIView! {
        let arView = ARWorldMapView()

        // Link the view to the module so events flow through
        if let module = self.bridge.module(for: ARWorldMapModule.self) as? ARWorldMapModule {
            module.setARView(arView)
        }

        return arView
    }
}
