// ar.tsx
// AR screen — loads a world map from the app bundle, waits for relocalization,
// then places capsules at positions from positions.json.
//
// Flow: onViewReady → startSessionFromBundle('arworldmap.data') → ARKit relocalizes →
//       placeCapsules() → renderer renders spheres → tap fires JS event

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ARWorldMapView } from '../native/ARWorldMapView';
import ARWorldMapModule from '../native/ARWorldMapModule';
import CapsuleDetail from '../components/CapsuleDetail';
import Config from 'react-native-config';
import type { Capsule } from '../types';

export default function ARScreen() {
  const [trackingStatus, setTrackingStatus] = useState('initializing');
  const [relocalized, setRelocalized] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [capsulesMap, setCapsulesMap] = useState<Map<string, Capsule>>(
    new Map(),
  );

  // Fetch capsules from backend on mount
  useEffect(() => {
    const viewReadySub = ARWorldMapModule.onViewReady(() => {
      console.log('[ar.tsx] Native view ready, loading world map');
      ARWorldMapModule.startSessionFromBundle('arworldmap.data');
    });

    const relocalSub = ARWorldMapModule.onRelocalized(() => {
      console.log('[ar.tsx] Relocalized');
      setRelocalized(true);
    });

    const trackingSub = ARWorldMapModule.onTrackingStateChanged(e => {
      setTrackingStatus(e.status);
    });

    // Fetch real capsule data from backend
    const fetchCapsules = async () => {
      try {
        const response = await fetch(`${Config.BASE_URL}/capsules`);
        const data: Capsule[] = await response.json();
        const map = new Map(data.map(c => [c.id, c]));
        setCapsulesMap(map);
        console.log(`[ar.tsx] Fetched ${data.length} capsules from backend`);
      } catch (err) {
        console.error('[ar.tsx] Failed to fetch capsules:', err);
      }
    };
    fetchCapsules();

    return () => {
      viewReadySub.remove();
      relocalSub.remove();
      trackingSub.remove();
    };
  }, []);

  // Tap handler — re-subscribes when capsulesMap updates so the
  // closure always has the latest data
  useEffect(() => {
    const tapSub = ARWorldMapModule.onCapsuleTapped(e => {
      const capsule = capsulesMap.get(e.capsuleId);
      if (capsule) {
        setSelectedCapsule(capsule);
      } else {
        console.warn(
          '[ar.tsx] Tapped capsule not found in backend data:',
          e.capsuleId,
        );
      }
    });

    return () => tapSub.remove();
  }, [capsulesMap]);

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
