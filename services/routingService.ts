import Constants from 'expo-constants';
import { RouteDetails, StoryStyle } from '../types';

// GraphHopper API for free road-based routing (no credit card required)
const GRAPHHOPPER_API_KEY = Constants.expoConfig?.extra?.GRAPHHOPPER_API_KEY || process.env.GRAPHHOPPER_API_KEY || '';
const GRAPHHOPPER_BASE_URL = 'https://graphhopper.com/api/1';

// OpenRouteService API (backup)
const ORS_API_KEY = Constants.expoConfig?.extra?.ORS_API_KEY || process.env.ORS_API_KEY || '';
const ORS_BASE_URL = 'https://api.openrouteservice.org';

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
    // Add a small delay to avoid rapid successive requests
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'EchoPaths/1.0',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Address search HTTP error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('Invalid response format from Nominatim');
      return [];
    }
    
    return data.map((result: any) => ({
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    }));
  } catch (error) {
    console.error('Address search error:', error);
    // Return empty array on network errors instead of crashing
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

    // Try GraphHopper first for free road routing (no credit card)
    if (GRAPHHOPPER_API_KEY && GRAPHHOPPER_API_KEY !== 'YOUR_GRAPHHOPPER_KEY_HERE') {
      return await calculateGraphHopperRoute(startCoords, endCoords, travelMode, storyStyle);
    }

    // Fallback to OpenRouteService if GraphHopper key not available
    if (ORS_API_KEY && ORS_API_KEY !== 'YOUR_API_KEY_HERE') {
      return await calculateORSRoute(startCoords, endCoords, travelMode, storyStyle);
    }

    // Final fallback to straight line
    console.warn('No routing API keys available, using straight line fallback');
    return createFallbackRoute(startCoords, endCoords, travelMode, storyStyle);
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
};

// GraphHopper routing for free road-based directions (no credit card required)
async function calculateGraphHopperRoute(
  startCoords: GeocodeResult,
  endCoords: GeocodeResult,
  travelMode: 'WALKING' | 'DRIVING',
  storyStyle: StoryStyle
): Promise<RouteDetails> {
  const vehicle = travelMode === 'WALKING' ? 'foot' : 'car';
  
  const response = await fetch(
    `${GRAPHHOPPER_BASE_URL}/route?key=${GRAPHHOPPER_API_KEY}&point=${startCoords.lat},${startCoords.lng}&point=${endCoords.lat},${endCoords.lng}&vehicle=${vehicle}&points_encoded=false&instructions=false&calc_points=true`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GraphHopper API failed: ${response.status}`);
  }

  const data = await response.json();
  const path = data.paths[0];

  if (!path) {
    throw new Error('No route found');
  }

  const distance = path.distance; // in meters
  const duration = path.time / 1000; // convert milliseconds to seconds
  const geometry = path.points.coordinates; // [[lng, lat], [lng, lat], ...]

  // Convert GraphHopper format to standard format
  const routeGeometry = geometry.map(([lng, lat]: [number, number]) => [lng, lat]);

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
    routeGeometry: routeGeometry,
    startLocation: { lat: startCoords.lat, lng: startCoords.lng },
    endLocation: { lat: endCoords.lat, lng: endCoords.lng },
  };
}

// OpenRouteService routing (backup)
async function calculateORSRoute(
  startCoords: GeocodeResult,
  endCoords: GeocodeResult,
  travelMode: 'WALKING' | 'DRIVING',
  storyStyle: StoryStyle
): Promise<RouteDetails> {
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

  const response = await fetch(`${ORS_BASE_URL}/v2/directions/${profile}/api`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`ORS API failed: ${response.status}`);
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
}

// Fallback function for when API fails
function createFallbackRoute(
  startCoords: GeocodeResult, 
  endCoords: GeocodeResult, 
  travelMode: 'WALKING' | 'DRIVING',
  storyStyle: StoryStyle
): RouteDetails {
  const distance = calculateDistance(
    startCoords.lat, 
    startCoords.lng, 
    endCoords.lat, 
    endCoords.lng
  );
  
  const duration = travelMode === 'WALKING' 
    ? distance / 1.4 // ~1.4 m/s walking speed
    : distance / 8.3; // ~8.3 m/s driving speed

  // Create simple route geometry (straight line for fallback)
  const geometry: [number, number][] = [
    [startCoords.lng, startCoords.lat],
    [endCoords.lng, endCoords.lat]
  ];

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
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
