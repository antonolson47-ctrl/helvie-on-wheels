const KEY = 'helvie_on_wheels_v1';
const DEF = () => ({ bonds: 0, totalBonds: 0, unlocked: 0, stars: {}, best: {}, up: { rate: 0, dmg: 0, armor: 0, boom: 0, magnet: 0, eagle: 0 }, seenWeapons: {}, settings: { music: 0.55, sfx: 0.9, tilt: false, quality: null, readAloud: false, lefty: false }, rescues: 0, kills: 0 });
export let SAVE = DEF();
export function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) SAVE = Object.assign(DEF(), s, { up: Object.assign(DEF().up, s.up || {}), settings: Object.assign(DEF().settings, s.settings || {}) }); } catch (e) { } return SAVE; }
export function save() { try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch (e) { } }
export function resetSave() { SAVE = DEF(); save(); }
