// ar.tsx
// AR screen — loads a world map from the app bundle, waits for relocalization,
// then places capsules at positions from positions.json.
//
// Flow: onViewReady → startSessionFromBundle('arworldmap.data') → ARKit relocalizes →
//       placeCapsules() → renderer renders spheres → tap fires JS event

import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { ARWorldMapView } from '../native/ARWorldMapView';
import ARWorldMapModule from '../native/ARWorldMapModule';
import { loadCapsules } from '../game/capsuleLoader';
import CapsuleDetail from '../components/CapsuleDetail';
import type { Capsule } from '../types';

export default function ARScreen() {
  const [trackingStatus, setTrackingStatus] = useState('initializing');
  const [relocalized, setRelocalized] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);

  useEffect(() => {
    // Wait for the native AR view to be linked before sending commands.
    // Without this, startSessionFromBundle may fire before arView is set,
    // causing it to silently fail (arView is nil).
    const viewReadySub = ARWorldMapModule.onViewReady(() => {
      console.log('[ar.tsx] Native view ready, loading world map');
      ARWorldMapModule.startSessionFromBundle('arworldmap.data');
    });

    // Update based on Capsule opening
    const tapSub = ARWorldMapModule.onCapsuleTapped(e => {
      // Mock data until backend endpoint is ready - check with Beckham
      const mockCapsule: Capsule = {
        id: e.capsuleId,
        letter: 'F',
        number: 1,
        isOpened: false,
        content: {
          name: 'Beckham',
          funFact: 'Once debugged a production issue while skydiving',
        },
      };
      setSelectedCapsule(mockCapsule);
    });

    const relocalSub = ARWorldMapModule.onRelocalized(() => {
      console.log('[ar.tsx] Relocalized, placing capsules');
      const { forSwift } = loadCapsules();
      ARWorldMapModule.placeCapsules(forSwift);
      setRelocalized(true);
    });

    const trackingSub = ARWorldMapModule.onTrackingStateChanged(e => {
      setTrackingStatus(e.status);
    });

    return () => {
      viewReadySub.remove();
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
      {selectedCapsule && (
        <CapsuleDetail
          capsule={selectedCapsule}
          onCollect={id => {
            console.log('Collected:', id);
            setSelectedCapsule(null);
          }}
          onDismiss={() => setSelectedCapsule(null)}
        />
      )}
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
