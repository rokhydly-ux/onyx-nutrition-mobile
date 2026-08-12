const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/shop.tsx', 'utf8');

// 1. Add state variable
if (!content.includes('showSuccessModal')) {
    content = content.replace(
        "const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);",
        "const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);\n  const [showSuccessModal, setShowSuccessModal] = useState(false);\n  const [userName, setUserName] = useState('');\n  const router = require('expo-router').useRouter();"
    );
}

// 2. Modify handleCheckout
content = content.replace(
    /Alert\.alert\("Succès", "Votre commande a été enregistrée\."\);/,
    "setUserName(profile?.full_name || 'Inconnu');\n      setShowSuccessModal(true);"
);

// 3. Add modal to the JSX end
const successModalJSX = `
      {/* Checkout Success Modal */}
      {showSuccessModal && (
        <View className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-[100]" style={{ elevation: 100 }}>
          <View className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full items-center">
             <Image source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786461202/Succes_commandes_awovvw.png' }} className="w-32 h-32 mb-6 resize-contain" />
             <Text className="text-black dark:text-white text-xl text-center mb-6" style={{ fontFamily: "Poppins_700Bold" }}>Félicitations {userName}, votre commande est validée !</Text>
             <TouchableOpacity
               onPress={() => { setShowSuccessModal(false); router.push('/orders'); }}
               className="bg-[#39FF14] w-full py-4 rounded-xl mb-4 items-center"
             >
               <Text className="text-black" style={{ fontFamily: "Poppins_900Black" }}>SUIVRE MA COMMANDE</Text>
             </TouchableOpacity>
          </View>
        </View>
      )}
`;

if (!content.includes('Checkout Success Modal')) {
    content = content.replace(
        /<\/SafeAreaView>/,
        successModalJSX + '\n    </SafeAreaView>'
    );
}

fs.writeFileSync('app/(tabs)/shop.tsx', content, 'utf8');
console.log("Patched");
