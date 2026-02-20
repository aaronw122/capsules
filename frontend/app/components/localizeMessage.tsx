import { Text, View, StyleSheet } from 'react-native';

export const LocalizeMessage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        Move your phone slowly to scan the area
      </Text>
      <View style={{ transform: [{ scaleX: 2.7 }] }}>
        <Text style={{ fontSize: 80, color: '#fff' }}>← →</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
});
