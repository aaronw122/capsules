import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const andrewImage = require('../assets/andrew.jpeg');

const FIGURE_HEIGHT = 180;
const FIGURE_WIDTH = 140;
const BEAM_HEIGHT = 40;
const BASE_WIDTH = 130;
const BASE_HEIGHT = 18;

export function HologramProjector() {
  const beamOpacity = useSharedValue(0.3);
  const figureOpacity = useSharedValue(0.8);
  const scanLineY = useSharedValue(0);

  useEffect(() => {
    // Beam pulse
    beamOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Figure flicker — mostly stable with occasional glitch dips
    figureOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 2000 }),
        withTiming(0.4, { duration: 80 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(1.0, { duration: 1500 }),
        withTiming(0.5, { duration: 60 }),
        withTiming(0.85, { duration: 120 }),
        withTiming(1.0, { duration: 2500 }),
      ),
      -1,
      false,
    );

    // Scan line sweep top to bottom
    scanLineY.value = withRepeat(
      withTiming(FIGURE_HEIGHT, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const beamStyle = useAnimatedStyle(() => ({
    opacity: beamOpacity.value,
  }));

  const figureStyle = useAnimatedStyle(() => ({
    opacity: figureOpacity.value,
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Holographic figure */}
      <Animated.View style={[styles.figureContainer, figureStyle]}>
        <Image
          source={andrewImage}
          style={styles.figureImage}
          resizeMode="cover"
        />
        {/* Cyan hologram overlay */}
        <View style={styles.hologramOverlay} />
        {/* Scan line */}
        <Animated.View style={[styles.scanLine, scanLineStyle]} />
        {/* Horizontal interference lines */}
        <View style={styles.interferenceLines}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.interferenceLine} />
          ))}
        </View>
      </Animated.View>

      {/* Light beam (trapezoid effect) */}
      <Animated.View style={[styles.beam, beamStyle]}>
        <View style={styles.beamInner} />
      </Animated.View>

      {/* Projector base */}
      <View style={styles.base}>
        <View style={styles.baseSurface} />
        <View style={styles.emitterDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // Figure
  figureContainer: {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
    overflow: 'hidden',
    borderRadius: 4,
  },
  figureImage: {
    width: FIGURE_WIDTH,
    height: FIGURE_HEIGHT,
  },
  hologramOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 240, 255, 0.6)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  interferenceLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  interferenceLine: {
    height: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
  },

  // Beam
  beam: {
    width: FIGURE_WIDTH + 20,
    height: BEAM_HEIGHT,
    alignItems: 'center',
    overflow: 'hidden',
  },
  beamInner: {
    width: BASE_WIDTH - 20,
    height: BEAM_HEIGHT,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 0,
    borderTopWidth: BEAM_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 240, 255, 0.08)',
    borderBottomColor: 'transparent',
  },

  // Base
  base: {
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseSurface: {
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    borderRadius: 10,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emitterDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
});
