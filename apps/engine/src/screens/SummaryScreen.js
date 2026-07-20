import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Label, Screen } from '../components/ui';
import { LEVELS } from '../data/program';
import { clock, delta, split } from '../format';
import { colors, radius, space, type } from '../theme';

export default function SummaryScreen({ session, previous, onDone }) {
  const isCircuit = session.type === 'circuit';
  const level = LEVELS[session.level];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Label color={colors.work}>Saved</Label>
        <Text style={styles.title}>
          {isCircuit ? 'Circuit complete' : 'Rope flow complete'}
        </Text>

        <Card style={styles.ratingCard}>
          <Label>Difficulty</Label>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>{session.rating}</Text>
            <Text style={styles.ratingOf}>/ 10</Text>
          </View>
          {previous ? (
            <Text style={styles.ratingCompare}>
              {compareRating(session.rating, previous.rating)}
            </Text>
          ) : (
            <Text style={styles.ratingCompare}>
              Your first {isCircuit ? level.sub : 'rope flow'} session — this becomes the baseline.
            </Text>
          )}
        </Card>

        <View style={styles.stats}>
          <Stat label="Total" value={clock(session.totalMs)} />
          {isCircuit && <Stat label="Working" value={clock(session.activeMs)} />}
          {isCircuit && <Stat label="Resting" value={clock(session.restMs)} />}
        </View>

        {previous && (
          <Card style={styles.deltaCard}>
            <Label>Against your last {isCircuit ? level.sub : 'flow'} session</Label>
            <View style={styles.deltaRow}>
              <Text style={styles.deltaLabel}>Total time</Text>
              <Text
                style={[
                  styles.deltaValue,
                  { color: session.totalMs <= previous.totalMs ? colors.work : colors.textDim },
                ]}
              >
                {delta(session.totalMs - previous.totalMs)}
              </Text>
            </View>
            {isCircuit && (
              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>Working time</Text>
                <Text
                  style={[
                    styles.deltaValue,
                    { color: session.activeMs <= previous.activeMs ? colors.work : colors.textDim },
                  ]}
                >
                  {delta(session.activeMs - previous.activeMs)}
                </Text>
              </View>
            )}
          </Card>
        )}

        {isCircuit &&
          session.rounds.map((round, i) => (
            <View key={i} style={styles.roundBlock}>
              <Label style={styles.roundLabel}>Round {i + 1}</Label>
              <Card>
                {round.map((s, j) => (
                  <View
                    key={`${s.order}-${j}`}
                    style={[styles.splitRow, j < round.length - 1 && styles.splitDivider]}
                  >
                    <Text style={styles.splitOrder}>{s.order}</Text>
                    <View style={styles.splitMain}>
                      <Text style={styles.splitName}>{s.name}</Text>
                      <Text style={styles.splitTarget}>
                        {s.target} {s.unit === 'seconds' ? 's' : s.unit}
                      </Text>
                    </View>
                    <Text style={[styles.splitTime, s.kind === 'hold' && { color: colors.hold }]}>
                      {split(s.activeMs)}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Done" onPress={onDone} tone="primary" />
      </View>
    </Screen>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function compareRating(current, prev) {
  const diff = current - prev;
  if (diff === 0) return `Same effort as last time (${prev}/10).`;
  if (diff < 0) return `Easier than last time — you rated that one ${prev}/10.`;
  return `Harder than last time — you rated that one ${prev}/10.`;
}

const styles = StyleSheet.create({
  // Extra bottom padding clears the fixed footer button, which would
  // otherwise sit on top of the last split row.
  content: { padding: space(3), paddingBottom: space(12) },
  title: { ...type.title, color: colors.text, marginTop: space(1) },
  ratingCard: { marginTop: space(3), padding: space(2.5) },
  ratingRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: space(1) },
  ratingValue: { fontSize: 72, fontWeight: '800', color: colors.work, letterSpacing: -3 },
  ratingOf: { ...type.heading, color: colors.textFaint, marginLeft: space(1) },
  ratingCompare: { ...type.body, color: colors.textDim, marginTop: space(1), lineHeight: 23 },
  stats: { flexDirection: 'row', gap: space(1.5), marginTop: space(2) },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space(2),
    alignItems: 'center',
  },
  statValue: { ...type.heading, color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, color: colors.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  deltaCard: { marginTop: space(2), padding: space(2.5) },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space(1.5),
  },
  deltaLabel: { ...type.body, color: colors.textDim },
  deltaValue: { ...type.mono, fontSize: 18 },
  roundBlock: { marginTop: space(3) },
  roundLabel: { marginBottom: space(1) },
  splitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space(1.25) },
  splitDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  splitOrder: { ...type.mono, color: colors.textFaint, width: 24 },
  splitMain: { flex: 1 },
  splitName: { ...type.body, color: colors.text, fontWeight: '600' },
  splitTarget: { fontSize: 13, color: colors.textFaint, marginTop: 1 },
  splitTime: { ...type.mono, fontSize: 17, color: colors.work },
  footer: { paddingHorizontal: space(3), paddingBottom: space(3), paddingTop: space(1) },
});
