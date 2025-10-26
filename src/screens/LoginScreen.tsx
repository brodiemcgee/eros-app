import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';
import { isValidEmail } from '../utils/helpers';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn, profile, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Navigate after successful login when auth state updates
  useEffect(() => {
    // Only navigate when we have a user AND auth is done loading
    // This ensures profile has had time to load
    if (user && !authLoading) {
      console.log('Auth state updated, user:', user.id, 'profile:', profile ? 'exists' : 'null', 'authLoading:', authLoading);

      // Give profile a moment to load if user just logged in
      // Profile should be loaded by AuthContext when authLoading becomes false
      if (profile) {
        console.log('Navigating to MainTabs');
        navigation.replace('MainTabs');
      } else {
        // Double-check: if we have a user but no profile after loading is done,
        // they genuinely need onboarding
        console.log('Navigating to OnboardingProfile');
        navigation.replace('OnboardingProfile');
      }
    }
  }, [user, profile, authLoading]);

  const handleLogin = async () => {
    console.log('Login attempt:', { email });

    if (!email || !password) {
      const msg = 'Please fill in all fields';
      console.error('Validation error:', msg);
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    if (!isValidEmail(email)) {
      const msg = 'Please enter a valid email address';
      console.error('Validation error:', msg);
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    setLoading(true);
    console.log('Calling signIn...');

    const { error } = await signIn(email.trim(), password);

    setLoading(false);
    console.log('SignIn result:', { error: error?.message });

    if (error) {
      const msg = error.message || 'Failed to sign in';
      console.error('Login error:', msg);
      if (Platform.OS === 'web') {
        alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } else {
      console.log('Login successful, waiting for auth state to update...');
      // Navigation will happen automatically via useEffect when auth state updates
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>Thirsty</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Signup')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logo: {
    fontSize: 48, // Large display size
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontFamily: FONT_FAMILIES.serif, // Serif for logo
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg, // More rounded
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.secondary, // Teal for CTA
    borderRadius: BORDER_RADIUS.pill, // Pill-shaped
    padding: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.small,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  linkButton: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
});
