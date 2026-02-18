// ARWorldMapModule.m
// ObjC bridge declaration for ARWorldMapModule.swift.
// Each RCT_EXTERN_METHOD maps a JS function call to a Swift method.
// Parameter types must match: NSString* for strings, NSArray* for arrays.
// If you add a new Swift method that JS needs to call, add it here too.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ARWorldMapModule, RCTEventEmitter)
RCT_EXTERN_METHOD(startSession:(NSString *)worldMapBase64)
RCT_EXTERN_METHOD(placeCapsules:(NSArray *)capsules)
@end
