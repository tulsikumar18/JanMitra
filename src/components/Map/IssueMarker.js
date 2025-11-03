import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';

const IssueMarker = ({
  category,
  status,
  priority,
  onPress,
  size = 'medium',
  showLabel = false,
}) => {
  const { t } = useTranslation();

  // Get marker size based on priority and size prop
  const getMarkerSize = () => {
    const baseSize = size === 'small' ? 24 : size === 'large' ? 48 : 36;
    const priorityMultiplier = priority === 'high' ? 1.2 : priority === 'medium' ? 1.1 : 1;
    return Math.round(baseSize * priorityMultiplier);
  };

  // Get color based on status
  const getMarkerColor = () => {
    switch (status) {
      case 'open':
        return '#E74C3C'; // Red
      case 'in_progress':
        return '#F39C12'; // Orange/Yellow
      case 'resolved':
        return '#27AE60'; // Green
      case 'closed':
        return '#95A5A6'; // Gray
      default:
        return '#3498DB'; // Blue
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
    const icons = {
      pothole: '🕳️',
      streetLight: '💡',
      garbage: '🗑️',
      water: '💧',
      drainage: '🌊',
      park: '🌳',
      trafficSignal: '🚦',
      noise: '🔊',
      other: '📌',
    };
    return icons[category] || icons.other;
  };

  // Get status icon for overlay
  const getStatusIcon = () => {
    const icons = {
      open: '🔴',
      in_progress: '🟡',
      resolved: '🟢',
      closed: '⚪',
    };
    return icons[status] || '⚪';
  };

  const markerSize = getMarkerSize();
  const markerColor = getMarkerColor();
  const categoryIcon = getCategoryIcon();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.marker,
          {
            width: markerSize,
            height: markerSize,
            borderRadius: markerSize / 2,
            backgroundColor: markerColor,
          },
        ]}
        onPress={onPress}
      >
        {/* Category icon */}
        <Text
          style={[
            styles.categoryIcon,
            {
              fontSize: markerSize * 0.5,
            },
          ]}
        >
          {categoryIcon}
        </Text>

        {/* Priority indicator */}
        {priority === 'high' && (
          <View style={[styles.priorityIndicator, styles.highPriority]} />
        )}

        {/* Status indicator (small dot) */}
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: markerColor,
            },
          ]}
        />
      </View>

      {/* Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {t(`issues.categories.${category}`)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  categoryIcon: {
    textAlign: 'center',
    lineHeight: null, // Fix for emoji alignment
  },
  priorityIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highPriority: {
    backgroundColor: '#E74C3C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    minWidth: 60,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default IssueMarker;