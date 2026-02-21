import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useGame } from '../context/gameContext';
import { Line } from '../components/leaderboardLine';
import { LeaderBoard, PlayerLeaderBoard, PlayerState } from '../types';

export const Leaderboard = () => {
  const game = useGame();

  if (!game) throw new Error('useGame not working');

  const { leaderBoard } = game;

  console.log('leaderboard', leaderBoard);

  const columns = ['Rank', 'Name', 'Capsules', 'Time'];

  const sortedLeaderboard = [...leaderBoard].sort((a, b) => a.rank - b.rank);

  const renderHeaders = () => (
    <View style={[styles.row, styles.header]}>
      {columns.map(el => (
        <View style={styles.headerCellContainer} key={el}>
          <Text style={styles.headerCellText}>{el.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: PlayerState }) => (
    <Line
      key={item.id}
      rank={item.rank}
      name={item.name}
      capsules={item.capsules}
      completedAt={item.completedAt}
    />
  );

  return (
    <FlatList
      style={styles.container}
      data={sortedLeaderboard}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeaders}
      stickyHeaderIndices={[0]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    paddingHorizontal: 32,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00f0ff',
    letterSpacing: 3,
  },
  row: {
    flexDirection: 'row',
  },
  headerCellContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#fff',
    paddingVertical: 10,
    justifyContent: 'center',
  },
  headerCellText: {
    fontWeight: 'bold',
    color: '#00f0ff',
    textAlign: 'center',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  cell: {
    flex: 1, // equal-width columns
    paddingHorizontal: 8,
    textAlign: 'center',
  },
});
