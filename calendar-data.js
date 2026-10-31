  // calendar-data.js
// All of Vandaal's calendar lore lives in this one file.
// Lines starting with // are comments: notes for humans that the browser ignores.
// Sources: "World Enough Time" (your doc), "An Explorer's Guide to Vandaal" (the guide),
// and your own wording from the Vandaal Festivals (Revised List) doc.
// Rulings: your answers recorded in the Calendar Project Plan, section 4.

// ---------------------------------------------------------------
// 1. THE SHAPE OF THE YEAR
// ---------------------------------------------------------------
const DAYS_PER_WEEK = 10;    // a week is called a tenday
const DAYS_PER_SEASON = 50;  // 5 tendays
const DAYS_PER_YEAR = 200;   // 4 seasons of 50 days

// Computers count lists from 0, not 1. So SEASONS[0] is Snowmelt,
// SEASONS[1] is Greenmeet, and so on. Keep that in mind in later phases.

const SEASONS = [
  { name: "Snowmelt",   letter: "S" },
  { name: "Greenmeet",  letter: "G" },
  { name: "Harvestide", letter: "H" },
  { name: "Tundrafall", letter: "T" }
];

const WEEKDAYS = [
  { name: "Lathan",     letter: "L" },
  { name: "Colsh",      letter: "C" },
  { name: "Runnersday", letter: "R" },
  { name: "Doleday",    letter: "D" },
  { name: "Petrin",     letter: "P" },
  { name: "Kinsday",    letter: "K" },
  { name: "Vurr",       letter: "V" },
  { name: "Ballastday", letter: "B" },
  { name: "Yoreday",    letter: "Y" },
  { name: "Silday",     letter: "S" }
];

// ---------------------------------------------------------------
// 2. YEAR NAMES (adriconyms), keyed by year number SL
// ---------------------------------------------------------------
// 698 to 713 come from the guide (p. 39). 714 comes from World Enough Time.
// Years with no entry here have no recorded name yet.
const YEAR_NAMES = {
  698: "Year of the Faltered Flame",
  699: "Year of the Lost Guardsman",
  700: "Year of the Mage Star",
  701: "Year of the Fractured Realm",
  702: "Year of the Harrowed Kingdom",
  703: "Year of the False Justice",
  704: "Year of the Uprising Ocean",
  705: "Year of the Blue Warlord",
  706: "Year of the Great Comet",
  707: "Year of the Undying Priest",
  708: "Year of the Iron Longboat",
  709: "Year of the High Inquisitor",
  710: "Year of the Crimson Wound",
  711: "Year of the Risen Ultramind",
  712: "Year of the Polite Fletcher",
  713: "Year of the Devastated Mountain",
  714: "Year of the Hollow Tree"
};

// ---------------------------------------------------------------
// 3. AGES, each starting in the given year SL
// ---------------------------------------------------------------
// An age lasts until the next one in the list begins.
// Note: the guide gives the Great Disorder as 204 to 458 and the
// Second Age of Conquest (our Solar Age) as starting in 461, so
// 459 and 460 fall in a gap. For now they count as the Great Disorder.
const AGES = [
  { name: "First Age of Conquest", startYear: 1 },
  { name: "The Skold",             startYear: 135 },
  { name: "The Great Disorder",    startYear: 204 },
  { name: "Solar Age",             startYear: 461 },  // Tagus forms the Solgarb Empire
  { name: "Fractured Age",         startYear: 697 }   // Good King Roland dies
];

// ---------------------------------------------------------------
// 4. DATE FORMATS (Peasant, Scholar, Merchant)
// ---------------------------------------------------------------
// These are templates. Words in { } get filled in by code in a later phase.
//   {day}           the day of the season, 1 to 50
//   {season}        season name, such as Snowmelt
//   {seasonLetter}  S, G, H or T
//   {year}          year number, such as 714
//   {num}           which tenday of the season this is as a plain number, such as 3
//   {ord}           the same, as an ordinal such as 3rd
//   {weekday}       weekday name, such as Runnersday
//   {weekdayLetter} first letter of the weekday, such as R
//   {festival}      the festival name, if the day is a festival
const DATE_FORMATS = {
  peasant:  "{festival}, otherwise {season} {day}",
  scholar:  "{year}SL-{seasonLetter}-{num}{weekdayLetter}",
  merchant: "{ord} {weekday}, {season}, {year}SL"
};

// ---------------------------------------------------------------
// 5. PEOPLES AND CULTURES (used by the page's filter)
// ---------------------------------------------------------------
const PEOPLES = [
  { id: "human",      label: "Humans" },
  { id: "dwarf",      label: "Dwarves" },
  { id: "elf",        label: "Elves" },
  { id: "dragonborn", label: "Dragonborn" },
  { id: "giantkin",   label: "Giantkin" },
  { id: "glaas",      label: "Glaas" },
  { id: "halfling",   label: "Halflings" },
  { id: "orckai",     label: "Orckai" },
  { id: "blooded",    label: "Blooded" },
  { id: "tiefling",   label: "Tieflings" },
  { id: "gnome",   label: "Gnome" }
];

// Only cultures that have at least one festival appear here.
// Monastic, Plains and Swamp have none yet, so they are left out for now.
const CULTURES = [
  { id: "akrafall",            label: "Akrafall" },
  { id: "coastal",             label: "Coastal" },
  { id: "craftculture",        label: "Craftculture" },
  { id: "forest",              label: "Forest" },
  { id: "hill",                label: "Hill" },
  { id: "mountain",            label: "Mountain" },
  { id: "rivers",              label: "Rivers" },
  { id: "urban",               label: "Urban (Vayben)" },
  { id: "dwarvven-stronghold", label: "Dwarvven Stronghold" },
  { id: "elven-enclave",       label: "Elven Enclave" },
  { id: "halfling-cosyhut",    label: "Halfling Cosyhut" },
  { id: "orc-tribal",          label: "Orc Tribal" },
  { id: "wovoraxx",            label: "Wovoraxx" }
];

// ---------------------------------------------------------------
// 6. FESTIVALS (69), in the order of the Revised List doc
// ---------------------------------------------------------------
// Each festival has a RULE, not a fixed day number. Code works out the day.
//   { type: "nthWeekday", season, ordinal, weekday }
//        e.g. the 3rd Petrin of Greenmeet. season 0 to 3, ordinal 1 to 5, weekday 0 to 9.
//   { type: "dayRange", season, from, to }
//        a run of days within one season, 1 to 50.
//   { type: "multiRange", parts: [ {season, from, to}, ... ] }
//        a festival that runs over several stretches, such as Trinox, which
//        spans the end of Tundrafall and the first day of Snowmelt.
// "people" says which peoples keep the festival. An empty list means any people
// (such festivals show under a people filter once a culture is chosen too).
// "cultures" says which cultures keep it. An empty list means no particular culture.
const FESTIVALS = [
  {
    id: "wintercrash", name: "Wintercrash",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 3, ordinal: 5, weekday: 9 },   // Tundrafall 5th Silday
    description: "A day of rest for all. Warmth and sunlight are only a day away. People recount the year's tales, talk of politics and war, make new promises and update maps."
  },
  {
    id: "mournhold", name: "Mournhold",
    people: ["human"], cultures: [],
    rule: { type: "dayRange", season: 0, from: 1, to: 4 },
    description: "A period of mourning to remember those who died in the winter. Not even the temple bells ring."
  },
  {
    id: "pancake-day", name: "Pancake Day",
    people: ["human", "elf", "blooded"], cultures: [],
    rule: { type: "dayRange", season: 0, from: 5, to: 5 },
    description: "An inherited elven festival that involves feasts and merriments to celebrate the end of Tundrafall."
  },
  {
    id: "sober-wonders", name: "The Day of Sober Wonders",
    people: ["human", "gnome"], cultures: [],
    rule: { type: "nthWeekday", season: 0, ordinal: 4, weekday: 2 },   // Snowmelt 4th Runnersday
    description: "Gnomes and artificers show off their mechanical inventions be they success or failure."
  },
  {
    id: "seed-and-run", name: "Seed and Run",
    people: ["human"], cultures: [],
    rule: { type: "dayRange", season: 0, from: 10, to: 25 },
    description: "The festival celebrating the successful planting and weeding of a community. Cattle and sheep are herded vast distances and large markets are held."
  },
  {
    id: "marritide", name: "Marritide",
    people: ["human"], cultures: [],
    rule: { type: "dayRange", season: 1, from: 1, to: 1 },
    description: "Traditionally the most blessed day to have a wedding, this is also a festival where officials are sworn in and other legal papers are signed."
  },
  {
    id: "ahghairons-day", name: "Ahghairon's Day",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 1, ordinal: 3, weekday: 4 },   // Greenmeet 3rd Petrin
    description: "Rulers tour their subjects, in imitation of a legendary Solgarb emperor."
  },
  {
    id: "mercenary-fair", name: "Mercenary Fair",
    people: [], cultures: [],
    rule: { type: "nthWeekday", season: 1, ordinal: 4, weekday: 8 },   // Greenmeet 4th Yoreday
    description: "A festival where sellswords travel to settlements to offer their service. Often a very rowdy affair, with some settlements completely overrun by mercenaries."
  },
  {
    id: "guildhall-day", name: "Guildhall Day",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 2, ordinal: 2, weekday: 0 },   // Harvestide 2nd Lathan
    description: "All the shops close as guild members take the day to go to their main guildhalls for annual meetings. Often a time where guild donations are collected."
  },
  {
    id: "feyday", name: "Feyday",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 2, ordinal: 2, weekday: 2 },   // Harvestide 2nd Runnersday
    description: "The boundary between worlds is at its weakest. Rural folk lock their doors and cities hold masked balls."
  },
  {
    id: "last-sheaf", name: "Last Sheaf",
    people: ["human"], cultures: [],
    rule: { type: "dayRange", season: 2, from: 40, to: 50 },
    description: "A week of reaping the harvest ending in an enormous feast. Also a day of repairing storehouses and letter-sending."
  },
  {
    id: "dragondown", name: "Dragondown",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 3, ordinal: 1, weekday: 5 },   // Tundrafall 1st Kinsday
    description: "An ancient rite. Tribute is offered in dragon territory. Those blessedly free of such creatures tell tales of dragon-slaying."
  },
  {
    id: "simril", name: "Simril",
    people: ["human", "elf"], cultures: [],
    rule: { type: "nthWeekday", season: 3, ordinal: 3, weekday: 6 },   // Tundrafall 3rd Vurr
    description: "Rumour has it this night is always the clearest. It is a stargazing festival, with whole towns observing the sky. Hermit wisezem venture to civilisation to educate - for the price of some spiced wine, of course."
  },
  {
    id: "liars-night", name: "Liar's Night",
    people: ["human", "tiefling"], cultures: [],
    rule: { type: "nthWeekday", season: 3, ordinal: 4, weekday: 1 },   // Tundrafall 4th Colsh
    description: "No-one ever makes deals or swears oaths on this day. Jesters act as kings. Pranks, disguises, and petty crime are rampant. In lawless times, this festival can wipe out entire villages."
  },
  {
    id: "distillery-day", name: "Distillery Day",
    people: ["human", "gnome", "dwarf"], cultures: [],
    rule: { type: "nthWeekday", season: 0, ordinal: 1, weekday: 6 },   // Snowmelt 1st Vurr
    description: "Tekkar's worshippers and many brewers begin thawing frozen liquids, ink and alcohol."
  },
  {
    id: "brightdark", name: "Brightdark",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 0, ordinal: 3, weekday: 0 },   // Snowmelt 3rd Lathan
    description: "Priests of the sun god light fires at dawn and offer to purge dark places of monsters."
  },
  {
    id: "dhaaram-horse-fair", name: "Dhaaram Horse Fair",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 1, ordinal: 1, weekday: 2 },   // Greenmeet 1st Runnersday
    description: "A flinty horse fair for breeders and riders."
  },
  {
    id: "neskas-threads", name: "Neska's Threads",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 1, ordinal: 2, weekday: 6 },   // Greenmeet 2nd Vurr
    description: "Couples and friends tie red threads to doors and trees for the spirit of love."
  },
  {
    id: "titheday-hydrr", name: "Titheday (Hydrr)",
    people: ["human"], cultures: ["coastal"],
    rule: { type: "nthWeekday", season: 1, ordinal: 3, weekday: 7 },   // Greenmeet 3rd Ballastday
    description: "Coastal cities give the bounties of the sea and gold to calm both heads of the weather goddess."
  },
  {
    id: "duesday", name: "Duesday",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 2, ordinal: 3, weekday: 3 },   // Harvestide 3rd Doleday
    description: "An administrative procedure that a few diehard followers of Baast have turned into a festival, to make it more palatable."
  },
  {
    id: "waymeet", name: "Waymeet",
    people: [], cultures: [],
    rule: { type: "dayRange", season: 2, from: 31, to: 40 },
    description: "A tenday in which pilgrims and communities maintain the roadside shrines of the empty road."
  },
  {
    id: "parting-verse", name: "Parting Verse",
    people: ["human", "orckai"], cultures: [],
    rule: { type: "nthWeekday", season: 2, ordinal: 4, weekday: 4 },   // Harvestide 4th Petrin
    description: "People practise the last ballads together before returning to the winter, taking the songs with them."
  },
  {
    id: "svalachecking", name: "Svalachecking",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 3, ordinal: 2, weekday: 0 },   // Tundrafall 2nd Lathan
    description: "A lantern festival in the first week of winter where families assure the children that no one has been left behind. First-time parents are customarily given svalabears."
  },
  {
    id: "titheday-iskygge", name: "Titheday (Iskygge)",
    people: ["human"], cultures: [],
    rule: { type: "nthWeekday", season: 3, ordinal: 3, weekday: 4 },   // Tundrafall 3rd Petrin
    description: "Every winter day is equally dark, but this is the halfway point of the season, when settlements give a tithe to the Frozen Horror, traditionally an animal."
  },
  {
    id: "oath-day", name: "Oath Day (Calan Haf)",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "dayRange", season: 0, from: 1, to: 1 },
    description: "The first gate of the year, when dwarves swear oaths. It falls on the same day as human Mournhold."
  },
  {
    id: "givingsweek", name: "Givingsweek",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "dayRange", season: 0, from: 11, to: 20 },
    description: "Miners work ten days without rest and give their finds to the poor."
  },
  {
    id: "ordview-festival", name: "Ordview Festival",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "nthWeekday", season: 0, ordinal: 4, weekday: 9 },   // Snowmelt 4th Silday
    description: "Smiths compete to show the finest craftsmanship, judged on the quality of the work above all."
  },
  {
    id: "cold-iron-vow", name: "The Cold Iron Vow",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "nthWeekday", season: 2, ordinal: 2, weekday: 2 },   // Harvestide 2nd Runnersday
    description: "The inquisition of Llach Khrushar renews its vow against the evils of the Dreadwode, whilst leatherworkers show armour made from monster hides."
  },
  {
    id: "harvestgulp", name: "Harvestgulp",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "nthWeekday", season: 2, ordinal: 3, weekday: 6 },   // Harvestide 3rd Vurr
    description: "Brewers show off the year's ales, and the drinking begins."
  },
  {
    id: "calan-gaeaf", name: "Calan Gaeaf",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "dayRange", season: 2, from: 1, to: 1 },
    description: "The second gate of the year. On the eve, undertakers follow the Guide of the Dead and a spade is carried for those about to die."
  },
  {
    id: "night-of-the-battleballad", name: "Night of the Battleballad",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "nthWeekday", season: 1, ordinal: 5, weekday: 7 },   // Greenmeet 5th Ballastday
    description: "Halls and barracks ring with the ballads of dwarven military triumph, and tourneys are held."
  },
  {
    id: "thardraks-shieldwatch", name: "Thardrak's Shieldwatch",
    people: ["dwarf"], cultures: ["dwarvven-stronghold"],
    rule: { type: "nthWeekday", season: 3, ordinal: 1, weekday: 7 },   // Tundrafall 1st Ballastday
    description: "Strongholds drill and renew their wards for the cold months."
  },
  {
    id: "vitas-waking", name: "Vi'ta's Waking",
    people: ["elf"], cultures: ["elven-enclave"],
    rule: { type: "nthWeekday", season: 0, ordinal: 4, weekday: 5 },   // Snowmelt 4th Kinsday
    description: "Elves of the Leaf sign gather to cultivate and wake the forest."
  },
  {
    id: "the-choosing", name: "The Choosing",
    people: ["elf"], cultures: ["elven-enclave"],
    rule: { type: "nthWeekday", season: 1, ordinal: 2, weekday: 9 },   // Greenmeet 2nd Silday
    description: "Elves around a century old each pick one constellation to follow for the first time."
  },
  {
    id: "litas-night", name: "Li'ta's Night",
    people: ["elf"], cultures: ["elven-enclave"],
    rule: { type: "nthWeekday", season: 1, ordinal: 4, weekday: 6 },   // Greenmeet 4th Vurr
    description: "A huge party full of pleasures."
  },
  {
    id: "lithandus-dance", name: "Lithandus' Dance",
    people: ["elf"], cultures: ["elven-enclave"],
    rule: { type: "nthWeekday", season: 1, ordinal: 5, weekday: 0 },   // Greenmeet 5th Lathan
    description: "Elves dance in the sun's vivid warmth, at the first light of the tenday."
  },
  {
    id: "dolores-turning", name: "Dolore's Turning",
    people: ["elf"], cultures: ["elven-enclave"],
    rule: { type: "nthWeekday", season: 2, ordinal: 3, weekday: 0 },   // Harvestide 3rd Lathan
    description: "Elven bodies often do not rot without intervention. On this night, their dead are returned to the soil and buried so they can be returned to nature."
  },
  {
    id: "trinox", name: "Trinox (Three Nights)",
    people: ["elf"], cultures: ["elven-enclave"],
    rule: { type: "multiRange", parts: [ { season: 3, from: 49, to: 50 }, { season: 0, from: 1, to: 1 } ] },
    description: "Three nights at the turn of the year. The scrolls of Adric are opening - the year's song is sung, and it names the year."
  },
  {
    id: "myelraans-spell-festival", name: "Myelraan's Spell Festival",
    people: ["dragonborn"], cultures: ["wovoraxx"],
    rule: { type: "nthWeekday", season: 0, ordinal: 2, weekday: 1 },   // Snowmelt 2nd Colsh
    description: "Clans honour Myelraan and show-off the year's new spells."
  },
  {
    id: "dohalzaars-ranking", name: "Dohalzaar's Ranking",
    people: ["dragonborn"], cultures: ["wovoraxx"],
    rule: { type: "nthWeekday", season: 0, ordinal: 4, weekday: 7 },   // Snowmelt 4th Ballastday
    description: "Initiation tests for wovoraxxes are held on this day."
  },
  {
    id: "five-day-pilgrimage", name: "The Five Day Pilgrimage",
    people: ["dragonborn"], cultures: ["wovoraxx"],
    rule: { type: "dayRange", season: 1, from: 11, to: 15 },
    description: "A five-day march without rest, honouring Envirohiade's own march of five days."
  },
  {
    id: "kuthidraxxs-patience-day", name: "Kuthidraxx's Patience Day",
    people: ["dragonborn"], cultures: ["wovoraxx"],
    rule: { type: "nthWeekday", season: 2, ordinal: 1, weekday: 8 },   // Harvestide 1st Yoreday
    description: "A day of fasting and doing nothing, for the god of patience."
  },
  {
    id: "cairn-stacking", name: "Cairn-Stacking",
    people: ["giantkin"], cultures: [],
    rule: { type: "nthWeekday", season: 2, ordinal: 4, weekday: 7 },   // Harvestide 4th Ballastday
    description: "Each climber stacks a cairn. The widest and tallest one wins."
  },
  {
    id: "standard-weaving", name: "Standard-Weaving",
    people: ["dragonborn"], cultures: ["wovoraxx"],
    rule: { type: "nthWeekday", season: 3, ordinal: 2, weekday: 3 },   // Tundrafall 2nd Doleday
    description: "Clans weave new standards that carry their deity's symbol and repair the battle-marked ones of old."
  },
  {
    id: "praetakeks-vigil", name: "Praetakek's Vigil",
    people: ["dragonborn"], cultures: ["wovoraxx"],
    rule: { type: "nthWeekday", season: 3, ordinal: 3, weekday: 9 },   // Tundrafall 3rd Silday
    description: "Burial rites for the fallen, and executions of imprisoned dragons."
  },
  {
    id: "snowcrown", name: "Snowcrown",
    people: ["giantkin"], cultures: ["mountain"],
    rule: { type: "nthWeekday", season: 3, ordinal: 4, weekday: 7 },   // Tundrafall 4th Ballastday
    description: "Mountain goliaths climb the harshest faces possible in a race to the top."
  },
  {
    id: "thaws-naming", name: "Thaw's Naming",
    people: ["blooded"], cultures: [],
    rule: { type: "nthWeekday", season: 0, ordinal: 1, weekday: 5 },   // Snowmelt 1st Kinsday
    description: "Half-blood children traditionally choose which parent's name to carry on this day."
  },
  {
    id: "party-on-back-snowmelt", name: "Party-on-Back (Snowmelt)",
    people: ["halfling"], cultures: ["halfling-cosyhut"],
    rule: { type: "nthWeekday", season: 0, ordinal: 3, weekday: 5 },   // Snowmelt 3rd Kinsday
    description: "Halflings renew their bond with the giant beasts they live on. It happens once every season."
  },
  {
    id: "marking-night", name: "Marking Night",
    people: ["tiefling"], cultures: [],
    rule: { type: "nthWeekday", season: 0, ordinal: 5, weekday: 3 },   // Snowmelt 5th Doleday
    description: "Horns, tails and skin colours are shown and compared. It is also used to help find a tiefling a home among similar people who accept them."
  },
  {
    id: "driftday", name: "Driftday",
    people: ["glaas","elf"], cultures: ["coastal"],
    rule: { type: "nthWeekday", season: 1, ordinal: 2, weekday: 8 },   // Greenmeet 2nd Yoreday
    description: "Aquatic peoples leave offerings to the currents. It is highly offensive to take any that wash up on a beach."
  },
  {
    id: "ancestors-feeding", name: "Ancestors' Feeding",
    people: ["glaas"], cultures: [],
    rule: { type: "nthWeekday", season: 1, ordinal: 3, weekday: 1 },   // Greenmeet 3rd Colsh
    description: "The dead are repurposed so that the Lizard God's hunger is not awakened."
  },
  {
    id: "party-on-back-greenmeet", name: "Party-on-Back (Greenmeet)",
    people: ["halfling"], cultures: ["halfling-cosyhut"],
    rule: { type: "nthWeekday", season: 1, ordinal: 3, weekday: 5 },   // Greenmeet 3rd Kinsday
    description: "Halflings renew their bond with the giant beasts they live on. It happens once every season."
  },
  {
    id: "annual-orc-moot", name: "The Annual Orc Moot",
    people: ["orckai"], cultures: ["orc-tribal"],
    rule: { type: "nthWeekday", season: 1, ordinal: 5, weekday: 5 },   // Greenmeet 5th Kinsday
    description: "Orcs braid their hair and decorate it with objects that show their tribe's style. They meet and mingle, reminded that they are all Shaka's children."
  },
  {
    id: "tithe-day", name: "Tithe Day",
    people: ["tiefling"], cultures: [],
    rule: { type: "nthWeekday", season: 2, ordinal: 2, weekday: 3 },   // Harvestide 2nd Doleday
    description: "Tieflings, usually infernal ones, make offerings to Asmodeus to forgive them."
  },
  {
    id: "party-on-back-harvestide", name: "Party-on-Back (Harvestide)",
    people: ["halfling"], cultures: ["halfling-cosyhut"],
    rule: { type: "nthWeekday", season: 2, ordinal: 3, weekday: 5 },   // Harvestide 3rd Kinsday
    description: "Halflings renew their bond with the giant beasts they live on. It happens once every season."
  },
  {
    id: "bloodfire-night", name: "Bloodfire Night",
    people: ["orckai"], cultures: ["orc-tribal"],
    rule: { type: "nthWeekday", season: 2, ordinal: 5, weekday: 7 },   // Harvestide 5th Ballastday
    description: "After the harvest and before the frost, orckai burn collected crop scraps, wood scraps and other leftovers in great fires."
  },
  {
    id: "ratcatchers-banquet", name: "Ratcatcher's Banquet",
    people: ["halfling"], cultures: ["halfling-cosyhut"],
    rule: { type: "nthWeekday", season: 3, ordinal: 3, weekday: 1 },   // Tundrafall 3rd Colsh
    description: "Halflings tell the most absurd stories they can, without consequence."
  },
  {
    id: "party-on-back-tundrafall", name: "Party-on-Back (Tundrafall)",
    people: ["halfling"], cultures: ["halfling-cosyhut"],
    rule: { type: "nthWeekday", season: 3, ordinal: 3, weekday: 5 },   // Tundrafall 3rd Kinsday
    description: "Halflings renew their bond with the giant beasts they live on. It happens once every season."
  },
  {
    id: "antlerfall", name: "Antlerfall",
    people: ["glaas"], cultures: [],
    rule: { type: "nthWeekday", season: 3, ordinal: 4, weekday: 5 },   // Tundrafall 4th Kinsday
    description: "Highland elk-people bury a single bone for Arzu."
  },
  {
    id: "exiles-counting", name: "Exile's Counting",
    people: [], cultures: ["akrafall"],
    rule: { type: "nthWeekday", season: 0, ordinal: 2, weekday: 9 },   // Snowmelt 2nd Silday
    description: "Convicts tally the days they have survived and name those who did not."
  },
  {
    id: "new-growth-festival", name: "New Growth Festival",
    people: [], cultures: ["forest"],
    rule: { type: "nthWeekday", season: 0, ordinal: 3, weekday: 1 },   // Snowmelt 3rd Colsh
    description: "Each settlement plants a tree for every child born."
  },
  {
    id: "census-day", name: "Census Day",
    people: [], cultures: ["urban"],
    rule: { type: "nthWeekday", season: 1, ordinal: 1, weekday: 9 },   // Greenmeet 1st Silday
    description: "A Solgarb custom that applies only to the capital, Vayben: tax rolls are updated and everyone is counted."
  },
  {
    id: "longboat-races", name: "Longboat Races",
    people: [], cultures: ["coastal", "rivers"],
    rule: { type: "nthWeekday", season: 1, ordinal: 2, weekday: 7 },   // Greenmeet 2nd Ballastday
    description: "Crews race sailboats and shallow longboats."
  },
  {
    id: "greatauction", name: "Greatauction",
    people: [], cultures: ["craftculture"],
    rule: { type: "nthWeekday", season: 1, ordinal: 4, weekday: 3 },   // Greenmeet 4th Doleday
    description: "Patrons bid for specialised goods."
  },
  {
    id: "pass-closing-day", name: "Pass-Closing Day",
    people: [], cultures: ["mountain"],
    rule: { type: "nthWeekday", season: 2, ordinal: 5, weekday: 3 },   // Harvestide 5th Doleday
    description: "Passes are marked closed before the snow."
  },
  {
    id: "masterpiece-day", name: "Masterpiece Day",
    people: [], cultures: ["craftculture"],
    rule: { type: "nthWeekday", season: 2, ordinal: 4, weekday: 9 },   // Harvestide 4th Silday
    description: "Apprentices present a first masterwork to guild judges."
  },
  {
    id: "husbat-moot", name: "Husbat Moot",
    people: [], cultures: ["rivers"],
    rule: { type: "nthWeekday", season: 2, ordinal: 5, weekday: 2 },   // Harvestide 5th Runnersday
    description: "An old Skoldmyrr custom: husbats moor together to swap post and news."
  },
  {
    id: "hush-of-the-wode", name: "Hush of the Wode",
    people: [], cultures: ["forest"],
    rule: { type: "nthWeekday", season: 3, ordinal: 3, weekday: 2 },   // Tundrafall 3rd Runnersday
    description: "No one speaks, to listen to the forest."
  },
  {
    id: "winter-garrison-feast", name: "Winter Garrison Feast",
    people: [], cultures: ["hill"],
    rule: { type: "nthWeekday", season: 3, ordinal: 5, weekday: 4 },   // Tundrafall 5th Petrin
    description: "A big feast using the last of the fresh food from outside the walls."
  }
];
