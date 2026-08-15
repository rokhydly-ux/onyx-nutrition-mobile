const fs = require('fs');
let content = fs.readFileSync('components/GlobalHeader.tsx', 'utf8');

// Change avatar click to route to /profile
content = content.replace(
  /<Image source={{ uri: avatar }} className="w-10 h-10 rounded-full border-2 border-\[#39FF14\] mr-3" \/>/,
  '<TouchableOpacity onPress={() => router.push("/profile")}><Image source={{ uri: avatar }} className="w-10 h-10 rounded-full border-2 border-[#39FF14] mr-3" /></TouchableOpacity>'
);

// The user also requested: "le bouton de deconnxion au clic il ouvre loption profil et se deconnecter"
// I will create an Alert for the logout button giving options
const logoutAlert = `
  const handleLogout = async () => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        'Mon Profil',
        'Que souhaitez-vous faire ?',
        [
          { text: 'Aller au profil', onPress: () => router.push('/profile') },
          { text: 'Se déconnecter', style: 'destructive', onPress: async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    });
  };
`;

content = content.replace(/const handleLogout = async \(\) => \{[\s\S]*?\};/, logoutAlert);

fs.writeFileSync('components/GlobalHeader.tsx', content);
