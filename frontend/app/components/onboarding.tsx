import { View, StyleSheet, Text } from 'react-native';
import { useAR } from '../context/arContext';
import { LocalizeMessage } from './localizeMessage';

export const Onboarding = () => {
  const ar = useAR();

  if (!ar) throw new Error('useAR hook not working');

  const { relocalized } = ar;

  return (
    <View>
      <Text style={styles.statusText}>
        {relocalized ? 'Game will begin shortly...' : <LocalizeMessage />}
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  arView: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
  },
  statusText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 20,
  },
});
