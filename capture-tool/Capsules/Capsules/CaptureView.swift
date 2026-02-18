// CaptureView.swift
// SwiftUI UI for the capture tool. Combines three responsibilities:
//   1. CaptureView — main screen with status bar + control buttons
//   2. ARViewContainer — UIViewRepresentable that bridges ARSCNView into SwiftUI
//   3. ShareSheet — UIActivityViewController wrapper for AirDropping files
//
// Ported from prototype's ContentView.swift + ARViewContainer.swift.
// Removed: mode picker (always capture), "Reload Map" button.
// Added: "Export Positions" and "Share Files" buttons.
//
// Button layout at bottom of screen:
//   [Save Map]     [Export Positions]
//   [Share Files]  [Reset]

import SwiftUI
import ARKit

struct CaptureView: View {
    @StateObject private var manager = CaptureManager()
    @State private var showingShareSheet = false

    var body: some View {
        ZStack {
            ARViewContainer(manager: manager)
                .ignoresSafeArea()

            VStack {
                // Status bar
                VStack(spacing: 4) {
                    Text(manager.statusMessage)
                        .font(.system(.callout, design: .monospaced))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    HStack(spacing: 16) {
                        Text("Mapping: \(mappingStatusLabel)")
                        Text("Capsules: \(manager.anchorsPlaced)")
                    }
                    .font(.system(.caption, design: .monospaced))
                    .foregroundColor(.secondary)
                }
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity)
                .background(.ultraThinMaterial)

                Spacer()

                // Controls
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        Button(action: { manager.saveWorldMap() }) {
                            Label("Save Map", systemImage: "square.and.arrow.down")
                                .font(.headline)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(canSave ? Color.green : Color.gray)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                        .disabled(!canSave)

                        Button(action: { manager.exportPositions() }) {
                            Label("Export Positions", systemImage: "doc.text")
                                .font(.headline)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(manager.placedCapsules.isEmpty ? Color.gray : Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                        .disabled(manager.placedCapsules.isEmpty)
                    }

                    HStack(spacing: 12) {
                        Button(action: { showingShareSheet = true }) {
                            Label("Share Files", systemImage: "square.and.arrow.up")
                                .font(.headline)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }

                        Button(action: { manager.startSession() }) {
                            Label("Reset", systemImage: "arrow.counterclockwise")
                                .font(.headline)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.red.opacity(0.8))
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .background(.ultraThinMaterial)
            }
        }
        .onAppear {
            manager.startSession()
        }
        .sheet(isPresented: $showingShareSheet) {
            ShareSheet(items: manager.getShareItems())
        }
    }

    private var canSave: Bool {
        manager.worldMapStatus == .mapped || manager.worldMapStatus == .extending
    }

    private var mappingStatusLabel: String {
        switch manager.worldMapStatus {
        case .notAvailable: "N/A"
        case .limited: "Limited"
        case .extending: "Extending"
        case .mapped: "Mapped"
        @unknown default: "Unknown"
        }
    }
}

// MARK: - AR View Container
// Bridges ARKit's ARSCNView (UIKit) into SwiftUI. The Coordinator handles
// the tap gesture and forwards it to CaptureManager.handleTap(at:).

struct ARViewContainer: UIViewRepresentable {
    let manager: CaptureManager

    func makeUIView(context: Context) -> ARSCNView {
        let sceneView = manager.sceneView
        manager.setupDelegates()

        let tapGesture = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        sceneView.addGestureRecognizer(tapGesture)

        return sceneView
    }

    func updateUIView(_ uiView: ARSCNView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(manager: manager)
    }

    class Coordinator: NSObject {
        let manager: CaptureManager

        init(manager: CaptureManager) {
            self.manager = manager
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            let point = gesture.location(in: manager.sceneView)
            manager.handleTap(at: point)
        }
    }
}

// MARK: - Share Sheet
// Wraps UIActivityViewController for SwiftUI. Used to AirDrop arworldmap.data
// and positions.json to the dev Mac after a capture session.

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
