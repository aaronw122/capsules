import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, // like useState, but lives on the native side for performance
  useAnimatedStyle, // creates a style object that auto-updates when shared values change
  withTiming, // animates a value from A → B over a duration
  withSpring, // animates with a spring/bounce physics feel
  withDelay, // delays the start of an animation
  interpolate, // maps one range of values to another (e.g., 0→1 maps to 0→10 for shadow)
} from 'react-native-reanimated';

type NeonLetterBoxProps = {
  letter?: string | null;
  color?: string;
  index?: number;
};

export const NeonLetterBox = ({
  letter,
  color = '#0ff',
  index = 0,
}: NeonLetterBoxProps) => {
  const progress = useSharedValue(letter ? 0 : 1);

  useEffect(() => {
    if (letter) {
      progress.value = withDelay(
        index * 80,
        withSpring(1, { damping: 12, stiffness: 100 }),
      );
    }
  }, [letter]);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: letter ? color : 'rgba(255,255,255,0.12)',
    backgroundColor: letter ? `${color}14` : 'rgba(255,255,255,0.03)',
    shadowColor: letter ? color : 'transparent',
    shadowRadius: letter ? 10 : 0,
    shadowOpacity: letter ? 0.4 : 0,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.05]) }],
    opacity: interpolate(progress.value, [0, 1], [0.6, 1]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1]) }],
    opacity: interpolate(progress.value, [0, 1], [0.3, 1]),
  }));

  return (
    <Animated.View style={[styles.box, boxStyle]}>
      <Animated.Text
        style={[
          styles.letter,
          textStyle,
          {
            color: letter ? color : 'rgba(255,255,255,0.25)',
            textShadowColor: letter ? color : 'transparent',
            textShadowRadius: letter ? 8 : 0,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {letter ?? '?'}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 20,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  letter: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
});
