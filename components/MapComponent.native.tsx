import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteDetails } from '../types';

interface MapComponentProps {
  route?: RouteDetails | null;
  userLocation?: { latitude: number; longitude: number } | null;
  destinationLocation?: { latitude: number; longitude: number } | null;
  travelMode?: 'WALKING' | 'DRIVING';
  style?: any;
}

const MapComponent: React.FC<MapComponentProps> = ({ route, userLocation, destinationLocation, travelMode, style }) => {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  map: {
    flex: 1,
  },
  outerCircle: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: 'rgba(243, 243, 243, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 18.5,
    backgroundColor: '#4e98cdff',
  },
});



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

  useEffect(() => {
    console.log('MapComponent rerendered, travelMode:', route?.travelMode);
  }, [route]);


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
            anchor={{ x: 0.45, y: 0.45 }}
          >
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle} />
            </View>
          </Marker>
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
          
          // Debug logging
          console.log('Main route - travelMode:', route?.travelMode, 'route:', route);
          
          const isWalking = route?.travelMode === 'WALKING';
          console.log('Is walking mode (main route):', isWalking);
          
          if (isWalking) {
            return (
              <Polyline
                coordinates={coordinates}
                strokeColor="#4572f8ff"
                strokeWidth={6}
              />
            );
          } else {
            return (
              <Polyline
                coordinates={coordinates}
                strokeColor="#4572f8ff"
                strokeWidth={6}
              />
            );
          }
        })()}
      </MapView>
    </View>
  );
};

export default MapComponent;