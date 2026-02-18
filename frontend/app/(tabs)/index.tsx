// index.tsx
// Lobby/onboarding placeholder screen. To be further refined:
//   - Player name entry
//   - Game lobby (waiting for host to start)
//   - Team assignment
// See planning/PRD V1.md for full lobby requirements.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LobbyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capsules</Text>
      <Text style={styles.subtitle}>Lobby — placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginTop: 8,
  },
});
