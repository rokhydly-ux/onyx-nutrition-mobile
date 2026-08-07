import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, FileText, ShoppingCart } from 'lucide-react-native';
import { useMenuStore } from '../store/useMenuStore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface GroceryItem {
  name: string;
  quantityStr: string;
  totalPriceCfa: number;
}

export default function GroceryListModal() {
  const { showGroceryList, setShowGroceryList, weeklyGeneratedMenu } = useMenuStore();
  const [isExporting, setIsExporting] = useState(false);

  const { groupedIngredients, totalPrice } = useMemo(() => {
    let priceSum = 0;
    const ingMap: Record<string, GroceryItem> = {};

    weeklyGeneratedMenu.forEach(day => {
      day.meals.forEach(meal => {
        meal.ingredients.forEach(ing => {
          const name = ing.name?.toLowerCase().trim() || 'Ingrédient inconnu';
          const rawPrice = ing.price_cfa || 0;
          const ratio = ing.scaledRatio || 1;
          const itemPrice = typeof rawPrice === 'number' ? rawPrice * ratio : 0;

          priceSum += itemPrice;

          if (!ingMap[name]) {
            ingMap[name] = {
              name: ing.name,
              quantityStr: String(ing.quantite),
              totalPriceCfa: itemPrice
            };
          } else {
             ingMap[name].totalPriceCfa += itemPrice;
             if (!isNaN(Number(ingMap[name].quantityStr)) && !isNaN(Number(ing.quantite))) {
                 ingMap[name].quantityStr = String(Number(ingMap[name].quantityStr) + Number(ing.quantite));
             } else {
                 if (!ingMap[name].quantityStr.includes(String(ing.quantite))) {
                    ingMap[name].quantityStr += ` + ${ing.quantite}`;
                 }
             }
          }
        });
      });
    });

    return {
      groupedIngredients: Object.values(ingMap).sort((a, b) => a.name.localeCompare(b.name)),
      totalPrice: Math.round(priceSum)
    };
  }, [weeklyGeneratedMenu]);

  const generateAndSharePDF = async () => {
    setIsExporting(true);
    try {
      const itemsHtml = groupedIngredients.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #374151;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #374151;">${item.quantityStr}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #374151;">${Math.round(item.totalPriceCfa)} CFA</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #111827; }
              h1 { color: #111827; font-size: 24px; text-align: center; margin-bottom: 5px; }
              p { text-align: center; color: #6B7280; margin-top: 0; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { text-align: left; padding: 10px; border-bottom: 2px solid #39FF14; color: #111827; }
              .total-box { background-color: #F3F4F6; padding: 20px; border-radius: 10px; text-align: right; }
              .total-box h2 { margin: 0; color: #111827; }
              .total-box span { color: #10B981; }
            </style>
          </head>
          <body>
            <h1>Ma Liste de Courses</h1>
            <p>Générée avec Sama Menu (Onyx Nutrition)</p>

            <table>
              <thead>
                <tr>
                  <th>Ingrédient</th>
                  <th>Quantité</th>
                  <th style="text-align: right;">Prix Est.</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-box">
              <h2>Total Estimé: <span>${totalPrice} CFA</span></h2>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Partager ma liste de courses', UTI: 'com.adobe.pdf' });
      } else {
        alert("Le partage n'est pas disponible sur cet appareil");
      }
    } catch (err) {
      console.error("Error generating PDF", err);
      alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={showGroceryList} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowGroceryList(false)}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
          <Text className="text-xl font-bold text-black" style={{ fontFamily: 'Poppins_700Bold' }}>Liste de courses</Text>
          <TouchableOpacity onPress={() => setShowGroceryList(false)} className="bg-gray-100 p-2 rounded-full">
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {groupedIngredients.length === 0 ? (
          <View className="flex-1 justify-center items-center p-6">
            <ShoppingCart size={48} color="#D1D5DB" className="mb-4" />
            <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
              Votre liste de courses est vide. Générez un menu pour la remplir.
            </Text>
          </View>
        ) : (
          <>
            <ScrollView className="flex-1 px-6">
              <View className="mt-4 space-y-4">
                {groupedIngredients.map((item, idx) => (
                  <View key={idx} className="flex-row justify-between items-center py-3 border-b border-gray-50 mb-3">
                    <View className="flex-1">
                      <Text className="text-black font-bold text-base capitalize" style={{ fontFamily: 'Poppins_700Bold' }}>{item.name}</Text>
                      <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>{item.quantityStr}</Text>
                    </View>
                    <Text className="text-black font-medium" style={{ fontFamily: 'Poppins_400Regular' }}>{Math.round(item.totalPriceCfa)} CFA</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View className="p-6 bg-gray-50 rounded-t-[30px] border-t border-gray-200">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins_400Regular' }}>Budget Estimé</Text>
                <Text className="text-2xl font-bold text-black" style={{ fontFamily: 'Poppins_700Bold' }}>{totalPrice} CFA</Text>
              </View>

              <TouchableOpacity
                className="bg-[#39FF14] w-full py-4 rounded-full flex-row justify-center items-center shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                onPress={generateAndSharePDF}
                disabled={isExporting}
              >
                {isExporting ? <ActivityIndicator color="#000" /> : (
                  <>
                    <FileText size={20} color="#000" className="mr-2" />
                    <Text className="text-black font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Exporter en PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}