import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import { SavedPhrase } from '../types/database';
import { getUserSavedPhrases } from '../services/savedPhrases';

interface SavedPhrasesPickerProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSelectPhrase: (phraseText: string) => void;
}

export const SavedPhrasesPicker: React.FC<SavedPhrasesPickerProps> = ({
  visible,
  userId,
  onClose,
  onSelectPhrase,
}) => {
  const [phrases, setPhrases] = useState<SavedPhrase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPhrases();
    }
  }, [visible]);

  const loadPhrases = async () => {
    setLoading(true);
    const savedPhrases = await getUserSavedPhrases(userId);
    setPhrases(savedPhrases);
    setLoading(false);
  };

  const handleSelectPhrase = (phraseText: string) => {
    onSelectPhrase(phraseText);
    onClose();
  };

  const renderPhrase = ({ item }: { item: SavedPhrase }) => (
    <TouchableOpacity
      style={styles.phraseItem}
      onPress={() => handleSelectPhrase(item.phrase_text)}
    >
      <Text style={styles.phraseText}>{item.phrase_text}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Quick Replies</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : phrases.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved phrases</Text>
              <Text style={styles.emptySubtext}>Create phrases in Settings</Text>
            </View>
          ) : (
            <FlatList
              data={phrases}
              renderItem={renderPhrase}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
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
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  listContainer: {
    padding: SPACING.md,
  },
  phraseItem: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  phraseText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});
