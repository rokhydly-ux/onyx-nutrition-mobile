const fs = require('fs');
let content = fs.readFileSync('app/(tabs)/shop.tsx', 'utf8');

// 1. Move Gauge INSIDE the ScrollView to prevent it from blocking the layout flex space
const gaugeRegex = /\{\/\* Free Delivery Gauge \*\/\}\s*\{shopCart\.length > 0 && \([\s\S]*?<\/View>\s*\)\s*\}/;

const gaugeMatch = content.match(gaugeRegex);

if (gaugeMatch) {
    const gaugeCode = gaugeMatch[0];

    // Remove it from its original place
    content = content.replace(gaugeCode, "");

    // Insert it inside the ScrollView right before shopCart.map
    content = content.replace(
        "<ScrollView showsVerticalScrollIndicator={false} className=\"flex-1\">\n                    {shopCart.map",
        `<ScrollView showsVerticalScrollIndicator={false} className="flex-1">\n                    ${gaugeCode}\n                    {shopCart.map`
    );
}

fs.writeFileSync('app/(tabs)/shop.tsx', content, 'utf8');
console.log("Moved gauge inside ScrollView");
