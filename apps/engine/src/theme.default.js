// Dark, high-contrast, oversized type — the screen has to be readable
// from the floor mid-push-up, at arm's length, out of breath.

export const colors = {
  bg: '#0B0D10',
  surface: '#151A20',
  surfaceHigh: '#1E252E',
  border: '#2A333F',

  text: '#F2F5F8',
  textDim: '#93A1B0',
  textFaint: '#5D6B7A',

  work: '#3DDC84', // active station
  rest: '#3D9BDC', // rest countdown
  hold: '#DCA23D', // plank
  danger: '#DC5B4B', // quit / discard
  accent: '#8B6BF0',

  // Text colors on work/rest/hold backgrounds (promoted from inline hex)
  onWork: '#06210F',
  onRest: '#04192B',
  onHold: '#2A1A02',
};

export const space = (n) => n * 8;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const type = {
  display: { fontSize: 68, fontWeight: '800', letterSpacing: -2 },
  timer: { fontSize: 82, fontWeight: '700', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 21, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  mono: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
};
