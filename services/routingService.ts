import Constants from 'expo-constants';
import { RouteDetails, StoryStyle } from '../types';

// OpenRouteService API (free alternative to Google Maps)
const ORS_API_KEY = Constants.expoConfig?.extra?.ORS_API_KEY || process.env.ORS_API_KEY || '';
const ORS_BASE_URL = __DEV__ ? '/api/ors' : 'https://api.openrouteservice.org';

// Nominatim API for geocoding (OpenStreetMap)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
}

export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'EchoPaths/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const searchAddresses = async (query: string): Promise<GeocodeResult[]> => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'EchoPaths/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Address search failed: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((result: any) => ({
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    }));
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
};

export const calculateRoute = async (
  startAddress: string,
  endAddress: string,
  travelMode: 'WALKING' | 'DRIVING',
  storyStyle: StoryStyle
): Promise<RouteDetails | null> => {
  try {
    // Geocode start and end addresses
    const startCoords = await geocodeAddress(startAddress);
    const endCoords = await geocodeAddress(endAddress);

    if (!startCoords || !endCoords) {
      throw new Error('Could not find one or both addresses');
    }

    // Calculate route using OpenRouteService
    const profile = travelMode === 'WALKING' ? 'foot-walking' : 'driving-car';
    
    const requestBody = {
      coordinates: [
        [startCoords.lng, startCoords.lat],
        [endCoords.lng, endCoords.lat],
      ],
      format: 'geojson',
      instructions: false,
      geometry: true,
    };

    const response = await fetch(__DEV__ ? '/api/ors' : `${ORS_BASE_URL}/v2/directions/${profile}/api`, {
      method: 'POST',
      headers: {
        ...(__DEV__ ? {} : { 'Authorization': `Bearer ${ORS_API_KEY}` }),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(__DEV__ ? { profile, coordinates: requestBody.coordinates } : requestBody),
    });

    if (!response.ok) {
      throw new Error(`Route calculation failed: ${response.status}`);
    }

    const data = await response.json();
    const route = data.features[0];

    if (!route) {
      throw new Error('No route found');
    }

    const distance = route.properties.segments[0].distance; // in meters
    const duration = route.properties.segments[0].duration; // in seconds
    const geometry = route.geometry.coordinates; // [lng, lat] pairs

    // Format distance and duration for display
    const distanceText = distance < 1000 
      ? `${Math.round(distance)}m` 
      : `${(distance / 1000).toFixed(1)}km`;

    const durationText = duration < 3600 
      ? `${Math.round(duration / 60)} min` 
      : `${Math.floor(duration / 3600)}h ${Math.round((duration % 3600) / 60)}min`;

    return {
      startAddress: startCoords.display_name,
      endAddress: endCoords.display_name,
      distance: distanceText,
      duration: durationText,
      durationSeconds: duration,
      travelMode,
      storyStyle,
      routeGeometry: geometry,
      startLocation: { lat: startCoords.lat, lng: startCoords.lng },
      endLocation: { lat: endCoords.lat, lng: endCoords.lng },
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
};
