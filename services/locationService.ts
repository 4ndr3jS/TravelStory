import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    // Request permission first
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permission to access location was denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

export const reverseGeocode = async (coords: LocationCoords): Promise<string> => {
  try {
    // First try Expo's reverse geocoding
    const results = await Location.reverseGeocodeAsync(coords);
    
    if (results.length > 0) {
      const address = results[0];
      // Format address components
      const parts = [
        address.street,
        address.city,
        address.region,
        address.country,
      ].filter(Boolean);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    
    // Fallback to Nominatim API if Expo doesn't return a good address
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
      {
        headers: {
          'User-Agent': 'EchoPaths/1.0',
        },
      }
    );

    if (nominatimResponse.ok) {
      const data = await nominatimResponse.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
    
    // Final fallback with better formatting
    return `Location: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return `Location: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }
};
