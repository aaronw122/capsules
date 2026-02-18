// ar.tsx
// AR integration test screen. Proves the full Swift → bridge → JS chain works:
//   1. Renders <ARWorldMapView /> (live AR camera from Swift)
//   2. Places 3 test capsules at hardcoded positions via ARWorldMapModule
//   3. Listens for onCapsuleTapped — shows JS Alert with the capsule ID
//   4. Shows tracking/relocalization status as a text overlay
//
// This is a throwaway test screen — Aaron replaces it with the real game UI.
// Once this works, the architecture is proven: tapping a sphere in AR fires
// an event that crosses the native bridge and arrives in JavaScript.
//
// To test with a real world map: replace '' in startSession() with a base64-
// encoded arworldmap.data from the capture tool, and use real positions from
// frontend/data/positions.json instead of TEST_CAPSULES.

import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { ARWorldMapView } from '../native/ARWorldMapView';
import ARWorldMapModule from '../native/ARWorldMapModule';

// Hardcoded test data — positions in meters relative to AR session origin.
// Replace with loadCapsules().forSwift from capsuleLoader.ts for real data.
const TEST_CAPSULES = [
  { id: 'test-1', position: [0.5, 0.0, -1.0], color: '#FFD700' },
  { id: 'test-2', position: [-0.5, 0.0, -2.0], color: '#FF6B6B' },
  { id: 'test-3', position: [0.0, 0.5, -1.5], color: '#4ECDC4' },
];

export default function ARScreen() {
  const [trackingStatus, setTrackingStatus] = useState('initializing');
  const [relocalized, setRelocalized] = useState(false);

  useEffect(() => {
    // Start session with empty string = no world map, just raw AR
    ARWorldMapModule.startSession('');

    // Place test capsules at hardcoded positions
    ARWorldMapModule.placeCapsules(TEST_CAPSULES);

    const tapSub = ARWorldMapModule.onCapsuleTapped(e => {
      Alert.alert('Capsule Tapped', `ID: ${e.capsuleId}`);
    });

    const relocalSub = ARWorldMapModule.onRelocalized(() => {
      setRelocalized(true);
    });

    const trackingSub = ARWorldMapModule.onTrackingStateChanged(e => {
      setTrackingStatus(e.status);
    });

    return () => {
      tapSub.remove();
      relocalSub.remove();
      trackingSub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ARWorldMapView style={styles.arView} />
      <View style={styles.overlay}>
        <Text style={styles.statusText}>Tracking: {trackingStatus}</Text>
        <Text style={styles.statusText}>
          Relocalized: {relocalized ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  arView: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
  },
  statusText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
  },
});
