import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import Slider from '@react-native-community/slider';

export const FiltersScreen: React.FC = () => {
  const navigation = useNavigation();

  // Filter states
  const [ageRange, setAgeRange] = useState([18, 99]);
  const [distanceKm, setDistanceKm] = useState(50);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hasPhotoOnly, setHasPhotoOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);

  const bodyTypes = ['Slim', 'Average', 'Athletic', 'Muscular', 'Stocky', 'Large'];
  const positions = ['Top', 'Bottom', 'Versatile', 'Side'];

  const toggleSelection = (item: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleApply = () => {
    // In a real implementation, this would save filters and update the explore screen
    navigation.goBack();
  };

  const handleReset = () => {
    setAgeRange([18, 99]);
    setDistanceKm(50);
    setOnlineOnly(false);
    setHasPhotoOnly(false);
    setVerifiedOnly(false);
    setSelectedBodyTypes([]);
    setSelectedPositions([]);
    setSelectedTribes([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetButton}>Reset</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Age Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Age Range</Text>
          <Text style={styles.filterValue}>{ageRange[0]} - {ageRange[1]} years</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={99}
              step={1}
              value={ageRange[0]}
              onValueChange={(value) => setAgeRange([value, ageRange[1]])}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={99}
              step={1}
              value={ageRange[1]}
              onValueChange={(value) => setAgeRange([ageRange[0], value])}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
          </View>
        </View>

        {/* Distance */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Maximum Distance</Text>
          <Text style={styles.filterValue}>{distanceKm} km</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={distanceKm}
            onValueChange={setDistanceKm}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.primary}
          />
        </View>

        {/* Toggle Filters */}
        <View style={styles.filterSection}>
          <View style={styles.toggleRow}>
            <Text style={styles.filterTitle}>Online Now</Text>
            <Switch
              value={onlineOnly}
              onValueChange={setOnlineOnly}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.filterTitle}>Has Photo</Text>
            <Switch
              value={hasPhotoOnly}
              onValueChange={setHasPhotoOnly}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.filterTitle}>Verified Only</Text>
            <Switch
              value={verifiedOnly}
              onValueChange={setVerifiedOnly}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.text}
            />
          </View>
        </View>

        {/* Body Type */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Body Type</Text>
          <View style={styles.chipsContainer}>
            {bodyTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  selectedBodyTypes.includes(type) && styles.chipSelected,
                ]}
                onPress={() => toggleSelection(type, selectedBodyTypes, setSelectedBodyTypes)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedBodyTypes.includes(type) && styles.chipTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Position */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Position</Text>
          <View style={styles.chipsContainer}>
            {positions.map((position) => (
              <TouchableOpacity
                key={position}
                style={[
                  styles.chip,
                  selectedPositions.includes(position) && styles.chipSelected,
                ]}
                onPress={() => toggleSelection(position, selectedPositions, setSelectedPositions)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedPositions.includes(position) && styles.chipTextSelected,
                  ]}
                >
                  {position}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </ScrollView>
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
  resetButton: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  closeButton: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  filterSection: {
    marginBottom: SPACING.xl,
  },
  filterTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  filterValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  sliderContainer: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  applyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
});
