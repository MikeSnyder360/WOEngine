import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Label, Screen } from '../components/ui';
import { LEVELS } from '../data/program';
import { clock, shortDate, weekdayName } from '../format';
import { colors, radius, space, type } from '../theme';

export default function HistoryScreen({ history, onBack, onDelete }) {
  const circuits = history.filter((s) => s.type === 'circuit');

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16} accessibilityRole="button">
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>History</Text>

        {history.length === 0 && (
          <Text style={styles.empty}>
            No sessions yet. Finish a workout and it'll show up here with its difficulty rating.
          </Text>
        )}

        {circuits.length >= 2 && <RatingTrend sessions={circuits} />}

        {history.map((session) => (
          <Card key={session.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardHead}>
                <Text style={styles.cardDay}>{weekdayName(session.startedAt)}</Text>
                <Text style={styles.cardDate}>{shortDate(session.startedAt)}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>{session.rating}</Text>
              </View>
            </View>

            <Text style={styles.cardMeta}>
              {session.type === 'circuit'
                ? `${LEVELS[session.level]?.sub ?? session.level} · ${session.rounds.length} rounds`
                : 'Rope flow'}
              {' · '}
              {clock(session.totalMs)}
            </Text>

            <Pressable
              onPress={() => onDelete(session.id)}
              hitSlop={8}
              style={styles.deleteHit}
              accessibilityRole="button"
            >
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

/** Sparkline-ish bar row: difficulty over time, oldest on the left. */
function RatingTrend({ sessions }) {
  const ordered = [...sessions].reverse().slice(-12);
  return (
    <View style={styles.trend}>
      <Label>Difficulty over time</Label>
      <View style={styles.trendBars}>
        {ordered.map((s) => (
          <View key={s.id} style={styles.trendCol}>
            <View style={[styles.trendBar, { height: Math.max(4, s.rating * 9) }]} />
            <Text style={styles.trendValue}>{s.rating}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.trendHint}>
        Trending down at the same level means it's time to move up a column.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space(3), paddingVertical: space(1) },
  back: { ...type.body, color: colors.accent, fontWeight: '700' },
  content: { padding: space(3), paddingTop: space(1) },
  title: { ...type.title, color: colors.text },
  empty: { ...type.body, color: colors.textFaint, marginTop: space(3), lineHeight: 24 },
  trend: { marginTop: space(3) },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space(0.75),
    marginTop: space(1.5),
    height: 110,
  },
  // Capped so two sessions don't render as two enormous slabs; the row
  // fills in left-to-right as history builds up.
  trendCol: { width: 26, alignItems: 'center', justifyContent: 'flex-end' },
  trendBar: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  trendValue: { fontSize: 11, color: colors.textFaint, marginTop: 4 },
  trendHint: { fontSize: 13, color: colors.textFaint, marginTop: space(1.5), lineHeight: 19 },
  card: { marginTop: space(2), padding: space(2) },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHead: { flex: 1 },
  cardDay: { ...type.heading, color: colors.text },
  cardDate: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
  ratingBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadgeText: { fontSize: 19, fontWeight: '800', color: colors.text },
  cardMeta: { ...type.body, color: colors.textDim, marginTop: space(1) },
  deleteHit: { marginTop: space(1.5), alignSelf: 'flex-start' },
  delete: { fontSize: 14, color: colors.danger, fontWeight: '700' },
});
