import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type GameEndOverlayProps = {
  type: 'win' | 'lose';
  completedAt: string | null;
  onViewLeaderboard: () => void;
};

// Formats a timestamp string into M:SS relative to game start.
// completedAt is an ISO timestamp from the server representing when the player finished.
// The server stores the player's elapsed time as completedAt.
function formatCompletionTime(completedAt: string | null): string {
  if (!completedAt) return '-:--';

  // completedAt is a duration string like "2:34" or an ISO date.
  // If the server sends it as a pre-formatted duration, return it directly.
  // If it's a timestamp, we parse and format it.
  const asNumber = Number(completedAt);

  // If completedAt is a number (milliseconds elapsed), format it
  if (!isNaN(asNumber) && asNumber > 0) {
    const totalSeconds = Math.floor(asNumber / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // If it's an ISO date string, try parsing it
  const date = new Date(completedAt);
  if (!isNaN(date.getTime())) {
    // This is a full timestamp — we'd need game start time to calculate elapsed.
    // For now, display the raw value as a fallback.
    return completedAt;
  }

  // Already formatted string (e.g. "2:34"), return as-is
  return completedAt;
}

export default function GameEndOverlay({
  type,
  completedAt,
  onViewLeaderboard,
}: GameEndOverlayProps) {
  const isWin = type === 'win';

  return (
    <View style={styles.container}>
      {/* Heading */}
      <Text
        style={[styles.heading, isWin ? styles.headingWin : styles.headingLose]}
      >
        {isWin ? 'YOU DID IT!' : 'GAME OVER'}
      </Text>

      {/* Subtext — completion time or 0:00 */}
      <Text style={styles.timeLabel}>
        {isWin ? 'COMPLETION TIME' : 'TIME REMAINING'}
      </Text>
      <Text style={styles.time}>
        {isWin ? formatCompletionTime(completedAt) : '0:00'}
      </Text>

      {/* Divider line */}
      <View style={styles.divider} />

      {/* Leaderboard button */}
      <TouchableOpacity
        style={styles.button}
        onPress={onViewLeaderboard}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>VIEW LEADERBOARD</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heading: {
    fontFamily: 'monospace',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 3,
  },
  headingWin: {
    color: '#00f0ff',
    textShadowColor: 'rgba(0, 240, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  headingLose: {
    color: '#ff4444',
    textShadowColor: 'rgba(255, 68, 68, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  timeLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 3,
    marginBottom: 8,
  },
  time: {
    fontFamily: 'monospace',
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00f0ff',
    textShadowColor: 'rgba(0, 240, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 32,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.3)',
    marginBottom: 32,
  },
  button: {
    borderWidth: 2,
    borderColor: '#00f0ff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  buttonText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f0ff',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
