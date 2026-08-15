const fs = require('fs');
let content = fs.readFileSync('app/(tabs)/_layout.tsx', 'utf8');

// Debugging the reference error. It says "View" is not defined, wait, it might be in another file.
// Ah! In Header.tsx:
let headerContent = fs.readFileSync('app/(tabs)/Header.tsx', 'utf8');
if (!headerContent.includes('import { View, TouchableOpacity, Image, Alert } from "react-native";')) {
  // It's probably already there...
  console.log("Header has view:", headerContent.includes('View'));
}

// Let's check _layout.tsx again
console.log("Layout has view:", content.includes('import { View'));
console.log(content.split('\n').slice(0, 10).join('\n'));
