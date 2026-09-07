const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/blog/[id].tsx', 'utf8');
if (content.includes("article.author_name") && content.includes("article.view_count")) {
  console.log('Author name and view count already correctly use dynamic data');
} else {
  console.log('Missing dynamic fields');
}
