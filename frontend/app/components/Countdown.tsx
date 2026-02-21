import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CountdownProps = {
  onComplete: () => void;
};

export default function Countdown({ onComplete }: CountdownProps) {
  const [step, setStep] = useState<3 | 2 | 1 | 'GO!'>(3);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => setStep(2), 1000));
    timeouts.push(setTimeout(() => setStep(1), 2000));
    timeouts.push(setTimeout(() => setStep('GO!'), 3000));
    timeouts.push(setTimeout(() => onCompleteRef.current(), 4000));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.countdownText}>{step}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontFamily: 'monospace',
    fontSize: 80,
    fontWeight: 'bold',
    color: '#00f0ff',
    textShadowColor: 'rgba(0, 240, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
