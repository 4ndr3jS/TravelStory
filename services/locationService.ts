import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permission to access location was denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
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
    const results = await Location.reverseGeocodeAsync(coords);
    
    if (results.length > 0) {
      const address = results[0];

      const place =
        (address as any).name ||
        (address as any).place ||
        (address as any).business ||
        (address as any).pointOfInterest ||
        address.street;
      const city = address.city || (address as any).district || (address as any).subregion;
      const region = address.region;
      const country = address.country;

      const parts = [place, city, region, country].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    
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
      if (data) {
        const a = data.address || {};
        const place =
          data.name ||
          a.amenity ||
          a.building ||
          a.tourism ||
          a.leisure ||
          a.shop ||
          a.office ||
          a.neighbourhood ||
          a.suburb ||
          a.road;
        const city = a.city || a.town || a.village || a.municipality;
        const region = a.state || a.county;
        const country = a.country;

        const parts = [place, city, region, country].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');

        if (data.display_name) return data.display_name;
      }
    }
    
    return `Location: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return `Location: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }
};
