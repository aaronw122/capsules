import { Phrase } from './escapePhrase';
import { Timer } from './timer';
import { View, StyleSheet } from 'react-native';

type HudProps = {
  onTimeUp?: () => void;
};

export const Hud = ({ onTimeUp }: HudProps) => {
  return (
    <View style={styles.container}>
      <Timer onTimeUp={onTimeUp} />
      <Phrase />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 3,
  },
});
