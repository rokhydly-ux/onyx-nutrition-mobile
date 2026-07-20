import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Home, Calendar, Utensils, Users, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#39FF14',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: 'transparent',
          borderRadius: 32,
          height: 70,
          borderTopWidth: 0,
          // Removed overflow: 'hidden' to allow the central button to float above
        },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={80}
            style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Utensils color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          title: 'Mon Jour',
          tabBarIcon: ({ color }) => (
            <View className="bg-[#39FF14] h-14 w-14 rounded-full flex items-center justify-center -mt-8 shadow-[0_0_15px_rgba(57,255,20,0.5)]">
              <Calendar color="black" size={28} />
            </View>
          ),
          tabBarLabel: () => null, // Hide label for central button
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
