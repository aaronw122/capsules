// index.tsx
// Lobby/onboarding placeholder screen. To be further refined:
//   - Player name entry
//   - Game lobby (waiting for host to start)
//   - Team assignment
// See planning/PRD V1.md for full lobby requirements.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

export default function Call({
  navigation,
}: {
  navigation: NavigationProp<any>;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.transmissionLabel}>INCOMING TRANSMISSION</Text>
      <View style={styles.panel}>
        <Text style={styles.body}>
          Fractal's best cohort ever from 100 years ago decided to pull one last
          prank.
        </Text>
        <View style={styles.separator} />
        <Text style={styles.body}>
          All the doors are locked. They require a 17-letter passcode.
        </Text>
        <View style={styles.separator} />
        <Text style={styles.body}>
          17 virtual capsules have been placed around the room. Each one
          contains a fragment of the code.
        </Text>
        <View style={styles.separator} />
        <Text style={styles.highlight}>
          Find all 17 capsules. Crack the passcode. Escape.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>CONTINUE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    paddingHorizontal: 24,
  },
  transmissionLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00f0ff',
    letterSpacing: 3,
    marginBottom: 20,
  },
  panel: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 12,
    padding: 24,
    width: '100%',
  },
  body: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    marginVertical: 16,
  },
  highlight: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00f0ff',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  button: {
    marginTop: 32,
    backgroundColor: '#00f0ff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a1a',
    letterSpacing: 2,
  },
});
