import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import { getAllTribes } from '../services/profiles';
import { Tribe } from '../types/database';

interface TribeSelectorProps {
  selectedTribeIds: string[];
  onSelectionChange: (tribeIds: string[]) => void;
  maxSelection?: number;
}

export const TribeSelector: React.FC<TribeSelectorProps> = ({
  selectedTribeIds,
  onSelectionChange,
  maxSelection = 5,
}) => {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTribes();
  }, []);

  const loadTribes = async () => {
    const allTribes = await getAllTribes();
    setTribes(allTribes);
    setLoading(false);
  };

  const toggleTribe = (tribeId: string) => {
    if (selectedTribeIds.includes(tribeId)) {
      // Remove tribe
      onSelectionChange(selectedTribeIds.filter(id => id !== tribeId));
    } else {
      // Add tribe if under max limit
      if (selectedTribeIds.length < maxSelection) {
        onSelectionChange([...selectedTribeIds, tribeId]);
      }
    }
  };

  const renderTribe = ({ item }: { item: Tribe }) => {
    const isSelected = selectedTribeIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.tribeButton, isSelected && styles.tribeButtonSelected]}
        onPress={() => toggleTribe(item.id)}
      >
        <Text style={[styles.tribeText, isSelected && styles.tribeTextSelected]}>
          {item.icon} {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Tribes</Text>
        <Text style={styles.subtitle}>
          Choose up to {maxSelection} ({selectedTribeIds.length}/{maxSelection} selected)
        </Text>
      </View>
      <FlatList
        data={tribes}
        renderItem={renderTribe}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  gridContainer: {
    paddingBottom: SPACING.md,
  },
  tribeButton: {
    flex: 1,
    margin: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tribeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tribeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
  },
  tribeTextSelected: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
});
