import { useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';

import { Button, Label, Screen } from '../components/ui';
import { FLOW_MILESTONES_MIN } from '../data/program';
import { clock } from '../format';
import { useStopwatch } from '../hooks/useStopwatch';
import { play } from '../sound';
import { colors, space, type } from '../theme';

export default function FlowScreen({ soundEnabled, note, onFinish, onQuit }) {
  useKeepAwake();

  const { elapsedMs, isPaused, resume, startedAtISO } = useStopwatch();

  // Chime once as each milestone passes — the schedule calls for 15–20 minutes,
  // so the timer counts up and just tells you when you've crossed the marks.
  const chimedRef = useRef(new Set());
  useEffect(() => {
    const minutes = elapsedMs / 60000;
    for (const mark of FLOW_MILESTONES_MIN) {
      if (minutes >= mark && !chimedRef.current.has(mark)) {
        chimedRef.current.add(mark);
        if (soundEnabled) play('done');
      }
    }
  }, [elapsedMs, soundEnabled]);

  const reached = FLOW_MILESTONES_MIN.filter((m) => elapsedMs / 60000 >= m);
  const nextMark = FLOW_MILESTONES_MIN.find((m) => elapsedMs / 60000 < m);

  const confirmQuit = () => {
    Alert.alert('Quit this session?', 'Nothing is saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Quit & discard', style: 'destructive', onPress: onQuit },
    ]);
  };

  const buildSession = (rating) => ({
    id: `${startedAtISO}-flow`,
    startedAt: startedAtISO,
    type: 'flow',
    level: 'flow',
    rating,
    rounds: [],
    activeMs: elapsedMs,
    restMs: 0,
    totalMs: elapsedMs,
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={confirmQuit} hitSlop={16} accessibilityRole="button">
          <Text style={styles.quit}>Quit</Text>
        </Pressable>
        <Text style={styles.headerMeta}>Rope flow</Text>
      </View>

      <View style={styles.body}>
        <Label color={colors.rest}>Active recovery</Label>
        <Text style={styles.timer}>{clock(elapsedMs)}</Text>
        <Text style={styles.marks}>
          {reached.length === FLOW_MILESTONES_MIN.length
            ? 'Full 20 minutes done — finish whenever you like'
            : `${nextMark} min mark next`}
        </Text>
        <Text style={styles.note}>{note}</Text>
      </View>

      <View style={styles.footer}>
        <Button title="Finish" onPress={() => onFinish(buildSession)} tone="rest" />
      </View>

      {isPaused && (
        <View style={styles.overlay}>
          <Label color={colors.textDim}>Paused</Label>
          <Text style={styles.pausedTitle}>You left the app</Text>
          <Button title="Resume" onPress={resume} tone="rest" style={styles.pausedButton} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(3),
    paddingVertical: space(1),
  },
  quit: { ...type.body, color: colors.danger, fontWeight: '700' },
  headerMeta: { ...type.body, color: colors.textDim },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(3) },
  timer: { ...type.timer, color: colors.rest, marginTop: space(2) },
  marks: { ...type.heading, color: colors.textDim, marginTop: space(1) },
  note: {
    ...type.body,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: space(3),
    lineHeight: 23,
  },
  footer: { paddingHorizontal: space(3), paddingBottom: space(3) },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,13,16,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(4),
  },
  pausedTitle: { ...type.title, color: colors.text, marginTop: space(1.5) },
  pausedButton: { alignSelf: 'stretch', marginTop: space(4) },
});
