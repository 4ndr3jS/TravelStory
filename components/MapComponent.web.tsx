import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteDetails } from '../types';

interface MapComponentProps {
  route?: RouteDetails | null;
  userLocation?: { latitude: number; longitude: number } | null;
  destinationLocation?: { latitude: number; longitude: number } | null;
  destinationRoute?: any;
  travelMode?: 'WALKING' | 'DRIVING';
  style?: any;
}

const MapComponent: React.FC<MapComponentProps> = ({ route, userLocation, destinationLocation, destinationRoute, travelMode, style }) => {
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
                <View style={styles.routeItem}>
                  <Ionicons name="walk" size={16} color="#4ECDC4" />
                  <Text style={styles.routeText}>{route.distance}</Text>
                </View>
                <View style={styles.routeItem}>
                  <Ionicons name="time" size={16} color="#FF6B6B" />
                  <Text style={styles.routeText}>{route.duration}</Text>
                </View>
                <View style={styles.routeItem}>
                  <Ionicons name="car" size={16} color="#FFD93D" />
                  <Text style={styles.routeText}>{route.travelMode}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={48} color="#666" />
              <Text style={styles.placeholderText}>
                Interactive map available on mobile devices
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Ionicons name="location-outline" size={48} color="#666" />
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  webMapContainer: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  webMapTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  webMapContent: {
    flex: 1,
    padding: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D3D3D',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  routeInfo: {
    backgroundColor: '#3D3D3D',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3D3D3D',
    borderRadius: 8,
    padding: 32,
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    margin: 16,
    borderRadius: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
});

export default MapComponent;
