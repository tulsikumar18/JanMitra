import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Circle,
  Callout,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from '../../hooks/useTranslation';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.015;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const IssueMap = ({
  issues = [],
  userLocation = null,
  onLocationSelect,
  onIssuePress,
  onUserLocationPress,
  showUserLocation = true,
  showIssues = true,
  interactive = true,
  initialRegion = null,
  style = {},
}) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const [region, setRegion] = useState(initialRegion || {
    latitude: 12.9716, // Bengaluru center
    longitude: 77.5946,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapType, setMapType] = useState('standard');

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('map.locationPermissionDenied'),
          t('map.locationPermissionRequired'),
          [{ text: 'OK' }]
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };

      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Animate map to new location
      mapRef.current?.animateToRegion(newRegion, 1000);

      if (onLocationSelect) {
        onLocationSelect(newRegion);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        t('errors.somethingWentWrong'),
        t('map.couldntGetLocation'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle map press
  const handleMapPress = (event) => {
    if (!interactive) return;

    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);

    if (onLocationSelect) {
      onLocationSelect(coordinate);
    }
  };

  // Handle issue marker press
  const handleIssuePress = (issue) => {
    if (onIssuePress) {
      onIssuePress(issue);
    }
  };

  // Re-center to current location
  const recenterToCurrentLocation = () => {
    if (userLocation) {
      const userRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      mapRef.current?.animateToRegion(userRegion, 1000);
    } else {
      getCurrentLocation();
    }
  };

  // Toggle map type
  const toggleMapType = () => {
    const types = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  // Get marker color based on issue status
  const getMarkerColor = (status) => {
    switch (status) {
      case 'open':
        return '#E74C3C'; // Red
      case 'in_progress':
        return '#F39C12'; // Yellow/Orange
      case 'resolved':
        return '#27AE60'; // Green
      case 'closed':
        return '#95A5A6'; // Gray
      default:
        return '#3498DB'; // Blue
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
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

  // Render issue marker
  const renderIssueMarker = (issue) => (
    <Marker
      key={issue.id}
      coordinate={{
        latitude: issue.latitude,
        longitude: issue.longitude,
      }}
      onPress={() => handleIssuePress(issue)}
    >
      <View style={[styles.issueMarker, { backgroundColor: getMarkerColor(issue.status) }]}>
        <Text style={styles.issueIcon}>{getCategoryIcon(issue.category)}</Text>
      </View>
      <Callout tooltip={true}>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{issue.category}</Text>
          <Text style={styles.calloutStatus}>{t(`issues.statuses.${issue.status}`)}</Text>
          <Text style={styles.calloutDate}>
            {new Date(issue.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Callout>
    </Marker>
  );

  // Render user location marker
  const renderUserLocationMarker = () => {
    if (!userLocation && !selectedLocation) return null;

    const location = userLocation || selectedLocation;

    return (
      <>
        <Circle
          center={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          radius={100}
          strokeColor="#4ECDC4"
          fillColor="rgba(78, 205, 196, 0.2)"
          strokeWidth={2}
        />
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          onPress={onUserLocationPress}
        >
          <View style={styles.userLocationMarker}>
            <View style={styles.userLocationDot} />
            <View style={styles.userLocationRing} />
          </View>
        </Marker>
      </>
    );
  };

  // Render selected location marker
  const renderSelectedLocationMarker = () => {
    if (!selectedLocation || !interactive) return null;

    return (
      <Marker
        coordinate={selectedLocation}
        draggable={interactive}
        onDragEnd={(e) => {
          const newLocation = e.nativeEvent.coordinate;
          setSelectedLocation(newLocation);
          if (onLocationSelect) {
            onLocationSelect(newLocation);
          }
        }}
      >
        <View style={styles.selectedLocationMarker}>
          <View style={styles.selectedLocationPin} />
          <View style={styles.selectedLocationShadow} />
        </View>
      </Marker>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        mapType={mapType}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={false}
        zoomEnabled={true}
        zoomControlEnabled={true}
        rotateEnabled={true}
        scrollEnabled={interactive}
        pitchEnabled={true}
      >
        {/* Render issue markers */}
        {showIssues && issues.map(renderIssueMarker)}

        {/* Render user location marker */}
        {renderUserLocationMarker()}

        {/* Render selected location marker */}
        {renderSelectedLocationMarker()}
      </MapView>

      {/* Loading indicator */}
      {isGettingLocation && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      )}

      {/* Map controls */}
      <View style={styles.controls}>
        {/* Re-center button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={recenterToCurrentLocation}
          activeOpacity={0.7}
        >
          <Text style={styles.controlIcon}>🎯</Text>
        </TouchableOpacity>

        {/* Map type toggle */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleMapType}
          activeOpacity={0.7}
        >
          <Text style={styles.controlIcon}>🗺️</Text>
        </TouchableOpacity>

        {/* Get current location */}
        {!userLocation && (
          <TouchableOpacity
            style={[styles.controlButton, styles.locationButton]}
            onPress={getCurrentLocation}
            activeOpacity={0.7}
            disabled={isGettingLocation}
          >
            <Text style={styles.controlIcon}>📍</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map type indicator */}
      <View style={styles.mapTypeIndicator}>
        <Text style={styles.mapTypeText}>
          {t(`map.${mapType}`)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -60,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButton: {
    backgroundColor: '#4ECDC4',
  },
  controlIcon: {
    fontSize: 20,
  },
  mapTypeIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  issueMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  issueIcon: {
    fontSize: 20,
  },
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  calloutStatus: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  calloutDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
    position: 'absolute',
  },
  userLocationRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    position: 'absolute',
  },
  selectedLocationMarker: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E74C3C',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedLocationShadow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    position: 'absolute',
    bottom: -5,
  },
});

export default IssueMap;