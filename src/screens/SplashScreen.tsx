import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../utils/theme';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (user && profile) {
          // User is logged in and has a profile
          navigation.replace('MainTabs');
        } else if (user && !profile) {
          // User is logged in but hasn't completed profile setup
          navigation.replace('OnboardingProfile');
        } else {
          // User is not logged in
          navigation.replace('Login');
        }
      }, 1000);
    }
  }, [loading, user, profile]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Thirsty</Text>
      <Text style={styles.tagline}>Connect. Meet. Explore.</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.primary,
    marginBottom: 16,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 48,
  },
  loader: {
    marginTop: 32,
  },
});
