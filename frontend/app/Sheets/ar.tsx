// ar.tsx
// AR screen — loads a world map from the app bundle, waits for relocalization,
// then places capsules at positions from positions.json.
//
// Flow: onViewReady → startSessionFromBundle('arworldmap.data') → ARKit relocalizes →
//       placeCapsules() → renderer renders spheres → tap fires JS event

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { ARWorldMapView } from '../native/ARWorldMapView';
import ARWorldMapModule from '../native/ARWorldMapModule';
import CapsuleDetail from '../components/CapsuleDetail';
import { NavigationProp } from '@react-navigation/native';
import { useGame } from '../context/gameContext';
import { useAR } from '../context/arContext';
import { Onboarding } from '../components/onboarding';
import { Hud } from '../components/hud';

export default function ARScreen({
  navigation,
}: {
  navigation: NavigationProp<any>;
}) {
  const game = useGame();

  console.log('game', game);

  const ar = useAR();

  if (!game) throw new Error('useGame didnt work');
  if (!ar) throw new Error('useAR didnt work');

const {
  capsules,
  selectedCapsule,
  setSelectedCapsule,
  openCapsule,
  gameState,
  } = game;
  const { localizeWorld, trackingStatus, relocalized } = ar;

  // Start AR session and listen for relocalization
  useEffect(() => {
    const cleanup = localizeWorld();
    return cleanup;
  }, []);

  // Place capsules in AR once relocalized and data is available
  useEffect(() => {
    if (relocalized && capsules.size > 0) {
      console.log('[ar.tsx] Placing', capsules.size, 'capsules in AR');
      ARWorldMapModule.placeCapsules(
        Array.from(capsules.values()).map(c => ({
          id: c.id,
          position: c.position,
          color: '#FFD700',
        })),
      );
    }
  }, [relocalized, capsules]);

  // Listen for capsule taps from native AR view
  useEffect(() => {
    const tapSub = ARWorldMapModule.onCapsuleTapped(e => {
      if (!capsules) return null;
      const capsule = capsules.get(e.capsuleId);
      if (capsule) {
        openCapsule(capsule);
      } else {
        console.warn(
          '[ar.tsx] Tapped capsule not found in backend data:',
          e.capsuleId,
        );
      }
    });

    return () => tapSub.remove();
  }, [capsules]);

  return (
    <View style={styles.container}>
      <ARWorldMapView style={styles.arView} />
      <View style={styles.overlay}>
        <Text style={styles.statusText}>Tracking: {trackingStatus}</Text>
        {gameState === 'playing' ? <Hud /> : <Onboarding />}
      </View>
      {selectedCapsule && (
        <CapsuleDetail
          capsule={selectedCapsule}
          onCollect={() => {
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
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    paddingVertical: 8,
  },
  statusText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
  },
});
