const fs = require('fs');

let content = fs.readFileSync('app/login.tsx', 'utf8');

// Add showPassword state and Eye icon import
if (!content.includes('showPassword')) {
    content = content.replace(
        "const [loading, setLoading] = useState(false);",
        "const [loading, setLoading] = useState(false);\n  const [showPassword, setShowPassword] = useState(false);"
    );
}

if (!content.includes('Eye,')) {
    content = content.replace(
        "import { ArrowLeft, CheckSquare, Square } from 'lucide-react-native';",
        "import { ArrowLeft, CheckSquare, Square, Eye, EyeOff } from 'lucide-react-native';"
    );
}

// Add debug log
if (!content.includes('Payload envoyé :')) {
    content = content.replace(
        "// 3. Lancement de l'authentification\n    const { data, error } = await supabase.auth.signInWithPassword({",
        "// 3. Lancement de l'authentification\n    console.log(\"Payload envoyé :\", { email: authEmail, pwdLength: pin.length });\n    const { data, error } = await supabase.auth.signInWithPassword({"
    );
}

// Add Eye icon to the password field
const passwordBlock = `<View className="mb-6">
                <Text className="text-gray-500 font-medium mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Mot de passe</Text>
                <View className="border-b border-gray-300 pb-2 flex-row items-center justify-between">
                  <TextInput
                    value={pin}
                    onChangeText={setPin}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    keyboardType="default"
                    className="text-black text-lg p-0 m-0 flex-1"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                    {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>`;

content = content.replace(
    /<View className="mb-6">\s*<Text className="text-gray-500 font-medium mb-2" style=\{\{ fontFamily: 'Poppins_500Medium' \}\}>Mot de passe<\/Text>\s*<View className="border-b border-gray-300 pb-2">\s*<TextInput\s*value=\{pin\}\s*onChangeText=\{setPin\}\s*placeholder="Votre mot de passe"\s*placeholderTextColor="#9CA3AF"\s*secureTextEntry\s*keyboardType="default"\s*className="text-black text-lg p-0 m-0"\s*style=\{\{ fontFamily: 'Poppins_400Regular' \}\}\s*\/>\s*<\/View>\s*<\/View>/,
    passwordBlock
);

fs.writeFileSync('app/login.tsx', content, 'utf8');
console.log("Login patched with Eye icon and debug log.");
