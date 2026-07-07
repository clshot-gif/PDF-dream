// What she could be doing with the time this tool just handed back — the
// opposite of a progress-bar description. None of these are chores.
export const RECLAIMED_TIME_MESSAGES = [
  'Make out with your husband.',
  'Make good trouble',
  'Take another nap, differently this time.',
  'Seize the means of production',
  'Seize the means of reproduction',
  'Say the hot take',
  'Pierce something',
  'Harvest',
  'Sit in the sun like you’re solar-powered',
  'Eat the rich',
  'Go off grid',
  'Wash your hair',
  '"Work from home"',
  'Eat up',
  'YOLO',
  'Touch grass',
  'It’s 5:00 somewhere',
  'Become ungovernable',
  'Misbehave proportionately',
  'Kissing is good for morale',
  'Dismantle the master’s house',
  'Outlive your enemies',
  'Join the coven',
  'Feed the crows',
  'Call their bluff',
  'Take the scenic route',
  'Touch the weird little rock',
  'Waste daylight',
  'See the dawn',
  'Free the nipple',
  'Romanticize the municipal park',
  'Escape the panopticon',
  'Commit to the bit',
  'Touch the water',
  'Let history absolve you',
];

export function pickMessage(previous) {
  if (RECLAIMED_TIME_MESSAGES.length <= 1) return RECLAIMED_TIME_MESSAGES[0];
  let next;
  do {
    next = RECLAIMED_TIME_MESSAGES[Math.floor(Math.random() * RECLAIMED_TIME_MESSAGES.length)];
  } while (next === previous);
  return next;
}
