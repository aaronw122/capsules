import { Phrase } from './escapePhrase';
import { Timer } from './timer';
import { View, StyleSheet} from 'react-native';

export const Hud = () => {
  return (
    <View style={styles.container}>
      <Phrase />
      <Timer />
    </View>
  )
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    margin: 2,
  },
});
