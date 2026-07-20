import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';

import { Button, Label, ProgressBar, Screen } from '../components/ui';
import { CIRCUIT, LEVELS } from '../data/program';
import { clock, countdown } from '../format';
import { useCircuitSession } from '../hooks/useCircuitSession';
import { colors, space, type } from '../theme';

const TONE = {
  station: { color: colors.work, label: 'Work' },
  hold: { color: colors.hold, label: 'Hold' },
  rest: { color: colors.rest, label: 'Rest' },
  roundRest: { color: colors.rest, label: 'Round complete' },
};

export default function CircuitScreen({ levelKey, soundEnabled, onFinish, onQuit }) {
  // Without this the phone locks mid-plank and you lose the countdown.
  useKeepAwake();

  const session = useCircuitSession(levelKey, { soundEnabled });
  const {
    phase,
    phaseIndex,
    totalPhases,
    totalRounds,
    elapsedMs,
    remainingMs,
    isPaused,
    isFinished,
    advance,
    resume,
    buildSession,
  } = session;

  useEffect(() => {
    if (isFinished) onFinish(buildSession);
  }, [buildSession, isFinished, onFinish]);

  const confirmQuit = () => {
    Alert.alert(
      'Quit this workout?',
      'Nothing is saved — a partial session is discarded, as you asked.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Quit & discard', style: 'destructive', onPress: onQuit },
      ]
    );
  };

  if (!phase) return <Screen />;

  const tone = TONE[phase.kind];
  const level = LEVELS[levelKey];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={confirmQuit} hitSlop={16} accessibilityRole="button">
          <Text style={styles.quit}>Quit</Text>
        </Pressable>
        <Text style={styles.headerMeta}>
          Round {phase.round + 1} of {totalRounds} · {level.sub}
        </Text>
      </View>

      <View style={styles.progress}>
        <ProgressBar value={phaseIndex / totalPhases} color={tone.color} />
      </View>

      <View style={styles.body}>
        <Label color={tone.color}>{tone.label}</Label>

        {phase.kind === 'station' && <CountStation phase={phase} elapsedMs={elapsedMs} />}
        {phase.kind === 'hold' && <HoldStation phase={phase} remainingMs={remainingMs} />}
        {phase.kind === 'rest' && <Rest phase={phase} remainingMs={remainingMs} />}
        {phase.kind === 'roundRest' && (
          <RoundRest phase={phase} remainingMs={remainingMs} totalRounds={totalRounds} />
        )}
      </View>

      <View style={styles.footer}>
        {phase.kind === 'station' && (
          <Button title="Done — next station" onPress={advance} tone="primary" />
        )}
        {phase.kind === 'hold' && (
          <Button title="Finish early" onPress={advance} tone="hold" />
        )}
        {(phase.kind === 'rest' || phase.kind === 'roundRest') && (
          <Button title="Skip rest" onPress={advance} tone="rest" />
        )}
      </View>

      {isPaused && <PausedOverlay onResume={resume} />}
    </Screen>
  );
}

function CountStation({ phase, elapsedMs }) {
  return (
    <>
      <Text style={styles.stationName}>{phase.station.name}</Text>
      {phase.station.detail ? (
        <Text style={styles.stationDetail}>{phase.station.detail}</Text>
      ) : null}
      <Text style={[styles.target, { color: colors.work }]}>
        {phase.target} {phase.station.unit}
      </Text>
      <Text style={styles.elapsed}>{clock(elapsedMs)}</Text>
      <Text style={styles.hint}>Press the button when you've hit your {phase.station.unit}</Text>
    </>
  );
}

function HoldStation({ phase, remainingMs }) {
  return (
    <>
      <Text style={styles.stationName}>{phase.station.name}</Text>
      {phase.station.detail ? (
        <Text style={styles.stationDetail}>{phase.station.detail}</Text>
      ) : null}
      <Text style={[styles.bigCount, { color: colors.hold }]}>{countdown(remainingMs)}</Text>
      <Text style={styles.hint}>Hold for {phase.target} seconds</Text>
    </>
  );
}

function Rest({ phase, remainingMs }) {
  return (
    <>
      <Text style={[styles.bigCount, { color: colors.rest }]}>{countdown(remainingMs)}</Text>
      <Text style={styles.nextLabel}>Next up</Text>
      <Text style={styles.nextStation}>{phase.nextStation.name}</Text>
      {phase.nextStation.detail ? (
        <Text style={styles.stationDetail}>{phase.nextStation.detail}</Text>
      ) : null}
    </>
  );
}

function RoundRest({ phase, remainingMs, totalRounds }) {
  return (
    <>
      <Text style={[styles.bigCount, { color: colors.rest }]}>{countdown(remainingMs)}</Text>
      <Text style={styles.nextLabel}>
        Round {phase.nextRound + 1} of {totalRounds} next
      </Text>
      <Text style={styles.nextStation}>{CIRCUIT[0].name}</Text>
      <Text style={styles.stationDetail}>Catch your breath</Text>
    </>
  );
}

function PausedOverlay({ onResume }) {
  return (
    <View style={styles.overlay}>
      <Label color={colors.textDim}>Paused</Label>
      <Text style={styles.pausedTitle}>You left the app</Text>
      <Text style={styles.pausedBody}>
        The clock stopped when the app went to the background, so the time away isn't counted.
      </Text>
      <Button title="Resume" onPress={onResume} tone="primary" style={styles.pausedButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(3),
    paddingTop: space(1),
    paddingBottom: space(1.5),
  },
  quit: { ...type.body, color: colors.danger, fontWeight: '700' },
  headerMeta: { ...type.body, color: colors.textDim },
  progress: { paddingHorizontal: space(3) },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(3),
  },
  stationName: {
    ...type.title,
    color: colors.text,
    textAlign: 'center',
    marginTop: space(2),
  },
  stationDetail: {
    ...type.body,
    color: colors.textFaint,
    marginTop: space(0.5),
  },
  target: {
    ...type.display,
    marginTop: space(3),
    textAlign: 'center',
  },
  elapsed: {
    ...type.timer,
    fontSize: 46,
    color: colors.textDim,
    marginTop: space(1),
  },
  bigCount: {
    fontSize: 132,
    fontWeight: '800',
    letterSpacing: -6,
    fontVariant: ['tabular-nums'],
    marginTop: space(2),
  },
  hint: {
    ...type.body,
    color: colors.textFaint,
    marginTop: space(2),
    textAlign: 'center',
  },
  nextLabel: {
    ...type.label,
    color: colors.textFaint,
    marginTop: space(2),
  },
  nextStation: {
    ...type.title,
    color: colors.text,
    marginTop: space(1),
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: space(3),
    paddingBottom: space(3),
    paddingTop: space(1),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,13,16,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(4),
  },
  pausedTitle: {
    ...type.title,
    color: colors.text,
    marginTop: space(1.5),
  },
  pausedBody: {
    ...type.body,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: space(1.5),
    lineHeight: 24,
  },
  pausedButton: {
    alignSelf: 'stretch',
    marginTop: space(4),
  },
});
