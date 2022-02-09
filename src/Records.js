var randRange = (a, b) => Math.floor(a + Math.random() * (b - a));
var randElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
var randElements = (arr, n) =>
  Array(Math.min(n, arr.length))
    .fill()
    .reduce(
      (state) => {
        //we want to avoid repeating terms, as that would be meaningless.
        let arr = [...state.arr];
        let i = Math.floor(Math.random() * state.arr.length);
        arr.splice(i, 1);
        return { arr, elems: [...state.elems, state.arr[i]] };
      },
      { arr: [...arr], elems: [] }
    ).elems;

const days = "Monday Tuesday Wednesday Thursday Friday".split(" ");
const colors = "Red Orange Yellow Green Blue Indigo Violet".split(" ");
const RECORD_COUNT = 1000;
const localStorageKey = `RECORDS_100_${RECORD_COUNT}`;
const priorities = "Low Medium High".split(" ");

var generateRecords = (n) =>
  Array(n)
    .fill()
    .map((_, i) => ({
      days: randElements(days, 2),
      color: randElement(colors),
      length: randRange(1, 30),
      priority: randElement(priorities)
    }));

let storedJson = window.localStorage.getItem(localStorageKey);
var records = !!storedJson
  ? JSON.parse(storedJson)
  : generateRecords(RECORD_COUNT);
window.localStorage.setItem(localStorageKey, JSON.stringify(records));
export default records;
