// Small SVG icons (24x24 viewBox) for the progress bar's flora/fauna reveals.
// Colored-pencil-ish palette, kept simple since these render at ~18px.

function butterfly(wingColor, wingLight) {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="7" cy="9" rx="5" ry="4" fill="${wingColor}" transform="rotate(-15 7 9)"/>
    <ellipse cx="17" cy="9" rx="5" ry="4" fill="${wingColor}" transform="rotate(15 17 9)"/>
    <ellipse cx="8" cy="15" rx="3.5" ry="3" fill="${wingLight}" transform="rotate(-10 8 15)"/>
    <ellipse cx="16" cy="15" rx="3.5" ry="3" fill="${wingLight}" transform="rotate(10 16 15)"/>
    <line x1="12" y1="6" x2="12" y2="18" stroke="#2b2b2b" stroke-width="1"/>
    <circle cx="12" cy="6" r="1" fill="#2b2b2b"/>
  </svg>`;
}

function flowerRing(petalColor, centerColor, petalRx, petalRy) {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <g fill="${petalColor}">
      <ellipse cx="12" cy="4.5" rx="${petalRx}" ry="${petalRy}"/>
      <ellipse cx="12" cy="19.5" rx="${petalRx}" ry="${petalRy}"/>
      <ellipse cx="4.5" cy="12" rx="${petalRy}" ry="${petalRx}"/>
      <ellipse cx="19.5" cy="12" rx="${petalRy}" ry="${petalRx}"/>
      <ellipse cx="6.9" cy="6.9" rx="${petalRx}" ry="${petalRy}" transform="rotate(45 6.9 6.9)"/>
      <ellipse cx="17.1" cy="6.9" rx="${petalRx}" ry="${petalRy}" transform="rotate(-45 17.1 6.9)"/>
      <ellipse cx="6.9" cy="17.1" rx="${petalRx}" ry="${petalRy}" transform="rotate(-45 6.9 17.1)"/>
      <ellipse cx="17.1" cy="17.1" rx="${petalRx}" ry="${petalRy}" transform="rotate(45 17.1 17.1)"/>
    </g>
    <circle cx="12" cy="12" r="3.2" fill="${centerColor}"/>
  </svg>`;
}

export const CRITTERS = [
  { name: 'butterfly-blue', svg: butterfly('#4a90d9', '#8ec2ee') },
  { name: 'butterfly-pink', svg: butterfly('#b06bc9', '#d98a9c') },
  { name: 'butterfly-yellow', svg: butterfly('#e0c468', '#f0dc9a') },
  { name: 'butterfly-green', svg: butterfly('#8fae7d', '#b7cfa8') },
  {
    name: 'ladybug',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="13" r="7" fill="#c9433c"/>
      <line x1="12" y1="6" x2="12" y2="20" stroke="#2b2b2b" stroke-width="1"/>
      <circle cx="12" cy="6" r="3" fill="#2b2b2b"/>
      <circle cx="9" cy="11" r="1.2" fill="#2b2b2b"/>
      <circle cx="15" cy="11" r="1.2" fill="#2b2b2b"/>
      <circle cx="9" cy="16" r="1.2" fill="#2b2b2b"/>
      <circle cx="15" cy="16" r="1.2" fill="#2b2b2b"/>
    </svg>`,
  },
  {
    name: 'bee',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="13" rx="6" ry="5" fill="#e0c468"/>
      <path d="M7,10 h10 M6.5,13 h11 M7,16 h10" stroke="#2b2b2b" stroke-width="1.6"/>
      <ellipse cx="9" cy="8" rx="3" ry="2" fill="#eef4fb" opacity="0.8" transform="rotate(-20 9 8)"/>
      <ellipse cx="15" cy="8" rx="3" ry="2" fill="#eef4fb" opacity="0.8" transform="rotate(20 15 8)"/>
      <circle cx="12" cy="7" r="2.5" fill="#2b2b2b"/>
    </svg>`,
  },
  {
    name: 'beetle',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="13" rx="6.5" ry="7" fill="#4f9d8c"/>
      <line x1="12" y1="6" x2="12" y2="20" stroke="#274a42" stroke-width="1"/>
      <circle cx="12" cy="6" r="2.2" fill="#274a42"/>
    </svg>`,
  },
  {
    name: 'firefly',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="11" cy="11" rx="5" ry="4" fill="#8a6b3f"/>
      <circle cx="13" cy="17" r="4" fill="#f2d675"/>
      <circle cx="9" cy="9" r="1.3" fill="#2b2b2b"/>
    </svg>`,
  },
  {
    name: 'spider',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M8,11 L2,7 M8,13 L2,13 M8,15 L2,19 M16,11 L22,7 M16,13 L22,13 M16,15 L22,19"
        stroke="#3a3438" stroke-width="1"/>
      <circle cx="12" cy="13" r="4" fill="#3a3438"/>
      <circle cx="10.5" cy="11" r="0.8" fill="#e0c468"/>
      <circle cx="13.5" cy="11" r="0.8" fill="#e0c468"/>
    </svg>`,
  },
  {
    name: 'dragonfly',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="9" cy="8" rx="7" ry="2.2" fill="#bcd9f2" opacity="0.85" transform="rotate(-8 9 8)"/>
      <ellipse cx="15" cy="8" rx="7" ry="2.2" fill="#bcd9f2" opacity="0.85" transform="rotate(8 15 8)"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="#4a90d9" stroke-width="2.4"/>
      <circle cx="4" cy="12" r="2" fill="#2b6ca3"/>
    </svg>`,
  },
  { name: 'sunflower', svg: flowerRing('#e0c468', '#8a6b3f', 2.2, 3.5) },
  { name: 'daisy', svg: flowerRing('#eef0f2', '#e0c468', 1.8, 3) },
  {
    name: 'poppy',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g fill="#d9704a">
        <ellipse cx="7.5" cy="7.5" rx="5.5" ry="5" transform="rotate(-20 7.5 7.5)"/>
        <ellipse cx="16.5" cy="7.5" rx="5.5" ry="5" transform="rotate(20 16.5 7.5)"/>
        <ellipse cx="7.5" cy="16.5" rx="5.5" ry="5" transform="rotate(20 7.5 16.5)"/>
        <ellipse cx="16.5" cy="16.5" rx="5.5" ry="5" transform="rotate(-20 16.5 16.5)"/>
      </g>
      <circle cx="12" cy="12" r="3" fill="#2b2b2b"/>
    </svg>`,
  },
  {
    name: 'aster',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#c17bb0" stroke-width="2.2" stroke-linecap="round">
        <line x1="12" y1="12" x2="12" y2="3"/>
        <line x1="12" y1="12" x2="19" y2="6"/>
        <line x1="12" y1="12" x2="21" y2="12"/>
        <line x1="12" y1="12" x2="19" y2="18"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <line x1="12" y1="12" x2="5" y2="18"/>
        <line x1="12" y1="12" x2="3" y2="12"/>
        <line x1="12" y1="12" x2="5" y2="6"/>
      </g>
      <circle cx="12" cy="12" r="3" fill="#e0c468"/>
    </svg>`,
  },
  {
    name: 'bluebell',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13,3 C13,9 15,10 15,14 C15,18 11,19 9,16 C7,13 9,12 9,9 C9,6 11,4 13,3 Z" fill="#6f92cf"/>
      <path d="M12,16 L11,22" stroke="#6f9058" stroke-width="1.4" fill="none"/>
    </svg>`,
  },
  {
    name: 'rose',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="7" fill="#c9506a"/>
      <circle cx="12" cy="12" r="4.6" fill="#d9748a"/>
      <circle cx="12" cy="12" r="2.2" fill="#a83a52"/>
    </svg>`,
  },
];

// Fisher-Yates shuffle, then take the first `count` — avoids the
// sort-with-random-comparator anti-pattern (biased, and some engines
// short-circuit compare calls for small arrays).
export function pickCritters(count = 10) {
  const pool = [...CRITTERS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
