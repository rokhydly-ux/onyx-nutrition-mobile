const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/_layout.tsx', 'utf8');

// View seems to not be imported properly. Let's make sure!
if (!content.includes('import { View, StyleSheet, useColorScheme, Text } from "react-native";')) {
  content = content.replace("import { StyleSheet, View, useColorScheme, Text } from 'react-native';", "import { View, StyleSheet, useColorScheme, Text } from 'react-native';");
}

fs.writeFileSync('app/(tabs)/_layout.tsx', content);
