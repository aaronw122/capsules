// CapsuleAR-Bridging-Header.h
// Required by Xcode when Swift and ObjC coexist in the same target.
// These imports let the Swift files (ARWorldMapModule.swift, etc.) use
// React Native's ObjC base classes (RCTEventEmitter, RCTViewManager, etc.).
//
// To wire this up in Xcode: Build Settings → Swift Compiler →
// Objective-C Bridging Header → "CapsuleAR/CapsuleAR-Bridging-Header.h"

#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>
