import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';

export function Screen({ children, style, tint }) {
  return (
    <SafeAreaView style={[styles.screen, tint && { backgroundColor: tint }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Label({ children, color = colors.textDim, style }) {
  return <Text style={[type.label, { color }, style]}>{children}</Text>;
}

export function Button({ title, onPress, tone = 'primary', disabled, style }) {
  const tones = {
    primary: { bg: colors.work, fg: '#06210F' },
    rest: { bg: colors.rest, fg: '#04192B' },
    hold: { bg: colors.hold, fg: '#2A1A02' },
    neutral: { bg: colors.surfaceHigh, fg: colors.text },
    danger: { bg: 'transparent', fg: colors.danger },
  };
  const { bg, fg } = tones[tone] ?? tones.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        tone === 'danger' && styles.buttonOutline,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ value, color = colors.work }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Row({ children, style }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  button: {
    minHeight: 68,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(3),
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: colors.danger,
    minHeight: 54,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonText: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(2),
  },
  track: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
