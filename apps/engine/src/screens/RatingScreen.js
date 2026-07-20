import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Label, Screen } from '../components/ui';
import { colors, radius, space, type } from '../theme';

const SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

const DESCRIPTIONS = {
  1: 'Barely registered',
  2: 'Very easy',
  3: 'Easy',
  4: 'Comfortable',
  5: 'Moderate',
  6: 'Working',
  7: 'Hard',
  8: 'Very hard',
  9: 'Near maximal',
  10: 'Everything I had',
};

export default function RatingScreen({ onSubmit, title = 'How hard was that?' }) {
  const [rating, setRating] = useState(null);

  return (
    <Screen>
      <View style={styles.content}>
        <Label color={colors.work}>Session complete</Label>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Rate the effort 1 to 10. This is the number worth watching — the same workout getting
          easier is the whole point.
        </Text>

        <View style={styles.grid}>
          {SCALE.map((n) => {
            const selected = rating === n;
            return (
              <Pressable
                key={n}
                onPress={() => setRating(n)}
                style={[styles.cell, selected && styles.cellSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${n} — ${DESCRIPTIONS[n]}`}
              >
                <Text style={[styles.cellText, selected && styles.cellTextSelected]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.description}>
          {rating ? DESCRIPTIONS[rating] : 'Pick a number to continue'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Save session"
          onPress={() => onSubmit(rating)}
          disabled={rating === null}
          tone="primary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: space(3) },
  title: { ...type.title, color: colors.text, marginTop: space(1) },
  subtitle: {
    ...type.body,
    color: colors.textDim,
    marginTop: space(1.5),
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(1),
    marginTop: space(4),
  },
  cell: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: colors.work, borderColor: colors.work },
  cellText: { fontSize: 22, fontWeight: '800', color: colors.textDim },
  cellTextSelected: { color: '#06210F' },
  description: {
    ...type.heading,
    color: colors.text,
    marginTop: space(3),
    minHeight: 28,
  },
  footer: { paddingHorizontal: space(3), paddingBottom: space(3) },
});
