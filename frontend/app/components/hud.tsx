import { Phrase } from './escapePhrase';
import { Timer } from './timer';
import { View, StyleSheet } from 'react-native';

export const Hud = () => {
  return (
    <View style={styles.container}>
      <Timer />
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
