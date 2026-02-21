import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/gameContext';

type TimerProps = {
  onTimeUp?: () => void;
};

export const Timer = ({ onTimeUp }: TimerProps) => {
  const game = useGame();
  if (!game) throw new Error('useGame not working');

  const { endTime } = game;

  const [minutesLeft, setMinutesLeft] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const timeUpFiredRef = useRef(false);

  useEffect(() => {
    if (endTime === 0) return; // no game yet
    timeUpFiredRef.current = false;

    // set initial values immediately so there's no 1-second flash of 0:00
    const initialRemaining = endTime - Date.now();
    if (initialRemaining > 0) {
      setMinutesLeft(Math.floor(initialRemaining / 60000));
      setSecondsLeft(Math.floor((initialRemaining % 60000) / 1000));
    }

    const intervalId = setInterval(() => {
      const remaining = endTime - Date.now();

      // check if there's no more remaining time
      if (remaining <= 0) {
        setMinutesLeft(0);
        setSecondsLeft(0);
        clearInterval(intervalId);
        if (!timeUpFiredRef.current) {
          timeUpFiredRef.current = true;
          onTimeUp?.();
        }
        return;
      }

      setMinutesLeft(Math.floor(remaining / 60000)); // 60000 = 1min in ms
      setSecondsLeft(Math.floor((remaining % 60000) / 1000));
    }, 1000);

    // cleanup = stops the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [endTime]);

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.timer}>
        {minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },
  timer: {
    fontFamily: 'monospace',
    fontSize: 24,
    color: '#00f0ff',
    letterSpacing: 2,
  },
});
