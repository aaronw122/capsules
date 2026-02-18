// ARWorldMapViewManager.m
// ObjC bridge declaration for ARWorldMapViewManager.swift.
// React Native's bridge is Objective-C, so every Swift RCTViewManager needs
// this one-liner to be visible to the bridge. No methods to expose here —
// the view manager just creates the view.

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(ARWorldMapViewManager, RCTViewManager)
@end
