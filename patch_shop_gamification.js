const fs = require('fs');
let content = fs.readFileSync('app/(tabs)/shop.tsx', 'utf8');

// 1. Add Zustand store import and Modals
if (!content.includes('import { useShopStore }')) {
    content = content.replace(`import { useColorScheme } from 'nativewind';`, `import { useColorScheme } from 'nativewind';\nimport { Modal, Vibration, Alert, Linking, Pressable } from 'react-native';\nimport { useShopStore } from '../../lib/store';`);
}

// 2. Add Cart state and Modal state inside ShopScreen
const searchState = `  const [scratched, setScratched] = useState(false);`;
const replaceState = `  const [scratched, setScratched] = useState(false);

  // Cart & Modal State
  const { shopCart, addToCart, removeFromCart, updateQuantity, clearCart } = useShopStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState('');

  const cartItemCount = shopCart.reduce((acc, item) => acc + item.quantity, 0);
  const calculatedTotal = shopCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  `;
content = content.replace(searchState, replaceState);

// 3. Update gamification (Tap Count + Vibration)
const searchScratch = `  const handleScratch = () => {
    if (scratched) return;
    const newCount = scratchCount + 1;
    setScratchCount(newCount);
    if (newCount >= 3) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setScratched(true);
    }
  };`;
const replaceScratch = `  const handleScratch = () => {
    if (scratched) return;
    const newCount = scratchCount + 1;
    setScratchCount(newCount);
    if (newCount >= 3) {
      Vibration.vibrate();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setScratched(true);
      setAppliedPromo('CODE10');
    }
  };`;
content = content.replace(searchScratch, replaceScratch);

// 4. Update the Shopping Bag count in Hero
const searchBadge = `<View className="absolute -top-1 -right-1 bg-[#39FF14] w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-black text-[9px] font-black">2</Text>
              </View>`;
const replaceBadge = `{cartItemCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#39FF14] w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-black text-[9px] font-black">{cartItemCount}</Text>
              </View>
            )}`;
content = content.replace(searchBadge, replaceBadge);

// Make the shopping bag clickable to open "cart modal"
const searchBag = `<TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center relative backdrop-blur-md">`;
const replaceBag = `<TouchableOpacity onPress={() => { setSelectedProduct(null); setIsModalVisible(true); }} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center relative backdrop-blur-md">`;
content = content.replace(searchBag, replaceBag);

fs.writeFileSync('app/(tabs)/shop.tsx', content);
