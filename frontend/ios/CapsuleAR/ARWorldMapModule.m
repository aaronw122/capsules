#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ARWorldMapModule, RCTEventEmitter)
RCT_EXTERN_METHOD(startSession:(NSString *)worldMapBase64)
RCT_EXTERN_METHOD(placeCapsules:(NSArray *)capsules)
@end
