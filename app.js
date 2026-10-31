// app.js: builds what you see on the page and reacts to clicks.
// It needs calendar-data.js and calendar-logic.js to be loaded first.

// ---------------------------------------------------------------
// Settings
// ---------------------------------------------------------------
const STORAGE_KEY = "vandaalToday";   // the label our saved date is filed under
const STYLE_KEY = "vandaalDateStyle"; // the label our saved date style is filed under
const CALENDAR_KEY = "vandaalOtherCalendar"; // the label our saved calendar choice is filed under

// The calendars a player can switch on. "none" shows only the human calendar.
const OTHER_CALENDARS = [
  { id: "none",    label: "Human only" },
  { id: "dwarven", label: "Dwarven" },
];

// The quick-advance buttons. To add one, add a line here.
const ADVANCE_STEPS = [
  { label: "+1 day",    days: 1 },
  { label: "+2 days",   days: 2 },
  { label: "+3 days",   days: 3 },
  { label: "+5 days",   days: 5 },
  { label: "+1 tenday", days: DAYS_PER_WEEK }
];

// A lookup built once: day of the year -> the festivals on that day.
const festivalIndex = buildFestivalIndex();

// ---------------------------------------------------------------
// What the page remembers
// ---------------------------------------------------------------
// "today" is the in-game date the table is up to. The first time anyone visits,
// it starts at the first day of 714SL.
let today = { year: 714, dayOfYear: 1 };

// currentYear and currentSeason are what the calendar grid is SHOWING.
// You can browse other seasons without changing today's date.
let currentYear = today.year;
let currentSeason = 0;

// The day whose details are showing (1 to 200), or null for none.
let selectedDay = null;

// How dates are written: "peasant", "scholar" or "merchant".
let dateStyle = "peasant";

// Which other calendar is switched on: "none", "dwarven", 
let otherCalendar = "none";

// The two filters. "" means "show everything".
let filterPeople = "";
let filterCulture = "";

// ---------------------------------------------------------------
// Saving and loading the date in the browser
// ---------------------------------------------------------------
// localStorage is a small notebook inside the browser. It is private to this
// device and this browser. try/catch means "attempt this, and if the browser
// refuses, carry on anyway".
function saveToday() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(today));
  } catch (error) {
    // Saving is a convenience, so a failure is not an emergency.
  }
}

function loadToday() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Only trust the saved date if it is a real date.
      if (Number.isInteger(saved.year) && saved.year >= 1 &&
          Number.isInteger(saved.dayOfYear) &&
          saved.dayOfYear >= 1 && saved.dayOfYear <= DAYS_PER_YEAR) {
        today = { year: saved.year, dayOfYear: saved.dayOfYear };
      }
    }
  } catch (error) {
    // Nothing saved, or unreadable: keep the default date.
  }
}

// ---------------------------------------------------------------
// Date styles: Peasant, Scholar, Merchant
// ---------------------------------------------------------------
function saveStyle() {
  try {
    localStorage.setItem(STYLE_KEY, dateStyle);
  } catch (error) {
    // Saving is a convenience, so a failure is not an emergency.
  }
}

function loadStyle() {
  try {
    const saved = localStorage.getItem(STYLE_KEY);
    if (DATE_STYLES.some(function (style) { return style.id === saved; })) {
      dateStyle = saved;
    }
  } catch (error) {
    // Keep the default style.
  }
}

// The festival name a Peasant date uses for a day, or "" if there is none.
// When several festivals share a day, a human festival wins; if none of them
// is human, the first one in the data file is used.
function festivalNameFor(dayOfYear) {
  const festivals = festivalIndex[dayOfYear] || [];
  if (festivals.length === 0) {
    return "";
  }
  if (festivals.length > 1) {
    const human = festivals.filter(function (festival) {
      return festival.people.includes("human");
    });
    if (human.length > 0) {
      return human[0].name;
    }
  }
  return festivals[0].name;
}

// Writes a date in the style the player has chosen.
function displayDate(date) {
  return formatDateAs(dateStyle, date, festivalNameFor(date.dayOfYear));
}

// Builds the three style buttons once, when the page loads.
function buildStyleToggle() {
  const holder = document.getElementById("style-toggle");
  for (const style of DATE_STYLES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "style-button";
    button.textContent = style.label;
    button.dataset.style = style.id;
    button.addEventListener("click", function () {
      dateStyle = style.id;
      saveStyle();
      render();
    });
    holder.appendChild(button);
  }
}

// Marks the chosen style and shows its one-line explanation.
function updateStyleToggle() {
  const buttons = document.getElementById("style-toggle").children;
  for (const button of buttons) {
    button.setAttribute("aria-pressed", button.dataset.style === dateStyle ? "true" : "false");
  }
  for (const style of DATE_STYLES) {
    if (style.id === dateStyle) {
      document.getElementById("style-note").textContent = style.note;
    }
  }
}

// ---------------------------------------------------------------
// The other-calendar toggle
// ---------------------------------------------------------------
function saveCalendar() {
  try {
    localStorage.setItem(CALENDAR_KEY, otherCalendar);
  } catch (error) {
    // Saving is a convenience, so a failure is not an emergency.
  }
}

function loadCalendar() {
  try {
    const saved = localStorage.getItem(CALENDAR_KEY);
    if (OTHER_CALENDARS.some(function (calendar) { return calendar.id === saved; })) {
      otherCalendar = saved;
    }
  } catch (error) {
    // Keep the default: human only.
  }
}

// Builds the four calendar buttons once, when the page loads.
function buildCalendarToggle() {
  const holder = document.getElementById("calendar-toggle");
  for (const calendar of OTHER_CALENDARS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "style-button";
    button.textContent = calendar.label;
    button.dataset.calendar = calendar.id;
    button.addEventListener("click", function () {
      otherCalendar = calendar.id;
      saveCalendar();
      render();
    });
    holder.appendChild(button);
  }
}

// Marks the chosen calendar button as pressed.
function updateCalendarToggle() {
  const buttons = document.getElementById("calendar-toggle").children;
  for (const button of buttons) {
    button.setAttribute("aria-pressed", button.dataset.calendar === otherCalendar ? "true" : "false");
  }
}

// ---------------------------------------------------------------
// Festivals and filters
// ---------------------------------------------------------------
// The festivals on a day that pass the current filters.
function festivalsForDay(dayOfYear) {
  const all = festivalIndex[dayOfYear] || [];
  return all.filter(function (festival) {
    return festivalMatches(festival, filterPeople, filterCulture);
  });
}

// Fills the two filter drop-downs and listens for changes.
function buildFilters() {
  const peopleSelect = document.getElementById("filter-people");
  const cultureSelect = document.getElementById("filter-culture");

  const allPeople = document.createElement("option");
  allPeople.value = "";
  allPeople.textContent = "All peoples";
  peopleSelect.appendChild(allPeople);
  for (const people of PEOPLES) {
    const option = document.createElement("option");
    option.value = people.id;
    option.textContent = people.label;
    peopleSelect.appendChild(option);
  }

  const allCultures = document.createElement("option");
  allCultures.value = "";
  allCultures.textContent = "All cultures";
  cultureSelect.appendChild(allCultures);
  for (const culture of CULTURES) {
    const option = document.createElement("option");
    option.value = culture.id;
    option.textContent = culture.label;
    cultureSelect.appendChild(option);
  }

  peopleSelect.addEventListener("change", function () {
    filterPeople = peopleSelect.value;
    render();
  });
  cultureSelect.addEventListener("change", function () {
    filterCulture = cultureSelect.value;
    render();
  });
  document.getElementById("filter-clear").addEventListener("click", function () {
    filterPeople = "";
    filterCulture = "";
    peopleSelect.value = "";
    cultureSelect.value = "";
    render();
  });
}

// Says how many festivals the filters let through.
function renderFilterCount() {
  let shown = 0;
  for (const festival of FESTIVALS) {
    if (festivalMatches(festival, filterPeople, filterCulture)) {
      shown++;
    }
  }
  document.getElementById("filter-count").textContent =
    "Showing " + shown + " of " + FESTIVALS.length + " festivals";
}

// ---------------------------------------------------------------
// Day details
// ---------------------------------------------------------------
// Builds the card for one festival.
function buildFestivalCard(festival) {
  const card = document.createElement("article");
  card.className = "festival-card";

  const title = document.createElement("h3");
  title.textContent = festival.name;
  card.appendChild(title);

  const peopleLabels = festival.people.map(function (id) { return labelFor(PEOPLES, id); });
  const cultureLabels = festival.cultures.map(function (id) { return labelFor(CULTURES, id); });
  const parts = [];
  parts.push(peopleLabels.length > 0 ? "Peoples: " + peopleLabels.join(", ") : "Peoples: any");
  if (cultureLabels.length > 0) {
    parts.push("Culture: " + cultureLabels.join(", "));
  }
  const meta = document.createElement("p");
  meta.className = "festival-meta";
  meta.textContent = parts.join(" \u00b7 ");
  card.appendChild(meta);

  const description = document.createElement("p");
  description.textContent = festival.description;
  card.appendChild(description);

  return card;
}

// A small table showing one date written in all three styles.
function buildFormatTable(date) {
  const table = document.createElement("table");
  table.className = "format-table";
  const name = festivalNameFor(date.dayOfYear);
  for (const style of DATE_STYLES) {
    const row = document.createElement("tr");
    const label = document.createElement("th");
    label.textContent = style.label;
    const value = document.createElement("td");
    value.textContent = formatDateAs(style.id, date, name);
    row.appendChild(label);
    row.appendChild(value);
    table.appendChild(row);
  }
  return table;
}

// A small table of the day as the dwarves read it.
function buildDwarvenTable(date) {
  const d = dwarvenDate(date);
  const rows = [
    ["Day", "Score " + d.score + ", " + d.dayName + " (day " + d.dayInScore + " of 20)"],
    ["Year", formatDwarvenYear(date)],
    ["Half", d.half]
  ];
  if (d.gate) {
    rows.push(["Gate", d.gate.name + ", " + d.gate.note]);
  }
  if (d.eveOf) {
    rows.push(["Eve", "The eve of " + d.eveOf.name + ", a spirit night"]);
  }
  const table = document.createElement("table");
  table.className = "format-table";
  for (const pair of rows) {
    const row = document.createElement("tr");
    const label = document.createElement("th");
    label.textContent = pair[0];
    const value = document.createElement("td");
    value.textContent = pair[1];
    row.appendChild(label);
    row.appendChild(value);
    table.appendChild(row);
  }
  return table;
}



// Fills the "Day details" box for the selected day.
function renderDetails() {
  const body = document.getElementById("details-body");
  body.textContent = "";

  if (selectedDay === null) {
    const prompt = document.createElement("p");
    prompt.textContent = "Click a day on the calendar to see its festivals.";
    body.appendChild(prompt);
    return;
  }

  const date = { year: currentYear, dayOfYear: selectedDay };
  const isToday = date.year === today.year && date.dayOfYear === today.dayOfYear;
  const heading = document.createElement("p");
  heading.className = "details-date";
  heading.textContent = displayDate(date) + (isToday ? " (today)" : "");
  body.appendChild(heading);

  // Only the chosen other calendar is shown, and only in the chosen date style.
  if (otherCalendar !== "none") {
    const subhead = document.createElement("h3");
    subhead.className = "details-subhead";
    subhead.textContent = labelFor(OTHER_CALENDARS, otherCalendar) + " calendar";
    body.appendChild(subhead);
    body.appendChild(otherCalendar === "dwarven" ? buildDwarvenTable(date) : buildElvenTable(date, otherCalendar));
  }

  const festivals = festivalsForDay(selectedDay);
  if (festivals.length === 0) {
    const none = document.createElement("p");
    const anyAtAll = (festivalIndex[selectedDay] || []).length > 0;
    none.textContent = anyAtAll
      ? "No festivals on this day match the current filters."
      : "No festivals on this day.";
    body.appendChild(none);
    return;
  }

  for (const festival of festivals) {
    body.appendChild(buildFestivalCard(festival));
  }
}

// Marks the chosen day on the grid.
function markSelected() {
  const cells = document.getElementById("season-grid").children;
  for (const cell of cells) {
    if (cell.dataset.dayOfYear === undefined) {
      continue;   // the weekday headers have no day number
    }
    const isSelected = Number(cell.dataset.dayOfYear) === selectedDay;
    cell.classList.toggle("selected", isSelected);
    cell.setAttribute("aria-pressed", isSelected ? "true" : "false");
  }
}

function selectDay(dayOfYear) {
  selectedDay = dayOfYear;
  markSelected();
  renderDetails();
}

// ---------------------------------------------------------------
// Drawing the page
// ---------------------------------------------------------------
// Draws one season as a grid: 10 weekday names, then 50 numbered days.
function renderSeason(seasonIndex) {
  const grid = document.getElementById("season-grid");
  grid.textContent = "";  // clear the old grid first

  for (const weekday of WEEKDAYS) {
    const header = document.createElement("div");
    header.className = "weekday-header";
    header.textContent = weekday.name;
    grid.appendChild(header);
  }

  for (let day = 1; day <= DAYS_PER_SEASON; day++) {
    const dayOfYear = seasonIndex * DAYS_PER_SEASON + day;
    const festivals = festivalsForDay(dayOfYear);
    const isToday = currentYear === today.year && dayOfYear === today.dayOfYear;

    // Each day is a button, so it can be clicked or reached with the keyboard.
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.dataset.dayOfYear = dayOfYear;

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = day;
    cell.appendChild(number);

    if (festivals.length > 0) {
      cell.classList.add("has-festival");
      const label = document.createElement("span");
      label.className = "festival-label";
      label.textContent = festivals.length === 1
        ? festivals[0].name
        : festivals[0].name + " +" + (festivals.length - 1);
      cell.appendChild(label);
    }

    // The hover text and the screen-reader text.
    const names = festivals.map(function (festival) { return festival.name; });
    const spoken = displayDate({ year: currentYear, dayOfYear: dayOfYear }) +
      (names.length > 0 ? ". Festivals: " + names.join(", ") : ". No festivals") +
      (isToday ? ". Today" : "");
    cell.title = spoken;
    cell.setAttribute("aria-label", spoken);

    if (isToday) {
      cell.classList.add("today");
      cell.setAttribute("aria-current", "date");
    }

    cell.addEventListener("click", function () {
      selectDay(dayOfYear);
    });

    grid.appendChild(cell);
  }

  markSelected();
}

// Builds the four season tabs once, when the page loads.
function buildTabs() {
  const tabs = document.getElementById("season-tabs");
  for (let i = 0; i < SEASONS.length; i++) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "season-tab";
    tab.textContent = SEASONS[i].name;
    tab.dataset.season = i;   // lets CSS give this tab its own season's colours

    tab.addEventListener("click", function () {
      currentSeason = i;
      selectedDay = null;     // the details belong to the old season
      showMessage("");        // clear any old message from the tracker
      render();
    });

    tabs.appendChild(tab);
  }
}

// Marks the tab for the current season as pressed.
function updateTabs() {
  const tabs = document.getElementById("season-tabs").children;
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].setAttribute("aria-pressed", i === currentSeason ? "true" : "false");
  }
}

// Shows today's date in the banner.
function renderToday() {
  document.getElementById("today-text").textContent = displayDate(today);
  const age = ageForYear(today.year) || "No age recorded";
  document.getElementById("today-sub").textContent =
    today.year + "SL \u00b7 " + yearName(today.year) + " \u00b7 " + age;
  document.getElementById("today-dwarven").textContent = otherCalendar === "dwarven"
    ? "Dwarven: " + formatDwarvenDay(today) + " \u00b7 " + formatDwarvenYear(today)
    : "";
 }

// Redraws every part of the page from the remembered values.
function render() {
  document.body.dataset.season = currentSeason;   // switches the colour palette
  document.getElementById("season-title").textContent = SEASONS[currentSeason].name;

  const age = ageForYear(currentYear) || "No age recorded";
  document.getElementById("year-line").textContent =
    currentYear + "SL \u00b7 " + yearName(currentYear) + " \u00b7 " + age;

  document.getElementById("year-input").value = currentYear;
  renderToday();
  updateTabs();
  updateStyleToggle();
  updateCalendarToggle();
  renderFilterCount();
  renderSeason(currentSeason);
  renderDetails();
}

// ---------------------------------------------------------------
// The tracker: changing the date
// ---------------------------------------------------------------
function showMessage(text) {
  document.getElementById("tracker-message").textContent = text;
}

// Points the calendar grid at today's date, and shows that day's details.
function showTodayOnCalendar() {
  currentYear = today.year;
  currentSeason = dayOfYearToDate(today.dayOfYear).seasonIndex;
  selectedDay = today.dayOfYear;
}

// Copies today's date into the "Set date" boxes, so they match.
function fillSetDateForm() {
  document.getElementById("start-year").value = today.year;
  document.getElementById("start-season").value = dayOfYearToDate(today.dayOfYear).seasonIndex;
  document.getElementById("start-day").value = dayOfYearToDate(today.dayOfYear).dayOfSeason;
}

// Moves the date forward by a number of days and reports the change.
function advance(days) {
  const before = today;
  today = addDays(today, days);
  saveToday();
  showTodayOnCalendar();
  fillSetDateForm();
  render();
  const unit = days === 1 ? "day" : "days";
  showMessage("+" + days + " " + unit + ": " + displayDate(before) + " \u2192 " + displayDate(today));
}

// Builds the quick-advance buttons from the ADVANCE_STEPS list.
function buildAdvanceButtons() {
  const holder = document.getElementById("advance-buttons");
  for (const step of ADVANCE_STEPS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = step.label;
    button.addEventListener("click", function () {
      advance(step.days);
    });
    holder.appendChild(button);
  }
}

// Fills the season drop-down in the "Set date" form.
function buildSeasonSelect() {
  const select = document.getElementById("start-season");
  for (let i = 0; i < SEASONS.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = SEASONS[i].name;
    select.appendChild(option);
  }
}

// ---------------------------------------------------------------
// Listening for clicks and typing
// ---------------------------------------------------------------
// The year box that BROWSES the calendar. It does not change today's date.
const yearInput = document.getElementById("year-input");
yearInput.addEventListener("input", function () {
  const value = Number(yearInput.value);
  if (Number.isInteger(value) && value >= 1) {
    currentYear = value;
    render();
  }
});

// "Add" with a custom number of days.
document.getElementById("custom-add").addEventListener("click", function () {
  const days = Number(document.getElementById("custom-days").value);
  if (Number.isSafeInteger(days) && days >= 1) {
    advance(days);
  } else {
    showMessage("Enter a whole number of days, 1 or more.");
  }
});

// "Show today on the calendar".
document.getElementById("go-today").addEventListener("click", function () {
  showTodayOnCalendar();
  showMessage("");
  render();
});

// "Set date": a player types in a start date.
document.getElementById("set-date").addEventListener("click", function () {
  const year = Number(document.getElementById("start-year").value);
  const seasonIndex = Number(document.getElementById("start-season").value);
  const dayOfSeason = Number(document.getElementById("start-day").value);

  const date = makeDate(year, seasonIndex, dayOfSeason);
  if (date === null) {
    showMessage("Please enter a whole-number year of 1 or more, and a day from 1 to 50.");
    return;
  }

  today = date;
  saveToday();
  showTodayOnCalendar();
  render();
  showMessage("Date set to " + displayDate(today) + ".");
});

// ---------------------------------------------------------------
// Start up
// ---------------------------------------------------------------
buildTabs();
buildAdvanceButtons();
buildSeasonSelect();
buildFilters();
buildStyleToggle();
loadStyle();
buildCalendarToggle();
loadCalendar();
loadToday();
showTodayOnCalendar();
fillSetDateForm();
render();
