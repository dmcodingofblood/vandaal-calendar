// festivals.js: the "All festivals" page.
// It needs calendar-data.js and calendar-logic.js to be loaded first.

// The three filters. "" means "show everything".
let filterPeople = "";
let filterCulture = "";
let filterSeason = "";

// ---------------------------------------------------------------
// Working out the date text for a festival
// ---------------------------------------------------------------
// 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th" ...
function ordinal(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return n + "th";
  }
  const suffixes = { 1: "st", 2: "nd", 3: "rd" };
  return n + (suffixes[n % 10] || "th");
}

// "Snowmelt 5" or "Snowmelt 1 to 4"
function partText(season, from, to) {
  return SEASONS[season].name + " " + (from === to ? from : from + " to " + to);
}

// The plain-words date of a festival, built from its rule.
function festivalWhen(festival) {
  const rule = festival.rule;
  if (rule.type === "nthWeekday") {
    const dayOfSeason = (rule.ordinal - 1) * DAYS_PER_WEEK + rule.weekday + 1;
    return partText(rule.season, dayOfSeason, dayOfSeason) +
      " (" + ordinal(rule.ordinal) + " " + WEEKDAYS[rule.weekday].name + ")";
  }
  if (rule.type === "dayRange") {
    return partText(rule.season, rule.from, rule.to);
  }
  // multiRange: several stretches, such as Trinox
  return rule.parts.map(function (part) {
    return partText(part.season, part.from, part.to);
  }).join(", then ");
}

// Which season a festival starts in (0 to 3), used for sorting and grouping.
function startDay(festival) {
  return festivalDays(festival)[0];
}

function startSeason(festival) {
  return Math.floor((startDay(festival) - 1) / DAYS_PER_SEASON);
}

// ---------------------------------------------------------------
// Drawing the page
// ---------------------------------------------------------------
function buildCard(festival) {
  const card = document.createElement("article");
  card.className = "festival-card";

  const title = document.createElement("h3");
  title.textContent = festival.name;
  card.appendChild(title);

  const when = document.createElement("p");
  when.className = "festival-when";
  when.textContent = festivalWhen(festival);
  card.appendChild(when);

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

// Does a festival pass all three filters?
function passes(festival) {
  if (!festivalMatches(festival, filterPeople, filterCulture)) {
    return false;
  }
  return filterSeason === "" || startSeason(festival) === Number(filterSeason);
}

function render() {
  const list = document.getElementById("festival-list");
  const links = document.getElementById("season-links");
  list.textContent = "";
  links.textContent = "";

  // Keep the festivals that pass, in calendar order.
  const shown = FESTIVALS.filter(passes).sort(function (a, b) {
    return startDay(a) - startDay(b);
  });
  document.getElementById("filter-count").textContent =
    "Showing " + shown.length + " of " + FESTIVALS.length + " festivals";

  if (shown.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "No festivals match these filters.";
    list.appendChild(empty);
    return;
  }

  // One section per season that has at least one festival.
  for (let season = 0; season < SEASONS.length; season++) {
    const inSeason = shown.filter(function (festival) {
      return startSeason(festival) === season;
    });
    if (inSeason.length === 0) {
      continue;
    }

    const section = document.createElement("section");
    section.className = "season-section";
    section.id = "season-" + season;
    section.dataset.season = season;   // gives the section its season's colours

    const heading = document.createElement("h2");
    heading.textContent = SEASONS[season].name + " (" + inSeason.length + ")";
    section.appendChild(heading);
    for (const festival of inSeason) {
      section.appendChild(buildCard(festival));
    }
    list.appendChild(section);

    const link = document.createElement("a");
    link.className = "season-link";
    link.href = "#season-" + season;
    link.dataset.season = season;
    link.textContent = SEASONS[season].name;
    links.appendChild(link);
  }
}

// ---------------------------------------------------------------
// Filters
// ---------------------------------------------------------------
function addOption(select, value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  select.appendChild(option);
}

function buildFilters() {
  const peopleSelect = document.getElementById("filter-people");
  const cultureSelect = document.getElementById("filter-culture");
  const seasonSelect = document.getElementById("filter-season");

  addOption(peopleSelect, "", "All peoples");
  for (const people of PEOPLES) {
    addOption(peopleSelect, people.id, people.label);
  }
  addOption(cultureSelect, "", "All cultures");
  for (const culture of CULTURES) {
    addOption(cultureSelect, culture.id, culture.label);
  }
  addOption(seasonSelect, "", "All seasons");
  for (let i = 0; i < SEASONS.length; i++) {
    addOption(seasonSelect, String(i), SEASONS[i].name);
  }

  peopleSelect.addEventListener("change", function () {
    filterPeople = peopleSelect.value;
    render();
  });
  cultureSelect.addEventListener("change", function () {
    filterCulture = cultureSelect.value;
    render();
  });
  seasonSelect.addEventListener("change", function () {
    filterSeason = seasonSelect.value;
    render();
  });
  document.getElementById("filter-clear").addEventListener("click", function () {
    filterPeople = "";
    filterCulture = "";
    filterSeason = "";
    peopleSelect.value = "";
    cultureSelect.value = "";
    seasonSelect.value = "";
    render();
  });
}

// Start up.
buildFilters();
render();
