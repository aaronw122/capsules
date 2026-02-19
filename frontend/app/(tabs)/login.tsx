import { View, StyleSheet, Button, TextInput } from 'react-native';

import { useGame } from '../context/gameContext';

import { NavigationProp } from '@react-navigation/native';

export const Login = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const game = useGame();

  if (!game) throw new Error('useGame not working');

  const { newName, handleNameChange } = game;

  return (
    <View>
      <TextInput
        onChangeText={handleNameChange}
        value={newName}
        style={styles.input}
      />
      <Button onPress={() => navigation.navigate('AR')} title="join game" />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
