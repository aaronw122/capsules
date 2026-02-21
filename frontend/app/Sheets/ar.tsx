// ar.tsx
// AR screen — loads a world map from the app bundle, waits for relocalization,
// then places capsules at positions from positions.json.
//
// Flow: startSessionFromBundle('arworldmap.data') (queued if view not ready) → ARKit relocalizes →
//       placeCapsules() → renderer renders spheres → tap fires JS event

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, Linking } from 'react-native';
import { ARWorldMapView } from '../native/ARWorldMapView';
import ARWorldMapModule from '../native/ARWorldMapModule';
import CapsuleDetail from '../components/CapsuleDetail';
import { NavigationProp } from '@react-navigation/native';
import { useGame } from '../context/gameContext';
import { useAR } from '../context/arContext';
import { Onboarding } from '../components/onboarding';
import { Hud } from '../components/hud';
import Countdown from '../components/Countdown';
import GameEndOverlay from '../components/GameEndOverlay';

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
    endResult,
    winCompletedAt,
    triggerLocalGameOver,
  } = game;
  const { localizeWorld, trackingStatus, relocalized, cameraPermissionDenied } =
    ar;

  // Countdown state and refs
  const [showCountdown, setShowCountdown] = useState(false);
  const showCountdownRef = useRef(false);
  const countdownShownRef = useRef(gameState === 'playing');
  const endResultRef = useRef(endResult);

  // Sync endResultRef with endResult state
  useEffect(() => {
    endResultRef.current = endResult;
  }, [endResult]);

  const goToLeaderboard = () => {
    navigation.reset({ index: 0, routes: [{ name: 'LeaderBoard' }] });
  };

  // Start AR session and listen for relocalization
  useEffect(() => {
    const cleanup = localizeWorld();
    return cleanup;
  }, []);

  // Trigger countdown when game starts
  useEffect(() => {
    if (gameState === 'playing' && !countdownShownRef.current) {
      setShowCountdown(true);
      showCountdownRef.current = true;
      countdownShownRef.current = true;
    }
  }, [gameState]);

  // Place capsules in AR once relocalized and data is available
  useEffect(() => {
    if (relocalized && capsules.size > 0 && gameState === 'playing') {
      console.log('[ar.tsx] Placing', capsules.size, 'capsules in AR');
      ARWorldMapModule.placeCapsules(
        Array.from(capsules.values()).map(c => ({
          id: c.id,
          position: c.position,
          color: '#FFD700',
          isOpened: c.isOpened,
        })),
      );
    }
  }, [relocalized, capsules, gameState]);

  // Listen for capsule taps from native AR view
  useEffect(() => {
    const tapSub = ARWorldMapModule.onCapsuleTapped(e => {
      if (
        !capsules ||
        showCountdownRef.current ||
        endResultRef.current !== null
      )
        return;
      const capsule = capsules.get(e.capsuleId);
      if (capsule) {
        openCapsule(capsule);
        ARWorldMapModule.markCapsuleOpened(capsule.id);
      } else {
        console.warn(
          '[ar.tsx] Tapped capsule not found in backend data:',
          e.capsuleId,
        );
      }
    });

    return () => tapSub.remove();
  }, [capsules]);

  if (cameraPermissionDenied) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          This app needs camera access for AR. Please enable it in Settings.
        </Text>
        <Button title="Open Settings" onPress={() => Linking.openSettings()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ARWorldMapView style={styles.arView} />
      {showCountdown && (
        <Countdown
          onComplete={() => {
            setShowCountdown(false);
            showCountdownRef.current = false;
          }}
        />
      )}
      <View style={styles.overlay}>
        <Text style={styles.statusText}>Tracking: {trackingStatus}</Text>
        {endResult === null &&
          (gameState === 'playing' ? (
            <Hud onTimeUp={triggerLocalGameOver} />
          ) : (
            <Onboarding />
          ))}
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
      {endResult !== null && (
        <GameEndOverlay
          type={endResult}
          completedAt={winCompletedAt}
          onViewLeaderboard={goToLeaderboard}
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    padding: 32,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  permissionText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});
