const fs = require('fs');

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

const days = "Monday Tuesday Wednesday Thursday Friday Saturday Sunday".split(" ");
const colors = "Red Orange Yellow Green Blue Indigo Violet".split(" ");
const priorities = "Low Medium High".split(" ");
const softwareWords = 'system algorithm browser server website service data window user interface click download message error upload type process database'.split(' ');
const sentenceLengths = [5,9,13];
const artMedia = [
  'watercolor',
  'spray paint',
  'acrylic paint',
  'ink',
  'gouache',
  'graphite',
  'wax crayon',
  'colored pencil',
  'oil pastel',
  'acrylic ink',
  'collage'
];

const artSizes = [
  '9x12"',
  '11x14"',
  '12x18"'
];

const artTitleWords = [
  'woman',
  'man',
  'horse',
  'sunset',
  'petunias',
  'beach',
  'rain',
  'fruit',
  'sea',
  'sunlight',
  'reflection',
  'portrait'
];

const dataSets = [
  {
    name:'software-development-issues',
    createRecord: () => ({
      ['due by']: randElement(days),
      title: randElements(softwareWords, randElement(sentenceLengths)).join(' '),
      priority: randElement(priorities),
      ['story points']: randElement([1,2,3,5,8,13]),
      ['issue type']: randElement(['Bug','User Story']),
    })
  },
  {
    name:'artworks',
    createRecord: () => ({
      title: randElements(artTitleWords, randElement(sentenceLengths)).join(' '),
      ['color']: randElements(colors,randElement([1,2,3])),
      media: randElements(artMedia,randRange(1,4)),
      size: randElement(artSizes)
    })
  },
  {
    name:'sample-records',
    createRecord: () => ({
      days: randElements(days, 2),
      color: randElement(colors),
      length: randRange(1, 30),
      priority: randElement(priorities)
    })
  },
];

for(let dataSet of dataSets){
  let records = Array(1000).fill().map(dataSet.createRecord);
  fs.writeFileSync(`./public/sample-data/${dataSet.name}.json`, JSON.stringify(records,null,2));
}
fs.writeFileSync(`./public/sample-data/index.json`, JSON.stringify(dataSets.map(ds => '/sample-data/' + ds.name + '.json'),null,2));
