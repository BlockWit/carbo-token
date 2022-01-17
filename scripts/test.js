const fs = require('fs');

function splitCSV (filename, name) {
  const file = fs.readFileSync(filename, 'utf-8');
  const lines = file.split(/\r\n|\n/).filter(s => s);
  const chunks = split(lines, 200);
  chunks.forEach((chunk, idx) => {
    chunk.forEach(line => fs.appendFileSync(`${name}_${idx}.csv`, line + "\n"));
  });
}

function split (arr, len) {

  var chunks = [],
    i = 0,
    n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}
splitCSV('distribution/investors_public.csv', 'investors_public.csv');
