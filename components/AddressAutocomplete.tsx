import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GeocodeResult, searchAddresses } from '../services/routingService';

interface AddressAutocompleteProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: string) => void | Promise<void>;
  icon?: string;
  iconColor?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  placeholder,
  value,
  onChangeText,
  onSelectAddress,
  icon = 'location',
  iconColor = '#FF6B6B'
}) => {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleTextChange = (text: string) => {
    // Reset the justSelected flag when user manually types
    if (justSelected) {
      setJustSelected(false);
    }
    onChangeText(text);
  };

  useEffect(() => {
    if (value.length > 2 && !justSelected) {
      const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          console.log('Searching for:', value);
          const results = await searchAddresses(value);
          console.log('Search results:', results);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Address search error:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoading(false);
        }
      }, 500); // Increased delay to reduce rapid requests

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      if (!justSelected) {
        setShowSuggestions(false);
      }
    }
  }, [value, justSelected]);

  const handleSelectAddress = (suggestion: GeocodeResult) => {
    console.log('Selected address:', suggestion.display_name);
    setJustSelected(true);
    setShowSuggestions(false);
    
    // Update input immediately
    onChangeText(suggestion.display_name);
    
    // Call callback to trigger route calculation
    onSelectAddress(suggestion.display_name);
    
    // Blur input after a short delay
    setTimeout(() => {
      inputRef.current?.blur();
    }, 100);
  };

  const handleInputBlur = () => {
    // Simple delay, no complex logic
    setTimeout(() => setShowSuggestions(false), 300);
  };

  const handleInputFocus = () => {
    if (value.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name={icon as any} size={20} color={iconColor} style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        {isLoading && (
          <Ionicons name="search" size={20} color="#999" style={styles.loadingIcon} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion: GeocodeResult, index: number) => (
            <TouchableOpacity
              key={`${suggestion.display_name}-${index}`}
              style={styles.suggestionItem}
              onPress={() => {
                console.log('TOUCHABLE PRESSED!!!');
                console.log('Touch event fired for:', suggestion.display_name);
                handleSelectAddress(suggestion);
              }}
              onPressIn={() => console.log('Touch IN for:', suggestion.display_name)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="location-outline" size={16} color="#999" style={styles.suggestionIcon} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {suggestion.display_name}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 99999, // Increased z-index
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
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
  loadingIcon: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'relative', // Changed from absolute
    top: 8, // Add some spacing from input
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginTop: -1,
    maxHeight: 200,
    zIndex: 10000,
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20, // Increased padding
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#1A1A1A',
    minHeight: 60, // Increased touch area
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
});

export default AddressAutocomplete;
