import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Home, Calendar, Utensils, Users, User } from 'lucide-react-native';


import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#39FF14',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 70,
          borderRadius: 24,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
        },
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            intensity={80}
            style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: 'hidden' }]}
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
