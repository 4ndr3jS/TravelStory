import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteDetails } from '../types';

interface MapComponentProps {
  route?: RouteDetails | null;
  userLocation?: { latitude: number; longitude: number } | null;
  style?: any;
}

const MapComponent: React.FC<MapComponentProps> = ({ route, userLocation, style }) => {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        
        {route?.routeGeometry && route.routeGeometry.length > 0 && (
          <Polyline
            coordinates={route.routeGeometry.map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            }))}
            strokeColor="#FF6B6B"
            strokeWidth={3}
          />
        )}
        
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

export default MapComponent;
