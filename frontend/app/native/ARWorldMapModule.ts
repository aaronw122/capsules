// ARWorldMapModule.ts
// JS typed wrapper for the Swift ARWorldMapModule native module.
// This is the JS side of the React Native bridge — it exposes Swift methods
// as JS functions and Swift events as subscribable listeners.
//
// Methods (JS → Swift):
//   startSession(base64)   — starts AR session, optionally with a saved world map
//   placeCapsules(array)   — tells Swift to render capsule spheres at positions
//
// Events (Swift → JS):
//   onCapsuleTapped  — user tapped a capsule in AR, payload: { capsuleId: string }
//   onRelocalized    — device matched the saved world map to the physical space
//   onTrackingStateChanged — ARKit tracking status changed (mapped/limited/etc)
//
// The corresponding Swift code is in frontend/ios/CapsuleAR/ARWorldMapModule.swift
// ObjC bridge declarations are in frontend/ios/CapsuleAR/ARWorldMapModule.m

import { NativeModules, NativeEventEmitter } from 'react-native';

const { ARWorldMapModule } = NativeModules;
const emitter = new NativeEventEmitter(ARWorldMapModule);

export default {
  startSession: (worldMapBase64: string) =>
    ARWorldMapModule.startSession(worldMapBase64),

  startSessionFromBundle: (filename: string) =>
    ARWorldMapModule.startSessionFromBundle(filename),

  placeCapsules: (
    capsules: { id: string; position: number[]; color: string }[],
  ) => ARWorldMapModule.placeCapsules(capsules),

  onCapsuleTapped: (cb: (e: { capsuleId: string }) => void) =>
    emitter.addListener('onCapsuleTapped', cb),

  onRelocalized: (cb: () => void) => emitter.addListener('onRelocalized', cb),

  onTrackingStateChanged: (cb: (e: { status: string }) => void) =>
    emitter.addListener('onTrackingStateChanged', cb),
};
