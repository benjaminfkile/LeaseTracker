import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../theme';

export type MileageProgressRingProps = {
  totalMiles: number;
  usedMiles: number;
  size?: number;
  strokeWidth?: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MileageProgressRing({
  totalMiles,
  usedMiles,
  size = 200,
  strokeWidth = 16,
}: MileageProgressRingProps): React.ReactElement {
  const theme = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedUsed = Math.min(usedMiles, totalMiles);
  const targetProgress = totalMiles > 0 ? clampedUsed / totalMiles : 0;

  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: targetProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, targetProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const progressColor =
    targetProgress > 0.95
      ? theme.colors.error
      : targetProgress >= 0.8
        ? theme.colors.warning
        : theme.colors.success;

  const milesRemaining = Math.max(0, totalMiles - clampedUsed);

  return (
    <View style={styles.wrapper} testID="mileage-progress-ring">
      <Svg
        width={size}
        height={size}
        testID="mileage-progress-ring-svg"
      >
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="none"
            testID="mileage-progress-ring-track"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            testID="mileage-progress-ring-fill"
          />
        </G>
      </Svg>
      <View style={[styles.center, { width: size, height: size }]} pointerEvents="none">
        <Text
          style={[styles.remainingText, { color: theme.colors.textPrimary }]}
          testID="mileage-progress-ring-remaining"
        >
          {milesRemaining.toLocaleString()}
        </Text>
        <Text
          style={[styles.subText, { color: theme.colors.textSecondary }]}
          testID="mileage-progress-ring-label"
        >
          mi left
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  remainingText: {
    fontSize: 32,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
