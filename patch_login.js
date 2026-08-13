const fs = require('fs');

let content = fs.readFileSync('app/login.tsx', 'utf8');

content = content.replace(
    /<View className="mb-6">\s*<Text className="text-gray-500 font-medium mb-2" style=\{\{ fontFamily: 'Poppins_500Medium' \}\}>Mot de passe<\/Text>\s*<View className="border-b border-gray-300 pb-2">\s*<TextInput\s*value=\{pin\}\s*onChangeText=\{setPin\}\s*placeholder="Votre mot de passe"\s*placeholderTextColor="#9CA3AF"\s*secureTextEntry\s*keyboardType="default"\s*className="text-black text-lg p-0 m-0"\s*style=\{\{ fontFamily: 'Poppins_400Regular' \}\}\s*\/>\s*<\/View>\s*<\/View>/g,
    `<View className="mb-6">
                <Text className="text-gray-500 font-medium mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Code PIN secret</Text>
                <View className="border-b border-gray-300 pb-2">
                  <TextInput
                    value={pin}
                    onChangeText={setPin}
                    placeholder="••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={4}
                    className="text-black text-lg p-0 m-0 tracking-[1em]"
                  />
                </View>
              </View>`
);

fs.writeFileSync('app/login.tsx', content, 'utf8');
console.log("Reverted the password input to original state.");
