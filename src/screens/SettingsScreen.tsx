import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { signOut } = useAuth();

  // Privacy settings (in production, these would be loaded from and saved to the database)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [showLastActive, setShowLastActive] = useState(true);
  const [allowProfileViews, setAllowProfileViews] = useState(true);

  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [tapNotifications, setTapNotifications] = useState(true);
  const [viewNotifications, setViewNotifications] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROFILE</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.settingText}>Edit Profile</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('SavedPhrases' as any)}
        >
          <Text style={styles.settingText}>Saved Phrases</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRIVACY</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Show Online Status</Text>
          <Switch
            value={showOnlineStatus}
            onValueChange={setShowOnlineStatus}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Show Distance</Text>
          <Switch
            value={showDistance}
            onValueChange={setShowDistance}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Show Last Active</Text>
          <Switch
            value={showLastActive}
            onValueChange={setShowLastActive}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Allow Profile Views</Text>
          <Switch
            value={allowProfileViews}
            onValueChange={setAllowProfileViews}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('BlockedUsers' as any)}
        >
          <Text style={styles.settingText}>Blocked Users</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Push Notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>New Messages</Text>
          <Switch
            value={messageNotifications}
            onValueChange={setMessageNotifications}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Taps</Text>
          <Switch
            value={tapNotifications}
            onValueChange={setTapNotifications}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Profile Views</Text>
          <Switch
            value={viewNotifications}
            onValueChange={setViewNotifications}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
      </View>

      {/* Premium Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREMIUM</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Subscription')}
        >
          <View style={styles.settingWithIcon}>
            <Text style={styles.premiumIcon}>⭐</Text>
            <Text style={styles.settingText}>Upgrade to Premium</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('BillingHistory')}
        >
          <Text style={styles.settingText}>Billing History</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('PaymentMethod')}
        >
          <Text style={styles.settingText}>Payment Methods</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
          <Text style={[styles.settingText, styles.deleteText]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Terms of Service</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Privacy Policy</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Community Guidelines</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Version</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  backButton: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    fontFamily: FONT_FAMILIES.serif,
  },
  section: {
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  settingItem: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  settingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  settingArrow: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textMuted,
  },
  logoutText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  deleteText: {
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  versionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  settingWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },
  footer: {
    height: SPACING.xxl,
  },
});
