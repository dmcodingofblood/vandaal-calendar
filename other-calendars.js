// other-calendars.js: the calendars of other peoples. Dwarves first; elves to follow.
// It needs calendar-data.js and calendar-logic.js to be loaded first.
// Source: the Dwarven and Elven Calendar Rulebooks doc, with your rulings.

// ---------------------------------------------------------------
// The dwarven calendar
// ---------------------------------------------------------------
// Dwarves share the human 200-day sun-year but count it in scores:
// a score is a 20-day week, and there are 10 scores in a year.
const DWARVEN = {
  yearOffset: 603,   // 1317M is 714SL, so a Metluur year is the SL year plus 603
  daysPerScore: 20,

  // The 20 day names of a score. Each day begins and then opens like a gate, expect for the last day which is in reverse. 
  dayNames: [
    "deckriy", "deckriy agorèd", "aiul", "aiul agorèd", "puhmed",
    "puhmed agorèd", "dorwum", "dorwum agorèd", "gweddi", "gweddi agorèd",
    "Mree", "Mri agorèd", "cad", "cad agorèd", "gweddii",
    "gweddii agorèd", "gwaith", "gwaith agorèd", "terfyniad agorèd", "terfyniad"
  ],

  // The two gates of the year. "day" is the day of the year (1 to 200).
  // The eve of a gate is the day before it.
  gates: [
    { day: 1,   name: "Calan Haf",   note: "the first gate of the year" },
    { day: 101, name: "Calan Gayaf", note: "the second gate of the year" }
  ],

  // Scores 1 to 5 are the Up half of the year, and scores 6 to 10 the Down half.
  halves: ["Up half", "Down half"]
};

// "65 score and 17": a number spoken in scores. 1317 is 65 twenties and 17 over.
function scoresText(n) {
  const scores = Math.floor(n / DWARVEN.daysPerScore);
  const rest = n % DWARVEN.daysPerScore;
  if (scores === 0) {
    return String(rest);
  }
  return scores + " score" + (rest > 0 ? " and " + rest : "");
}

// Turns a date ({ year, dayOfYear }) into its dwarven reading.
function dwarvenDate(date) {
  const zeroBased = date.dayOfYear - 1;
  const score = Math.floor(zeroBased / DWARVEN.daysPerScore) + 1;   // 1 to 10
  const dayInScore = (zeroBased % DWARVEN.daysPerScore) + 1;        // 1 to 20
  const metluurYear = date.year + DWARVEN.yearOffset;

  let gate = null;
  let eveOf = null;
  for (const g of DWARVEN.gates) {
    if (date.dayOfYear === g.day) {
      gate = g;
    }
    // The eve is the day before the gate, wrapping round the year end.
    const eveDay = g.day === 1 ? DAYS_PER_YEAR : g.day - 1;
    if (date.dayOfYear === eveDay) {
      eveOf = g;
    }
  }

  return {
    score: score,
    dayInScore: dayInScore,
    dayName: DWARVEN.dayNames[dayInScore - 1],
    half: DWARVEN.halves[score <= 5 ? 0 : 1],
    year: metluurYear,
    gate: gate,
    eveOf: eveOf
  };
}

// "Score 3, pymthegfed"
function formatDwarvenDay(date) {
  const d = dwarvenDate(date);
  return "Score " + d.score + ", " + d.dayName;
}

// "1317M (65 score and 17)"
function formatDwarvenYear(date) {
  const d = dwarvenDate(date);
  return d.year + "M (" + scoresText(d.year) + ")";
}
