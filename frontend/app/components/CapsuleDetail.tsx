import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import type { Capsule } from '../types';

type CapsuleDetailProps = {
  capsule: Capsule;
  onCollect: (id: string) => void;
  onDismiss: () => void;
};

export default function CapsuleDetail({
  capsule,
  onCollect,
  onDismiss,
}: CapsuleDetailProps) {
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [translateY]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  const handleCollect = () => {
    Animated.timing(translateY, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onCollect(capsule.id));
  };

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={dismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <Text style={styles.sequenceLabel}>CAPSULE {capsule.number} / 17</Text>
        <Text style={styles.name}>{capsule.content.name}</Text>
        <Text style={styles.funFact}>{capsule.content.funFact}</Text>
        <View style={styles.letterContainer}>
          <Text style={styles.letterLabel}>KEY FRAGMENT</Text>
          <Text style={styles.letter}>{capsule.letter}</Text>
        </View>
        {capsule.isOpened ? (
          <View style={styles.collectedBadge}>
            <Text style={styles.collectedText}>ALREADY COLLECTED</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.collectButton}
            onPress={handleCollect}
            activeOpacity={0.8}
          >
            <Text style={styles.collectButtonText}>COLLECT</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: 'rgba(10, 10, 26, 0.92)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sequenceLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00f0ff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  name: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  funFact: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 22,
    marginBottom: 24,
  },
  letterContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.15)',
  },
  letterLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: 'rgba(0, 240, 255, 0.6)',
    letterSpacing: 3,
    marginBottom: 8,
  },
  letter: {
    fontFamily: 'monospace',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00f0ff',
    textShadowColor: 'rgba(0, 240, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  collectButton: {
    backgroundColor: '#00f0ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  collectButtonText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a1a',
    letterSpacing: 2,
  },
  collectedBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  collectedText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 2,
  },
});
