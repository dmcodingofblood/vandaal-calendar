// calendar-logic.js
// The date maths for Vandaal. This file only does sums; it holds no lore.
// It needs calendar-data.js to be loaded first, because it uses
// DAYS_PER_SEASON, DAYS_PER_WEEK, SEASONS and WEEKDAYS from that file.

// Turns a day of the year (1 to 200) into a full date.
// Example: dayOfYearToDate(55) gives Greenmeet 5, tenday 1, Petrin.
function dayOfYearToDate(dayOfYear) {
  // Reject anything that is not a whole number from 1 to 200.
  if (!Number.isInteger(dayOfYear) || dayOfYear < 1 || dayOfYear > DAYS_PER_YEAR) {
    return null;
  }

  // Lists count from 0, so subtract 1 to start counting at 0.
  const zeroBased = dayOfYear - 1;

  // Math.floor(a / b) is "how many whole b's fit into a" (divide, drop the remainder).
  const seasonIndex = Math.floor(zeroBased / DAYS_PER_SEASON);

  // The % sign gives the REMAINDER after dividing. 54 % 50 is 4, so day 55 is the 5th day of its season.
  const dayOfSeason = (zeroBased % DAYS_PER_SEASON) + 1;

  // Which tenday (week) of the season, 1 to 5.
  const tenday = Math.floor((dayOfSeason - 1) / DAYS_PER_WEEK) + 1;

  // Which weekday, as a list position 0 to 9.
  const weekdayIndex = (dayOfSeason - 1) % DAYS_PER_WEEK;

  // "return" hands the answer back to whoever called the function.
  return {
    dayOfYear: dayOfYear,
    seasonIndex: seasonIndex,
    season: SEASONS[seasonIndex],
    dayOfSeason: dayOfSeason,
    tenday: tenday,
    weekdayIndex: weekdayIndex,
    weekday: WEEKDAYS[weekdayIndex]
  };
}

// A readable one-line version, handy for testing.
function describeDate(dayOfYear) {
  const d = dayOfYearToDate(dayOfYear);
  if (d === null) {
    return "Day " + dayOfYear + " is not a valid day of the year";
  }
  return "Day " + dayOfYear + " is " + d.season.name + " " + d.dayOfSeason +
         ", tenday " + d.tenday + ", " + d.weekday.name;
}

// The name of a year, or a polite fallback if none is recorded.
// YEAR_NAMES[714] looks up the entry whose key is 714.
function yearName(year) {
  return YEAR_NAMES[year] || "Name unrecorded";
}

// Which age a year falls in. We walk down the AGES list and remember the
// last age that started on or before the year.
function ageForYear(year) {
  let result = null;
  for (const age of AGES) {
    if (year >= age.startYear) {
      result = age.name;
    }
  }
  return result;
}

// ---------------------------------------------------------------
// Phase 8: moving through time
// ---------------------------------------------------------------
// A "date" is a small object holding two numbers: { year: 714, dayOfYear: 23 }.
// To add days, we turn a date into one big running count of days since the
// start of year 1, add to it, then turn it back. That way a year ending
// (day 200, Wintercrash) rolls over to the next year with no special case.

function toAbsoluteDay(date) {
  return (date.year - 1) * DAYS_PER_YEAR + (date.dayOfYear - 1);
}

function fromAbsoluteDay(absoluteDay) {
  return {
    year: Math.floor(absoluteDay / DAYS_PER_YEAR) + 1,
    dayOfYear: (absoluteDay % DAYS_PER_YEAR) + 1
  };
}

// Returns the date that is `days` later. Dates before year 1 do not exist,
// so asking to go back past the start returns the date unchanged.
function addDays(date, days) {
  const target = toAbsoluteDay(date) + days;
  if (target < 0) {
    return date;
  }
  return fromAbsoluteDay(target);
}

// Builds a date from what a person types: year, season number (0 to 3) and
// day of the season (1 to 50). Returns null if anything is out of range.
function makeDate(year, seasonIndex, dayOfSeason) {
  if (!Number.isInteger(year) || year < 1) { return null; }
  if (!Number.isInteger(seasonIndex) || seasonIndex < 0 || seasonIndex >= SEASONS.length) { return null; }
  if (!Number.isInteger(dayOfSeason) || dayOfSeason < 1 || dayOfSeason > DAYS_PER_SEASON) { return null; }
  return { year: year, dayOfYear: seasonIndex * DAYS_PER_SEASON + dayOfSeason };
}

// Text versions of a date.
// formatShort: "Snowmelt 23, 714SL"
function formatShort(date) {
  const d = dayOfYearToDate(date.dayOfYear);
  return d.season.name + " " + d.dayOfSeason + ", " + date.year + "SL";
}

// formatDate: "Runnersday, Snowmelt 23, 714SL"
function formatDate(date) {
  const d = dayOfYearToDate(date.dayOfYear);
  return d.weekday.name + ", " + formatShort(date);
}

// ---------------------------------------------------------------
// Phase 7: festivals
// ---------------------------------------------------------------
// Which days of the year (1 to 200) does a festival cover? A festival's RULE
// (in calendar-data.js) is turned into a list of day numbers here.
function festivalDays(festival) {
  const rule = festival.rule;
  const days = [];

  if (rule.type === "nthWeekday") {
    // e.g. the 3rd Petrin of Greenmeet: skip past earlier seasons, then
    // (ordinal - 1) whole tendays, then the weekday's position in the tenday.
    days.push(rule.season * DAYS_PER_SEASON + (rule.ordinal - 1) * DAYS_PER_WEEK + rule.weekday + 1);
  } else if (rule.type === "dayRange") {
    for (let d = rule.from; d <= rule.to; d++) {
      days.push(rule.season * DAYS_PER_SEASON + d);
    }
  } else if (rule.type === "multiRange") {
    for (const part of rule.parts) {
      for (let d = part.from; d <= part.to; d++) {
        days.push(part.season * DAYS_PER_SEASON + d);
      }
    }
  }
  return days;
}

// Builds a lookup: day of the year -> the list of festivals on that day.
// Example: index[50] holds the festivals on Greenmeet 50... or whichever day 50 is.
function buildFestivalIndex() {
  const index = {};
  for (const festival of FESTIVALS) {
    for (const day of festivalDays(festival)) {
      if (!index[day]) {
        index[day] = [];
      }
      index[day].push(festival);
    }
  }
  return index;
}

// Does a festival pass the filters? An empty choice ("") means "do not filter".
// A festival with no people listed belongs to any people, so it passes the
// people filter only when a culture has been chosen as well (the culture
// then decides whether it shows).
function festivalMatches(festival, peopleId, cultureId) {
  const peopleOk = peopleId === "" ||
    festival.people.includes(peopleId) ||
    (festival.people.length === 0 && cultureId !== "");
  const cultureOk = cultureId === "" || festival.cultures.includes(cultureId);
  return peopleOk && cultureOk;
}

// Finds a label such as "Dwarves" from an id such as "dwarf".
function labelFor(list, id) {
  for (const item of list) {
    if (item.id === id) {
      return item.label;
    }
  }
  return id;
}

// ---------------------------------------------------------------
// Phase 7, part 2: three ways of writing a date
// ---------------------------------------------------------------
// Each style has a template. Words in { } get filled in by fillTemplate below:
//   {day}  day of the season, 1 to 50        {season}  season name
//   {seasonLetter}  S, G, H or T             {year}  year number
//   {num}  which tenday of the season, 1 to 5   {ord}  the same as 1st, 2nd ...
//   {weekday}  weekday name                  {weekdayLetter}  its first letter
// A Peasant date uses the day's festival name instead, when the day has one.
const DATE_STYLES = [
  {
    id: "peasant", label: "Peasant", template: "{season} {day}",
    note: "The festival's name if the day has one, otherwise the season and day (1 to 50)."
  },
  {
    id: "scholar", label: "Scholar", template: "{year}SL-{seasonLetter}-{num}{weekdayLetter}",
    note: "Year, season letter, then the tenday number and weekday letter."
  },
  {
    id: "merchant", label: "Merchant", template: "{ord} {weekday}, {season}, {year}SL",
    note: "The weekday of the tenday, then the season and year."
  }
];

// 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th" ...
function ordinalText(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return n + "th";
  }
  const suffixes = { 1: "st", 2: "nd", 3: "rd" };
  return n + (suffixes[n % 10] || "th");
}

// Swaps each {word} in a template for its value. A word with no value is left alone.
function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, function (match, key) {
    return key in values ? String(values[key]) : match;
  });
}

// Writes a date in the chosen style: "peasant", "scholar" or "merchant".
// festivalName is optional; only the Peasant style uses it.
function formatDateAs(styleId, date, festivalName) {
  if (styleId === "peasant" && festivalName) {
    return festivalName;
  }
  let style = DATE_STYLES[0];
  for (const candidate of DATE_STYLES) {
    if (candidate.id === styleId) {
      style = candidate;
    }
  }
  const d = dayOfYearToDate(date.dayOfYear);
  return fillTemplate(style.template, {
    day: d.dayOfSeason,
    season: d.season.name,
    seasonLetter: d.season.letter,
    year: date.year,
    num: d.tenday,
    ord: ordinalText(d.tenday),
    weekday: d.weekday.name,
    weekdayLetter: d.weekday.letter
  });
}