import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';
import { reportUser } from '../services/profiles';
import { ReportReason } from '../types/database';

type ReportUserRouteProp = RouteProp<RootStackParamList, 'ReportUser'>;

export const ReportUserScreen: React.FC = () => {
  const route = useRoute<ReportUserRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons: { value: ReportReason; label: string }[] = [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'fake_profile', label: 'Fake Profile' },
    { value: 'underage', label: 'Underage' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    const success = await reportUser(user.id, route.params.userId, selectedReason, description);
    setLoading(false);

    if (success) {
      Alert.alert('Success', 'Report submitted. Thank you.');
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report User</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Reason</Text>
        {reasons.map((reason) => (
          <TouchableOpacity
            key={reason.value}
            style={[
              styles.reasonButton,
              selectedReason === reason.value && styles.reasonButtonSelected,
            ]}
            onPress={() => setSelectedReason(reason.value)}
          >
            <Text
              style={[
                styles.reasonText,
                selectedReason === reason.value && styles.reasonTextSelected,
              ]}
            >
              {reason.label}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Additional Details (Optional)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Provide more details..."
          placeholderTextColor={COLORS.textMuted}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  closeButton: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
  reasonButton: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reasonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  reasonTextSelected: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
});
