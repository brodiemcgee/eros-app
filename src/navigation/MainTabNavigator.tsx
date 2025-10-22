import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from '../types/navigation';
import { ExploreScreen } from '../screens/ExploreScreen';
import { FavoritesScreen} from '../screens/FavoritesScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS, FONT_SIZES } from '../utils/theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF', // White for active
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', // White with 50% opacity for inactive
        tabBarStyle: {
          backgroundColor: COLORS.primary, // Purple background
          borderTopColor: COLORS.primary, // No visible border
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <span style={{
              fontSize: 24,
              opacity: focused ? 1 : 0.5,
              filter: 'brightness(0) invert(1)' // Makes icons white
            }}>
              🔍
            </span>
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <span style={{
              fontSize: 24,
              opacity: focused ? 1 : 0.5,
              filter: 'brightness(0) invert(1)'
            }}>
              ⭐
            </span>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <span style={{
              fontSize: 24,
              opacity: focused ? 1 : 0.5,
              filter: 'brightness(0) invert(1)'
            }}>
              💬
            </span>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <span style={{
              fontSize: 24,
              opacity: focused ? 1 : 0.5,
              filter: 'brightness(0) invert(1)'
            }}>
              👤
            </span>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
