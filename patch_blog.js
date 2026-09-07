const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/blog/[id].tsx', 'utf8');

// The issue states:
// 1. Remplacer l'auteur statique par article.author_name (already partially done, but let's check)
// 2. Réparer la zone de commentaires avec le KeyboardAvoidingView
// 3. Corriger le padding du texte qui touche les bords

// 1. KeyboardAvoidingView behavior fix:
content = content.replace(
  /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/g,
  "behavior={Platform.OS === 'ios' ? 'padding' : 'height'}\n      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}"
);

// 2. Fix the padding of the ScrollView (it seems Animated.ScrollView lacks paddingHorizontal: 20)
// Currently:
// <Animated.ScrollView
//   className="flex-1"
//   showsVerticalScrollIndicator={false}
// Let's add contentContainerStyle
content = content.replace(
  /<Animated\.ScrollView\n\s*className="flex-1"\n\s*showsVerticalScrollIndicator=\{false\}/,
  "<Animated.ScrollView\n          className=\"flex-1\"\n          contentContainerStyle={{ paddingBottom: 120 }}\n          showsVerticalScrollIndicator={false}"
);

// Check if padding is on Animated.View
// Currently:
// <Animated.View className="py-4 mt-2" style={{ opacity: fadeAnim, paddingHorizontal: 20 }}>
// It has paddingHorizontal: 20 already!

fs.writeFileSync('app/(tabs)/blog/[id].tsx', content);
