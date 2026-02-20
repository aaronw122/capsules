import { useGame } from '../context/gameContext';
import { NeonLetterBox } from './neonLetterBox';
import { View, StyleSheet, Text } from 'react-native';
import React from 'react';

export const Phrase = () => {
  const game = useGame();
  if (!game) throw new Error('game not working');

  const { escapePhrase, playerState } = game;
  const breaks = new Set([7, 9]); // splits up the words so readable

  return (
    <View style={styles.container}>
      <Text>{playerState!.capsules}/17</Text>
      {escapePhrase.map((el, index) => (
        <React.Fragment key={index}>
          {breaks.has(index) && <View style={styles.break} />}
          <NeonLetterBox letter={el} />
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  break: {
    width: '100%',
  },
});
