// Levels, weapons, upgrades, quips. All brands/people are parody/fictional.
export const LEVELS = [
  { id: 0, name: 'FLIGHT 305-ISH', sub: 'The Chili Bomb Hijack + Freefall', mode: 'freefall', cine: 'intro', music: 'title' },
  { id: 1, name: 'HAUL ASS-ETS', sub: 'Semi race to the marina', mode: 'drive', veh: 'semi', theme: 'seattle', cine: 'semi1', music: 'semi', len: 52000, boss: 'swat' },
  { id: 2, name: "GAS 'N' BLAST", sub: "Marina shootout at the Gas 'n' Gulp", mode: 'shoot', theme: 'marina', cine: 'marina', music: 'shoot', boss: 'forklift' },
  { id: 3, name: 'SALISH SLALOM', sub: 'Speedboat + Liberty Mines', mode: 'drive', veh: 'boat', theme: 'salish', cine: 'boat1', music: 'boat', len: 50000, boss: 'coastregard' },
  { id: 4, name: 'BORDER WATERS, EH', sub: 'Into Canada by speedboat', mode: 'drive', veh: 'boat', theme: 'border', cine: 'border', music: 'canada', len: 50000, boss: 'apology' },
  { id: 5, name: 'SORRY, NOT SORRY', sub: 'Vancouver shootout: Julia + kitties join', mode: 'shoot', theme: 'vancouver', cine: 'vancouver', music: 'canada', boss: 'zamboni' },
  { id: 6, name: 'TRANS-CANADA HI-WAY', sub: 'Andy drives, Julia rockets', mode: 'drive', veh: 'semi2', theme: 'transcanada', cine: 'hiway', music: 'semi', len: 56000, boss: 'mountiebus' },
  { id: 7, name: 'ROCKY ROAD', sub: 'Mountain switchbacks + Propagandia goons', mode: 'drive', veh: 'semi2', theme: 'rocky', cine: 'rocky', music: 'finale', len: 54000, boss: 'jeep' },
  { id: 8, name: 'MUSTACHE MOUNTAIN', sub: 'FINALE vs. PROPAGANDIA ONE', mode: 'finale', cine: 'mountain', music: 'finale', end: 'ending' },
];
export const WEAPONS = [
  { id: 'shotgun', name: 'FREEDOM SHOTGUN', lvl: 1, desc: 'Dash-mounted. Fires bald-eagle-approved buckshot. Unlimited ammo, obviously.', canada: 'Canada counters with: A HOCKEY STICK. Sorry.' },
  { id: 'eagle9000', name: 'EAGLE SCREAMER 9000', lvl: 2, desc: 'Minigun that screams the anthem. 9,000 rounds per patriotic minute.', canada: 'Canada counters with: A STRONGLY WORDED LETTER.' },
  { id: 'mines', name: 'LIBERTY MINES', lvl: 3, desc: 'Rubber-duck, bald-eagle and Thanksgiving-turkey mines. Drop & giggle.', canada: 'Canada counters with: A POLITE BUOY.' },
  { id: 'samer', name: 'UNCLE SAM-MER', lvl: 4, desc: 'Twin cannons painted like a 4th of July BBQ apron.', canada: 'Canada counters with: MAPLE-LEAF FRISBEES.' },
  { id: 'bazooka', name: "JULIA'S ∞ BAZOOKA", lvl: 5, desc: '"Reload? I don\'t know her." Infinite rockets, pink trim.', canada: 'Canada counters with: AN APOLOGY, IN BOTH OFFICIAL LANGUAGES.' },
  { id: 'cats', name: 'BOB & JAKE (ATTACK CATS)', lvl: 5, desc: 'Orange tabby pounce + grey-kitty hairball bombs. Not legally weapons.', canada: 'Canada counters with: "NICE KITTY, EH?"' },
  { id: 'rocketpod', name: 'SECOND-AMENDMENT-ARY ROCKET POD', lvl: 6, desc: 'Roof pod with 12 tubes and a cupholder.', canada: 'Canada counters with: A TIMBIT ROADBLOCK.' },
  { id: 'fireworks', name: 'FIREWORKS-OF-JULY CANNON', lvl: 7, desc: 'Special attack. It is always the 4th of July somewhere.', canada: 'Canada counters with: A SINGLE, SAD SPARKLER.' },
];
export const UPGRADES = [
  { id: 'rate', name: 'FIRE RATE', desc: 'More bullets per freedom.', cost: [6, 12, 20, 32, 50] },
  { id: 'dmg', name: 'DAMAGE', desc: 'Hollow-point patriotism.', cost: [6, 12, 20, 32, 50] },
  { id: 'armor', name: 'ARMOR', desc: 'Bolt more bricks onto the rig.', cost: [5, 10, 18, 28, 40] },
  { id: 'boom', name: 'BIGGER BOOMS', desc: 'Mines, rockets, hairballs: all bigger.', cost: [8, 15, 25, 38, 55] },
  { id: 'magnet', name: 'BOND MAGNET', desc: 'Bonds fly to you. Like the IRS, but reversed.', cost: [4, 9, 15, 24, 36] },
  { id: 'eagle', name: 'BALD EAGLE DRONE', desc: 'A robotic eagle that pecks cops. Screeches at Canadians.', cost: [20, 35, 55] },
];
export const QUIPS = {
  andy: ['Well, that escalated nicely.', 'Keep the change, Uncle Sam.', 'Bonds. Andy Bonds.', "I'm retired. This is my hobby.", 'Nobody out-guns a Helvie, pal.', 'That one was for my 401(k).'],
  julia: ['Make it rain, sweetheart.', "Reload? I don't know her.", "Sorry? I'm not sorry. I'm from Ohio.", 'Honey, I packed snacks and rockets.', 'Did someone order extra-crispy Mounties?'],
  cats: ['Bob: *knocks a Mountie off the table*', 'Jake: *hairball of justice*', 'Bob & Jake: MRRROW. (translation: "Sorry, not sorry.")'],
  canada: ['Sorry! Sorry! So—', 'Stop, or I\'ll say stop again!', "Oh geez, that's gonna leave a mark, eh?", 'Could you please stop exploding us? Thanks!', "I'm not mad, just disappointed, bud.", "That's a nice truck, sorry to shoot at it!", 'Take off, eh!'],
  cops: ['Freeze! Or at least slow down!', 'I left my latte for this!', 'Dispatch, he has a... chili?', 'That is NOT a bike lane, sir!', 'Ugh, paperwork.'],
};
