import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';
import { SavedPhrase } from '../types/database';
import {
  getUserSavedPhrases,
  addSavedPhrase,
  updateSavedPhrase,
  deleteSavedPhrase,
} from '../services/savedPhrases';
import { useFeature } from '../hooks/useFeature';
import { FEATURES } from '../constants/features';

export const SavedPhrasesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Feature gate
  const hasSavedPhrases = useFeature(FEATURES.SAVED_PHRASES);

  const [phrases, setPhrases] = useState<SavedPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newPhraseText, setNewPhraseText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    loadPhrases();
  }, []);

  const loadPhrases = async () => {
    if (!user) return;
    const savedPhrases = await getUserSavedPhrases(user.id);
    setPhrases(savedPhrases);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!user || !newPhraseText.trim()) return;

    const newPhrase = await addSavedPhrase(user.id, newPhraseText.trim());
    if (newPhrase) {
      setPhrases([...phrases, newPhrase]);
      setNewPhraseText('');
      setIsAddingNew(false);
    }
  };

  const handleEdit = async (phraseId: string) => {
    if (!editingText.trim()) return;

    const success = await updateSavedPhrase(phraseId, editingText.trim());
    if (success) {
      setPhrases(
        phrases.map((p) => (p.id === phraseId ? { ...p, phrase_text: editingText.trim() } : p))
      );
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleDelete = (phraseId: string) => {
    Alert.alert('Delete Phrase', 'Are you sure you want to delete this phrase?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteSavedPhrase(phraseId);
          if (success) {
            setPhrases(phrases.filter((p) => p.id !== phraseId));
          }
        },
      },
    ]);
  };

  const renderPhrase = ({ item }: { item: SavedPhrase }) => {
    const isEditing = editingId === item.id;

    return (
      <View style={styles.phraseItem}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editingText}
              onChangeText={setEditingText}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={() => handleEdit(item.id)}
              >
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setEditingId(null);
                  setEditingText('');
                }}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.phraseContent}>
            <Text style={styles.phraseText}>{item.phrase_text}</Text>
            <View style={styles.phraseActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setEditingId(item.id);
                  setEditingText(item.phrase_text);
                }}
              >
                <Text style={styles.iconText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
                <Text style={styles.iconText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show upgrade prompt if user doesn't have the feature
  if (!hasSavedPhrases) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Phrases</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.upgradeContainer}>
          <Text style={styles.upgradeIcon}>👑</Text>
          <Text style={styles.upgradeTitle}>Premium Feature</Text>
          <Text style={styles.upgradeText}>
            Saved Phrases is a premium feature. Upgrade to Premium to save quick replies for common messages.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Subscription' as never)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Phrases</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={phrases}
        renderItem={renderPhrase}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved phrases yet</Text>
            <Text style={styles.emptySubtext}>Add quick replies for common messages</Text>
          </View>
        }
      />

      {isAddingNew ? (
        <View style={styles.addContainer}>
          <TextInput
            style={styles.addInput}
            placeholder="Enter phrase..."
            placeholderTextColor={COLORS.textMuted}
            value={newPhraseText}
            onChangeText={setNewPhraseText}
            multiline
            autoFocus
          />
          <View style={styles.addActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleAdd}
              disabled={!newPhraseText.trim()}
            >
              <Text style={styles.actionButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsAddingNew(false);
                setNewPhraseText('');
              }}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAddingNew(true)}>
          <Text style={styles.addButtonText}>+ Add New Phrase</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  listContainer: {
    padding: SPACING.md,
  },
  phraseItem: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  phraseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phraseText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginRight: SPACING.md,
  },
  phraseActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  iconText: {
    fontSize: FONT_SIZES.lg,
  },
  editContainer: {
    width: '100%',
  },
  editInput: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  addContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addInput: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    minHeight: 60,
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  upgradeIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  upgradeTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  upgradeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
});
