const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/blog/[id].tsx', 'utf8');

if (content.includes('contentContainerStyle={{ paddingBottom: 120 }}')) {
  console.log("Padding bottom is set");
}
