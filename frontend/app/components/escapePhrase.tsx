import { useGame } from '../context/gameContext';
import { NeonLetterBox } from './neonLetterBox';

const Phrase = () => {
  const game = useGame();
  if (!game) new Error('game not working');

  const { escapePhrase } = game;
  return (
    <View>
      {escapePhrase.map(el => (
        <NeonLetterBox letter={el} />
      ))}
    </View>
  );
};
