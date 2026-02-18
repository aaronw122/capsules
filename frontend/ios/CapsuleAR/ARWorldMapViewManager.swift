// ARWorldMapViewManager.swift
// RCTViewManager subclass — tells React Native how to create ARWorldMapView
// instances. When JS renders <ARWorldMapView />, RN calls view() here.
//
// The key wiring step: after creating the view, it looks up the ARWorldMapModule
// singleton from the bridge and links them together via setARView(). This is
// how events flow from the view → module → JS.

import React

@objc(ARWorldMapViewManager)
class ARWorldMapViewManager: RCTViewManager {

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func view() -> UIView! {
        let arView = ARWorldMapView(frame: .zero)

        // Link the view to the module so events flow through
        if let module = self.bridge.module(for: ARWorldMapModule.self) as? ARWorldMapModule {
            module.setARView(arView)
        }

        return arView
    }
}
