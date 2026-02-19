// index.tsx
// Lobby/onboarding placeholder screen. To be further refined:
//   - Player name entry
//   - Game lobby (waiting for host to start)
//   - Team assignment
// See planning/PRD V1.md for full lobby requirements.

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

export default function Call({
  navigation,
}: {
  navigation: NavigationProp<any>;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Fractals best cohort ever from 100 years ago decided to pull one last
        prank.
      </Text>
      <Text style={styles.subtitle}>
        all the doors are locked. they require a 17 letter passcode.{' '}
      </Text>
      <Text style={styles.subtitle}>
        {' '}
        17 Virtual capsules have been placed all around the room, each of them
        contain a part of the passcode.
      </Text>
      <Text style={styles.subtitle}>
        {' '}
        find all 17 capsules to get the passcode and escape!!!{' '}
      </Text>
      <Button title="Continue" onPress={() => navigation.navigate('Login')} />
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
