import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getCurrentLocation, reverseGeocode } from '../services/locationService';
import { calculateRoute, geocodeAddress } from '../services/routingService';
import { RouteDetails, StoryStyle } from '../types';
import AddressAutocomplete from './AddressAutocomplete';
import MapComponent from './MapComponent';

interface Props { onRouteFound: (details: RouteDetails) => void; loading: boolean; error?: string | null; }
type TravelMode = 'WALKING' | 'DRIVING';

const STYLES: { id: StoryStyle; label: string; icon: string; desc: string }[] = [
  { id: 'NOIR', label: 'Noir Thriller', icon: 'rainy', desc: 'Gritty streets.' },
  { id: 'CHILDREN', label: 'Children', icon: 'star', desc: 'Whimsical adventure.' },
  { id: 'HISTORICAL', label: 'scroll', icon: 'document-text', desc: 'Historical epic.' },
  { id: 'FANTASY', label: 'Fantasy', icon: 'shield', desc: 'Epic quest.' },
];

const ICONS: Record<string, string> = {
  NOIR: 'rainy',
  CHILDREN: 'star',
  HISTORICAL: 'document-text',
  FANTASY: 'shield',
};

const RoutePlanner: React.FC<Props> = ({ onRouteFound, loading, error }) => {
  const [startAddress, setStartAddress] = useState('Getting location...');
  const [endAddress, setEndAddress] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('WALKING');
  const [selectedStyle, setSelectedStyle] = useState<StoryStyle>('NOIR');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [route, setRoute] = useState<RouteDetails | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc) {
          setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
          const address = await reverseGeocode(loc);
          // Use the address directly since reverseGeocode now returns proper formatting
          setStartAddress(address);
          setLocationPermissionGranted(true);
        } else {
          setStartAddress('');
          setLocationPermissionGranted(false);
        }
      } catch { 
        setStartAddress('');
        setLocationPermissionGranted(false);
      }
    };
    getLocation();
  }, []);

  const handleCalculate = async () => {
    if (!startAddress || !endAddress) { setLocalError("Enter both start and end"); return; }
    setLocalError(null);
    setIsLoading(true);
    try {
      const routeDetails = await calculateRoute(startAddress, endAddress, travelMode, selectedStyle);
      if (routeDetails) onRouteFound(routeDetails);
    } catch (e) { setLocalError("Route calculation failed"); }
    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan Your Journey</Text>
        <Text style={styles.subtitle}>Create a story for your route and play it with our AI</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapComponent 
          userLocation={userLocation} 
          destinationLocation={destinationLocation}
          route={route}
          travelMode={travelMode}
          style={styles.map}
        />
      </View>

      {locationPermissionGranted === false && (
        <View style={styles.permissionWarning}>
          <Ionicons name="warning" size={20} color="#FFA500" />
          <Text style={styles.permissionText}>
            Location access denied. Enter your starting address manually.
          </Text>
        </View>
      )}

      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <Ionicons name="location" size={20} color="#FF6B6B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Starting point"
            placeholderTextColor="#999"
            value={startAddress}
            onChangeText={setStartAddress}
            editable={false} // Make it read-only since it's auto-filled with location
          />
        </View>

        <AddressAutocomplete
          placeholder="Destination"
          value={endAddress}
          onChangeText={setEndAddress}
          onSelectAddress={async (address) => {
            console.log('RoutePlanner received address:', address); // Debug log
            try {
              console.log('Starting geocoding for:', address);
              const coords = await geocodeAddress(address);
              console.log('Geocoding result:', coords);
              
              if (coords) {
                setDestinationLocation({ latitude: coords.lat, longitude: coords.lng });
                console.log('Set destinationLocation to:', { latitude: coords.lat, longitude: coords.lng });
                
                // Calculate route from current location to destination
                if (userLocation) {
                  console.log('Calculating route from userLocation to destination');
                  console.log('User location:', userLocation);
                  console.log('Travel mode:', travelMode);
                  console.log('Selected style:', selectedStyle);
                  try {
                    const routeDetails = await calculateRoute(
                      `${userLocation.latitude},${userLocation.longitude}`,
                      address,
                      travelMode,
                      selectedStyle
                    );
                    console.log('Route calculation result:', routeDetails);
                    if (routeDetails) {
                      console.log('Setting route with travelMode:', routeDetails.travelMode);
                      // Set the full route instead of just destinationRoute
                      setRoute(routeDetails);
                    }
                  } catch (error) {
                    console.error('Failed to calculate destination route:', error);
                  }
                }
              } else {
                console.log('No coordinates found for address:', address);
              }
            } catch (error) {
              console.error('Error in onSelectAddress:', error);
            }
          }}
          icon="flag"
          iconColor="#4ECDC4"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Travel Mode</Text>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, travelMode === 'WALKING' && styles.modeButtonActive]}
            onPress={() => setTravelMode('WALKING')}
          >
            <Ionicons name="walk" size={24} color={travelMode === 'WALKING' ? '#FFF' : '#999'} />
            <Text style={[styles.modeText, travelMode === 'WALKING' && styles.modeTextActive]}>Walking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, travelMode === 'DRIVING' && styles.modeButtonActive]}
            onPress={() => setTravelMode('DRIVING')}
          >
            <Ionicons name="car" size={24} color={travelMode === 'DRIVING' ? '#FFF' : '#999'} />
            <Text style={[styles.modeText, travelMode === 'DRIVING' && styles.modeTextActive]}>Driving</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Story Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
          {STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[styles.styleCard, selectedStyle === style.id && styles.styleCardActive]}
              onPress={() => setSelectedStyle(style.id)}
            >
              <View style={[styles.iconContainer, selectedStyle === style.id && styles.iconContainerActive]}>
                <Ionicons 
                  name={ICONS[style.id] as any} 
                  size={24} 
                  color={selectedStyle === style.id ? '#FFF' : '#FF6B6B'} 
                />
              </View>
              <Text style={[styles.styleLabel, selectedStyle === style.id && styles.styleLabelActive]}>
                {style.label}
              </Text>
              <Text style={styles.styleDesc}>{style.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {(localError || error) && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{localError || error}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.generateButton, (!startAddress || !endAddress) && styles.generateButtonDisabled]} 
        onPress={handleCalculate} 
        disabled={isLoading || !startAddress || !endAddress}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.generateButtonText}>Generate Story</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  mapContainer: {
    height: 400,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  map: {
    flex: 1,
  },
  permissionWarning: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  permissionText: {
    color: '#FFA500',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  modeText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  modeTextActive: {
    color: '#FFF',
  },
  styleScroll: {
    marginLeft: -8,
  },
  styleCard: {
    width: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginLeft: 8,
    alignItems: 'center',
  },
  styleCardActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#FF6B6B',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerActive: {
    backgroundColor: '#FF6B6B',
  },
  styleLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  styleLabelActive: {
    color: '#FF6B6B',
  },
  styleDesc: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    boxShadow: '0 4px 8px rgba(255, 107, 107, 0.3)',
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    boxShadow: 'none',
  },
  buttonIcon: {
    marginRight: 4,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoutePlanner;
