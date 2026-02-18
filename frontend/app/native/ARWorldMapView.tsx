// ARWorldMapView.tsx
// Registers the Swift ARWorldMapView (ARSCNView subclass) as a React Native
// component. Use it like: <ARWorldMapView style={{ flex: 1 }} />
//
// This renders the live AR camera feed with capsule spheres overlaid.
// It does NOT accept props — all control is done imperatively through
// ARWorldMapModule.ts (startSession, placeCapsules).
//
// The native view is defined in frontend/ios/CapsuleAR/ARWorldMapView.swift
// and exposed to RN by frontend/ios/CapsuleAR/ARWorldMapViewManager.swift

import { requireNativeComponent } from 'react-native';

export const ARWorldMapView = requireNativeComponent('ARWorldMapView');
