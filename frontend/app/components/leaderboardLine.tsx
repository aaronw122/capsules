import { Text, View, StyleSheet } from 'react-native';
import { PlayerLeaderBoard, PlayerState } from '../types';

export const Line = ({
  name,
  rank,
  capsules,
  completedAt,
}: PlayerLeaderBoard) => {
  const completionTime = !completedAt ? '--' : completedAt;

  return (
    <View style={styles.cell}>
      <View style={styles.cellItem}>
        <Text style={styles.text}>{rank}</Text>
      </View>
      <View style={styles.cellItem}>
        <Text style={styles.text}>{name}</Text>
      </View>
      <View style={styles.cellItem}>
        <Text style={styles.text}>{capsules}/17</Text>
      </View>
      <View style={styles.cellItem}>
        <Text style={styles.text}>{completionTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  cellItem: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#fff',
    paddingVertical: 10,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: 14,
    color: '#fff',
  },
});
