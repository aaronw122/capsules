// index.tsx
// Lobby/onboarding placeholder screen. To be further refined:
//   - Player name entry
//   - Game lobby (waiting for host to start)
//   - Team assignment
// See planning/PRD V1.md for full lobby requirements.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

export default function Onboarding({
  navigation,
}: {
  navigation: NavigationProp<any>;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.yearLabel}>AD 2126</Text>
      <Text style={styles.title}>FRACTAL U</Text>
      <View style={styles.divider} />
      <Text style={styles.subtitle}>
        Hologram Andrew is requesting an interface.
      </Text>
      <Text style={styles.subtitle}>Do you accept?</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Call')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>ACCEPT THE CALL</Text>
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
    paddingHorizontal: 32,
  },
  yearLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: 'rgba(0, 240, 255, 0.5)',
    letterSpacing: 4,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 6,
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.3)',
    marginVertical: 24,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: 40,
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
