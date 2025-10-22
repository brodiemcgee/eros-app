import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import { isValidEmail, isValidPassword } from '../utils/helpers';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    console.log('Signup attempt:', { email });

    if (!email || !password || !confirmPassword) {
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

    if (!isValidPassword(password)) {
      const msg = 'Password must be at least 8 characters long';
      console.error('Validation error:', msg);
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match';
      console.error('Validation error:', msg);
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    setLoading(true);
    console.log('Calling signUp...');

    const { error } = await signUp(email.trim(), password);

    setLoading(false);
    console.log('SignUp result:', { error: error?.message });

    if (error) {
      const msg = error.message || 'Failed to create account';
      console.error('Signup error:', msg);
      if (Platform.OS === 'web') {
        alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } else {
      const msg = 'Account created! Please check your email to verify your account.';
      console.log('Signup success:', msg);
      if (Platform.OS === 'web') {
        alert(msg);
        navigation.navigate('Login');
      } else {
        Alert.alert('Success', msg, [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.logo}>EROS</Text>
          <Text style={styles.subtitle}>Create your account</Text>

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
              placeholder="Password (min 8 characters)"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  logo: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  linkButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  terms: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
