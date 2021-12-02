var randRange = (a, b) => Math.floor(a + Math.random() * (b - a));
var randElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const days = "Monday Tuesday Wednesday Thursday Friday".split(" ");
const colors = "Red Orange Yellow Green Blue Indigo Violet".split(" ");
const RECORD_COUNT = 1000;
const localStorageKey = `TEST_RECORDS_${RECORD_COUNT}`;
const priorities = "Low Medium High".split(" ");

var generateRecords = (n) =>
  Array(n)
    .fill()
    .map((_, i) => ({
      day: randElement(days),
      color: randElement(colors),
      length: randRange(1, 6),
      priority: randElement(priorities)
    }));

let storedJson = window.localStorage.getItem(localStorageKey);
var records = !!storedJson
  ? JSON.parse(storedJson)
  : generateRecords(RECORD_COUNT);
window.localStorage.setItem(localStorageKey, JSON.stringify(records));
export default records;
