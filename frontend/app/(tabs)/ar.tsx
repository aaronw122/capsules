// ar.tsx
// AR screen — loads a world map from the app bundle. Capsule anchors are
// embedded inside the ARWorldMap itself (saved during capture), so ARKit
// restores them automatically at the correct positions during relocalization.
// No need to call placeCapsules() — the renderer fires for each restored anchor.
//
// Flow: startSessionFromBundle('arworldmap.data') → ARKit relocalizes →
//       anchors restored → renderer renders spheres → tap fires JS event

import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
//import map view and map module
import { ARWorldMapView } from '../native/ARWorldMapView';
import ARWorldMapModule from '../native/ARWorldMapModule';

export default function ARScreen() {
  const [trackingStatus, setTrackingStatus] = useState('initializing');
  const [relocalized, setRelocalized] = useState(false);

  useEffect(() => {
    // Load world map from app bundle — anchors are inside the map and will
    // be restored by ARKit during relocalization. Falls back to plain AR
    // if no world map is bundled.
    ARWorldMapModule.startSessionFromBundle('arworldmap.data');

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
