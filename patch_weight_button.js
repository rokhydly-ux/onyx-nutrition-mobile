const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/weight.tsx', 'utf8');

// Change "Enregistrer" to "Appliquer" if that's requested, but the prompt says:
// "Ton bouton ne met pas à jour le tableau weight_logs dans Supabase. le bouton APPLIQUER est inactif"
// It seems the user refers to the button as "Appliquer" and the problem is it doesn't update `weight_logs`.
// Let's change the text to "Appliquer" just to be safe.
content = content.replace(
  /<Text className={`font-bold ml-2 \${newWeight\.trim\(\) \? 'text-black' : \(isDark \? 'text-gray-500' : 'text-gray-400'\)}`\} style=\{\{ fontFamily: 'Poppins_700Bold' \}\}>\s*Enregistrer\s*<\/Text>/,
  "<Text className={`font-bold ml-2 ${newWeight.trim() ? 'text-black' : (isDark ? 'text-gray-500' : 'text-gray-400')}`} style={{ fontFamily: 'Poppins_700Bold' }}>\n                       Appliquer\n                     </Text>"
);

fs.writeFileSync('app/(tabs)/weight.tsx', content);

console.log('Button text changed to Appliquer');
