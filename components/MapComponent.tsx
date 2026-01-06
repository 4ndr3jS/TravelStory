import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { RouteDetails } from '../types';

// Conditional import for native vs web
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (error) {
    console.log('react-native-maps not available');
  }
}

interface MapComponentProps {
  route?: RouteDetails | null;
  userLocation?: { latitude: number; longitude: number } | null;
  style?: any;
}

const MapComponent: React.FC<MapComponentProps> = ({ route, userLocation, style }) => {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Web fallback component
  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={[styles.container, style]}>
        {userLocation ? (
          <View style={styles.webMapContainer}>
            <View style={styles.webMapHeader}>
              <Ionicons name="map" size={24} color="#FF6B6B" />
              <Text style={styles.webMapTitle}>Location Map</Text>
            </View>
            <View style={styles.webMapContent}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color="#4ECDC4" />
                <Text style={styles.locationText}>
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </Text>
              </View>
              {route && (
                <View style={styles.routeInfo}>
                  <Text style={styles.routeTitle}>Route: {route.startAddress} → {route.endAddress}</Text>
                  <Text style={styles.routeDetails}>Distance: {route.distance} | Duration: {route.duration}</Text>
                </View>
              )}
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={48} color="#666" />
                <Text style={styles.placeholderText}>Interactive map available on mobile</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noLocationContainer}>
            <Ionicons name="map-outline" size={48} color="#666" />
            <Text style={styles.noLocationText}>Location unavailable</Text>
            <Text style={styles.noLocationSubtext}>Enable location to see the map</Text>
          </View>
        )}
      </View>
    );
  }

  // Native map component
  useEffect(() => {
    if (userLocation) {
      const initialRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(initialRegion);
      setIsLoading(false);
      
      // Center map on user location initially
      setTimeout(() => {
        mapRef.current?.animateToRegion(initialRegion, 1000);
      }, 500);
    } else {
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    if (route && route.startLocation && route.endLocation) {
      // Calculate the region that fits both start and end points
      const minLat = Math.min(route.startLocation.lat, route.endLocation.lat);
      const maxLat = Math.max(route.startLocation.lat, route.endLocation.lat);
      const minLng = Math.min(route.startLocation.lng, route.endLocation.lng);
      const maxLng = Math.max(route.startLocation.lng, route.endLocation.lng);

      const midLat = (minLat + maxLat) / 2;
      const midLng = (minLng + maxLng) / 2;
      const latDelta = (maxLat - minLat) * 1.5; // Add padding
      const lngDelta = (maxLng - minLng) * 1.5; // Add padding

      const routeRegion = {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(latDelta, 0.01), // Ensure minimum zoom
        longitudeDelta: Math.max(lngDelta, 0.01), // Ensure minimum zoom
      };

      setRegion(routeRegion);
      
      // Animate to route region
      setTimeout(() => {
        mapRef.current?.animateToRegion(routeRegion, 1000);
      }, 500);
    }
  }, [route]);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.noLocationContainer}>
          <Ionicons name="map-outline" size={48} color="#666" />
          <Text style={styles.noLocationText}>Location unavailable</Text>
          <Text style={styles.noLocationSubtext}>Enable location to see the map</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor="#FF6B6B"
        loadingBackgroundColor="#0A0A0A"
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="Starting point"
          >
            <View style={styles.userMarker}>
              <Ionicons name="location" size={24} color="#FF6B6B" />
            </View>
          </Marker>
        )}

        {/* Route start marker */}
        {route?.startLocation && (
          <Marker
            coordinate={{
              latitude: route.startLocation.lat,
              longitude: route.startLocation.lng,
            }}
            title="Start"
            description={route.startAddress}
          >
            <View style={styles.startMarker}>
              <Ionicons name="play-circle" size={24} color="#4ECDC4" />
            </View>
          </Marker>
        )}

        {/* Route end marker */}
        {route?.endLocation && (
          <Marker
            coordinate={{
              latitude: route.endLocation.lat,
              longitude: route.endLocation.lng,
            }}
            title="Destination"
            description={route.endAddress}
          >
            <View style={styles.endMarker}>
              <Ionicons name="flag" size={24} color="#FF6B6B" />
            </View>
          </Marker>
        )}

        {/* Route polyline */}
        {route?.routeGeometry && route.routeGeometry.length > 0 && (
          <Polyline
            coordinates={route.routeGeometry.map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            }))}
            strokeColor="#FF6B6B"
            strokeWidth={4}
            strokeColors={['#FF6B6B', '#4ECDC4']}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  map: {
    flex: 1,
  },
  // Web-specific styles
  webMapContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  webMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    gap: 8,
  },
  webMapTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webMapContent: {
    padding: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  locationText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '500',
  },
  routeInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  routeTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeDetails: {
    color: '#999',
    fontSize: 12,
  },
  mapPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 32,
  },
  noLocationText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noLocationSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  userMarker: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  startMarker: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  endMarker: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
});

export default MapComponent;
