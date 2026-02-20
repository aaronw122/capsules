// ar.tsx
// AR screen — loads a world map from the app bundle, waits for relocalization,
// then places capsules at positions from positions.json.
//
// Flow: onViewReady → startSessionFromBundle('arworldmap.data') → ARKit relocalizes →
//       placeCapsules() → renderer renders spheres → tap fires JS event

import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Button } from 'react-native';
//import map view and map module
import { ARWorldMapView } from '../native/ARWorldMapView';
import ARWorldMapModule from '../native/ARWorldMapModule';
import CapsuleDetail from '../components/CapsuleDetail';
import Config from 'react-native-config';
import type { Capsule } from '../types';
import { NavigationProp } from '@react-navigation/native';
import { GameProvider, useGame } from '../context/gameContext';

export default function ARScreen({
  navigation,
}: {
  navigation: NavigationProp<any>;
}) {
  const [trackingStatus, setTrackingStatus] = useState('initializing');
  const [relocalized, setRelocalized] = useState(false);
  // const [capsules, setCapsules] = useState<null | Capsule[]>(null);

  const game = useGame();

  if (!game) throw new Error('useGame didnt work');

  const {
    capsules,
    selectedCapsule,
    setSelectedCapsule,
    openCapsule,
    gameState,
    escapePhrase,
    leaderBoard,
  } = game;

  useEffect(() => {
    console.log('gameState changed: ', gameState);

    const capsule1 = {
      id: '1',
      letter: 'F',
      number: 1,
      isOpened: false,
      position: [2, 2, 2],
      content: {
        name: 'string',
        funFact: 'string',
      },
    };
    openCapsule(capsule1);
    console.log('leaderboard after open capsule: ', leaderBoard);
    console.log('escapePhrase after open capsule: ', escapePhrase);
    console.log('selected capsule open status: ', selectedCapsule?.isOpened);
  }, [gameState]);

  // Fetch capsules from backend on mount
  // capsules is in useContext, accesible across all components, cleaner than leaving here.
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

    return () => {
      viewReadySub.remove();
      relocalSub.remove();
      trackingSub.remove();
    };
  }, []);

  // sets up a listener so when capsule is tapped, sets selected capsule, and then can be opened
  useEffect(() => {
    const tapSub = ARWorldMapModule.onCapsuleTapped(e => {
      if (!capsules) return null;
      const capsule = capsules.find(el => el.id === e.capsuleId);
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
        <Text style={styles.statusText}>
          {relocalized
            ? 'Game will begin shortly...'
            : 'Move your phone slowly to scan the area'}
        </Text>
        <Button
          onPress={() => navigation.navigate('LeaderBoard')}
          title="test leaderboard"
        />
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
