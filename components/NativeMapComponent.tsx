import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RouteDetails } from '../types';

// Only import react-native-maps in this file
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface NativeMapComponentProps {
  route?: RouteDetails | null;
  userLocation?: { latitude: number; longitude: number } | null;
  destinationLocation?: { latitude: number; longitude: number } | null;
  destinationRoute?: [number, number][] | null;
  style?: any;
}

const NativeMapComponent: React.FC<NativeMapComponentProps> = ({ route, userLocation, destinationLocation, destinationRoute, style }) => {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to create dotted line segments
  const createDottedLineSegments = (coordinates: { latitude: number; longitude: number }[]) => {
    const segments = [];
    const segmentLength = 5; // Number of points in each solid segment
    const gapLength = 5; // Number of points to skip for gap
    
    for (let i = 0; i < coordinates.length; i += segmentLength + gapLength) {
      const segment = coordinates.slice(i, i + segmentLength);
      if (segment.length > 1) {
        segments.push(segment);
      }
    }
    return segments;
  };

  useEffect(() => {
    if (userLocation) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setIsLoading(false);
    }
  }, [userLocation]);

  if (isLoading || !region) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        provider={PROVIDER_GOOGLE}
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            pinColor="#4ECDC4"
          />
        )}
        
        {destinationLocation && (
          <Marker
            coordinate={{
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            }}
            title="Destination"
            pinColor="#FF6B6B"
          />
        )}
        
        {route?.routeGeometry && route.routeGeometry.length > 0 && (() => {
          const coordinates = route.routeGeometry.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }));
          
          if (route.travelMode === 'WALKING') {
            // Render dotted line for walking
            return createDottedLineSegments(coordinates).map((segment, index) => (
              <Polyline
                key={`walking-segment-${index}`}
                coordinates={segment}
                strokeColor="#4169E1"
                strokeWidth={2}
              />
            ));
          } else {
            // Render solid line for driving
            return (
              <Polyline
                coordinates={coordinates}
                strokeColor="#4169E1"
                strokeWidth={3}
              />
            );
          }
        })()}
        
        {destinationRoute && destinationRoute.length > 0 && (() => {
          const coordinates = destinationRoute.map(([lng, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          }));
          
          if (route?.travelMode === 'WALKING') {
            // Render dotted line for walking
            return createDottedLineSegments(coordinates).map((segment, index) => (
              <Polyline
                key={`destination-walking-segment-${index}`}
                coordinates={segment}
                strokeColor="#4169E1"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
            ));
          } else {
            // Render solid line for driving
            return (
              <Polyline
                coordinates={coordinates}
                strokeColor="#4169E1"
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
              />
            );
          }
        })()}
        
        {route?.startLocation && (
          <Marker
            coordinate={{
              latitude: route.startLocation.lat,
              longitude: route.startLocation.lng,
            }}
            title="Start"
            pinColor="#4ECDC4"
          />
        )}
        
        {route?.endLocation && (
          <Marker
            coordinate={{
              latitude: route.endLocation.lat,
              longitude: route.endLocation.lng,
            }}
            title="Destination"
            pinColor="#FF6B6B"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  map: {
    flex: 1,
  },
});

export default NativeMapComponent;
