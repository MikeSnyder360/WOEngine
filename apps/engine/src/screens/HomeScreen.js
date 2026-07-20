import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Label, Row, Screen } from '../components/ui';
import {
  CIRCUIT,
  DAY_KEYS,
  LEVELS,
  LEVEL_ORDER,
  SCHEDULE,
  dayKeyFor,
  estimateCircuitMinutes,
} from '../data/program';
import { colors, radius, space, type } from '../theme';

export default function HomeScreen({
  settings,
  onChangeLevel,
  onToggleSound,
  onStartCircuit,
  onStartFlow,
  onOpenHistory,
  historyCount,
}) {
  const todayKey = dayKeyFor();
  const today = SCHEDULE[todayKey];
  const level = LEVELS[settings.level];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Row style={styles.topRow}>
          <View>
            <Label>Today</Label>
            <Text style={styles.day}>{today.day}</Text>
          </View>
          <Pressable onPress={onOpenHistory} hitSlop={12} accessibilityRole="button">
            <Text style={styles.historyLink}>History{historyCount ? ` (${historyCount})` : ''}</Text>
          </Pressable>
        </Row>

        <Card style={styles.todayCard}>
          <Label color={modeColor(today.mode)}>{today.focus}</Label>
          <Text style={styles.column}>{today.column}</Text>
          <Text style={styles.note}>{today.note}</Text>

          {today.mode === 'circuit' && (
            <>
              <Text style={styles.estimate}>
                {level.rounds} rounds · 7 stations · about {estimateCircuitMinutes(settings.level)} min
              </Text>
              <Button
                title="Start circuit"
                onPress={onStartCircuit}
                tone="primary"
                style={styles.cta}
              />
            </>
          )}

          {today.mode === 'flow' && (
            <>
              <Text style={styles.estimate}>Open-ended · chimes at 15 and 20 min</Text>
              <Button title="Start rope flow" onPress={onStartFlow} tone="rest" style={styles.cta} />
            </>
          )}

          {today.mode === 'rest' && (
            <View style={styles.restBlock}>
              <Text style={styles.restText}>
                Rest is programmed, not optional. Nothing to start today.
              </Text>
            </View>
          )}
        </Card>

        <Label style={styles.sectionLabel}>The week</Label>
        <View style={styles.week}>
          {DAY_KEYS.map((key) => {
            const entry = SCHEDULE[key];
            const isToday = key === todayKey;
            return (
              <View key={key} style={[styles.weekRow, isToday && styles.weekRowToday]}>
                <Text style={[styles.weekDay, isToday && styles.weekDayToday]}>{entry.short}</Text>
                <View style={styles.weekMain}>
                  <Text style={[styles.weekFocus, isToday && styles.weekFocusToday]}>
                    {entry.focus}
                  </Text>
                  <Text style={styles.weekColumn}>{entry.column}</Text>
                </View>
                <View style={[styles.dot, { backgroundColor: modeColor(entry.mode) }]} />
              </View>
            );
          })}
        </View>

        <Label style={styles.sectionLabel}>Level</Label>
        <View style={styles.levels}>
          {LEVEL_ORDER.map((key) => {
            const option = LEVELS[key];
            const selected = key === settings.level;
            return (
              <Pressable
                key={key}
                onPress={() => onChangeLevel(key)}
                style={[styles.levelChip, selected && styles.levelChipSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.levelLabel, selected && styles.levelLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.levelSub, selected && styles.levelSubSelected]}>
                  {option.sub} · {option.rounds} rounds
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.levelHint}>
          One level for the whole circuit — every station moves together.
        </Text>

        <Label style={styles.sectionLabel}>Circuit at this level</Label>
        <Card>
          {CIRCUIT.map((station, i) => (
            <View
              key={station.order}
              style={[styles.stationRow, i < CIRCUIT.length - 1 && styles.stationRowDivider]}
            >
              <Text style={styles.stationOrder}>{station.order}</Text>
              <View style={styles.stationMain}>
                <Text style={styles.stationName}>{station.name}</Text>
                {station.detail ? (
                  <Text style={styles.stationDetail}>{station.detail}</Text>
                ) : null}
              </View>
              <Text style={styles.stationTarget}>
                {station.targets[settings.level]} {station.unit === 'seconds' ? 's' : station.unit}
              </Text>
            </View>
          ))}
          <View style={styles.restSummary}>
            <Text style={styles.restSummaryText}>
              {level.restSec}s between stations · {Math.round(level.roundRestSec / 60)} min between
              rounds
            </Text>
          </View>
        </Card>

        <Pressable onPress={onToggleSound} style={styles.soundToggle} accessibilityRole="switch">
          <Text style={styles.soundLabel}>Sound cues</Text>
          <View style={[styles.switch, settings.soundEnabled && styles.switchOn]}>
            <Text style={styles.switchText}>{settings.soundEnabled ? 'On' : 'Off'}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function modeColor(mode) {
  if (mode === 'circuit') return colors.work;
  if (mode === 'flow') return colors.rest;
  return colors.textFaint;
}

const styles = StyleSheet.create({
  content: { padding: space(3), paddingBottom: space(6) },
  topRow: { justifyContent: 'space-between', alignItems: 'flex-start' },
  day: { ...type.title, color: colors.text, marginTop: space(0.5) },
  historyLink: { ...type.body, color: colors.accent, fontWeight: '700' },
  todayCard: { marginTop: space(2.5), padding: space(2.5) },
  column: { ...type.heading, color: colors.text, marginTop: space(1) },
  note: { ...type.body, color: colors.textDim, marginTop: space(1), lineHeight: 23 },
  estimate: { ...type.body, color: colors.textFaint, marginTop: space(2) },
  cta: { marginTop: space(2) },
  restBlock: { marginTop: space(2) },
  restText: { ...type.body, color: colors.textFaint, lineHeight: 23 },
  sectionLabel: { marginTop: space(4), marginBottom: space(1.5) },
  week: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space(1.5),
    paddingHorizontal: space(2),
  },
  weekRowToday: { backgroundColor: colors.surfaceHigh },
  weekDay: { ...type.mono, color: colors.textFaint, width: 44 },
  weekDayToday: { color: colors.text },
  weekMain: { flex: 1 },
  weekFocus: { ...type.body, color: colors.textDim, fontWeight: '600' },
  weekFocusToday: { color: colors.text, fontWeight: '800' },
  weekColumn: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
  dot: { width: 9, height: 9, borderRadius: radius.pill },
  levels: { gap: space(1) },
  levelChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space(1.5),
    paddingHorizontal: space(2),
  },
  levelChipSelected: { borderColor: colors.work, backgroundColor: colors.surfaceHigh },
  levelLabel: { ...type.body, color: colors.textDim, fontWeight: '700' },
  levelLabelSelected: { color: colors.text },
  levelSub: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
  levelSubSelected: { color: colors.textDim },
  levelHint: { ...type.body, fontSize: 14, color: colors.textFaint, marginTop: space(1.5) },
  stationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space(1.25) },
  stationRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  stationOrder: { ...type.mono, color: colors.textFaint, width: 26 },
  stationMain: { flex: 1 },
  stationName: { ...type.body, color: colors.text, fontWeight: '600' },
  stationDetail: { fontSize: 13, color: colors.textFaint, marginTop: 1 },
  stationTarget: { ...type.mono, color: colors.work },
  restSummary: { marginTop: space(1.5), paddingTop: space(1.5), borderTopWidth: 1, borderTopColor: colors.border },
  restSummaryText: { fontSize: 13, color: colors.textFaint },
  soundToggle: {
    marginTop: space(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundLabel: { ...type.body, color: colors.textDim, fontWeight: '600' },
  switch: {
    paddingHorizontal: space(2),
    paddingVertical: space(0.75),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchOn: { backgroundColor: colors.work, borderColor: colors.work },
  switchText: { fontSize: 14, fontWeight: '800', color: colors.bg },
});
