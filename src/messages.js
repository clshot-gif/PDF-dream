// What she could be doing with the time this tool just handed back — the
// opposite of a progress-bar description. None of these are chores.
export const RECLAIMED_TIME_MESSAGES = [
  'Paint your nails',
  'Go get coffee (sitting down, like a person)',
  'Stretch. Actually stretch',
  'Take a walk with no destination',
  '"Work from home"',
  'Take a nap',
  'Do crime (small-scale, victimless, deeply satisfying)',
  'Make out with your husband',
  'Read a whole chapter, not just a page',
  'Take a bath you don’t have to rush',
  'Watch something with subtitles, no reason',
  'Practice your villain laugh',
  'Plan a low-stakes heist',
  'Buy yourself flowers',
  'Mute a group chat and feel nothing',
  'Learn one (1) tarot card',
  'Pet a dog that isn’t yours',
  'Sit in the driveway an extra ten minutes',
  'Draft the strongly worded email. Don’t send it',
  'Practice saying "no" with no explanation attached',
  'Take yourself on a date',
  'Overthrow something small and symbolic',
];

export function pickMessage(previous) {
  if (RECLAIMED_TIME_MESSAGES.length <= 1) return RECLAIMED_TIME_MESSAGES[0];
  let next;
  do {
    next = RECLAIMED_TIME_MESSAGES[Math.floor(Math.random() * RECLAIMED_TIME_MESSAGES.length)];
  } while (next === previous);
  return next;
}
