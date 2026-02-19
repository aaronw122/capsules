import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useGame } from '../context/gameContext';
import { NavigationProp } from '@react-navigation/native';

export const Login = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const game = useGame();

  if (!game) throw new Error('useGame not working');

  const { newName, handleNameChange, createPlayer, setPlayerState } = game;

  const joinLobby = async () => {
    const player = await createPlayer();
    setPlayerState(player);
    console.log('player', player);

    // navigates to ar.tsx, player orients themselves
    navigation.navigate('AR');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>IDENTIFY YOURSELF</Text>
      <View style={styles.inputContainer}>
        <TextInput
          onChangeText={handleNameChange}
          value={newName}
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="rgba(0, 240, 255, 0.3)"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      <TouchableOpacity
        style={[styles.button, !newName.trim() && styles.buttonDisabled]}
        onPress={() => newName.trim() && joinLobby()}
        activeOpacity={0.8}
        disabled={!newName.trim()}
      >
        <Text style={styles.buttonText}>JOIN GAME</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    paddingHorizontal: 32,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00f0ff',
    letterSpacing: 3,
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  input: {
    fontFamily: 'monospace',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 32,
    backgroundColor: '#00f0ff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  buttonText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a1a',
    letterSpacing: 2,
  },
});
