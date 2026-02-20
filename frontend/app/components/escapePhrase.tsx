import { useGame } from '../context/gameContext';
import { NeonLetterBox } from './neonLetterBox';
import { View } from 'react-native';

export const Phrase = () => {
  const game = useGame();
  if (!game) throw new Error('game not working');

  const { escapePhrase } = game;
  return (
    <View>
      {escapePhrase.map(el => (
        <NeonLetterBox letter={el} />
      ))}
    </View>
  );
};
