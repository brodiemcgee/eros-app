import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { OnboardingProfileScreen } from '../screens/OnboardingProfileScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { ProfileDetailScreen } from '../screens/ProfileDetailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FiltersScreen } from '../screens/FiltersScreen';
import { BlockedUsersScreen } from '../screens/BlockedUsersScreen';
import { ReportUserScreen } from '../screens/ReportUserScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { PaymentMethodScreen } from '../screens/PaymentMethodScreen';
import { BillingHistoryScreen } from '../screens/BillingHistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="ProfileDetail"
          component={ProfileDetailScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="Filters"
          component={FiltersScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
        <Stack.Screen
          name="ReportUser"
          component={ReportUserScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
        <Stack.Screen name="BillingHistory" component={BillingHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
