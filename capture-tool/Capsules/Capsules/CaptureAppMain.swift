// CaptureAppMain.swift
// Entry point for the standalone Capture Tool app.
// This is a dev-only tool (never goes to TestFlight) used by Erik to scan
// venues and place capsule positions. It produces two output files:
//   - arworldmap.data  (serialized ARWorldMap for relocalization)
//   - positions.json   (capsule UUIDs + [x,y,z] coordinates)
// These files are AirDropped to the repo and consumed by the main RN app.
//
// Ported from prototype at: ARWorldMapTest/ARWorldMapTest/
// Key difference from prototype: capture-only (no play/relocalize mode).

import SwiftUI

@main
struct CaptureAppMain: App {
    var body: some Scene {
        WindowGroup {
            CaptureView()
        }
    }
}
