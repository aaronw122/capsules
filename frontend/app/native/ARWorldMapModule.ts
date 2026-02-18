import { NativeModules, NativeEventEmitter } from 'react-native';

const { ARWorldMapModule } = NativeModules;
const emitter = new NativeEventEmitter(ARWorldMapModule);

export default {
  startSession: (worldMapBase64: string) =>
    ARWorldMapModule.startSession(worldMapBase64),

  placeCapsules: (
    capsules: { id: string; position: number[]; color: string }[]
  ) => ARWorldMapModule.placeCapsules(capsules),

  onCapsuleTapped: (cb: (e: { capsuleId: string }) => void) =>
    emitter.addListener('onCapsuleTapped', cb),

  onRelocalized: (cb: () => void) =>
    emitter.addListener('onRelocalized', cb),

  onTrackingStateChanged: (cb: (e: { status: string }) => void) =>
    emitter.addListener('onTrackingStateChanged', cb),
};
