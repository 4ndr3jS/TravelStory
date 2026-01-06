import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GeocodeResult, searchAddresses } from '../services/routingService';

interface AddressAutocompleteProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: string) => void;
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
  const inputRef = useRef<TextInput>(null);
  const [justSelected, setJustSelected] = useState(false);

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
          const results = await searchAddresses(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Address search error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      if (!justSelected) {
        setShowSuggestions(false);
      }
    }
  }, [value, justSelected]);

  const handleSelectAddress = (suggestion: GeocodeResult) => {
    console.log('Selected address:', suggestion.display_name); // Debug log
    onSelectAddress(suggestion.display_name);
    setShowSuggestions(false);
    // Don't blur immediately to avoid conflicts
    setTimeout(() => {
      inputRef.current?.blur();
    }, 100);
  };

  const handleSuggestionClick = (suggestion: GeocodeResult) => {
    console.log('Suggestion clicked:', suggestion.display_name);
    setJustSelected(true); // Prevent suggestions from reappearing permanently
    handleSelectAddress(suggestion);
  };

  const handleInputFocus = () => {
    if (value.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
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
          <ScrollView 
            style={styles.suggestionsScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPressIn={() => {
                  console.log('Touch started on suggestion:', suggestion.display_name);
                  handleSuggestionClick(suggestion);
                }}
                activeOpacity={0.7}
                delayPressIn={0}
                // Web-specific props
                {...(Platform.OS === 'web' && {
                  onClick: () => {
                    console.log('Web click on suggestion:', suggestion.display_name);
                    handleSuggestionClick(suggestion);
                  },
                  style: [styles.suggestionItem, { cursor: 'pointer' }]
                })}
              >
                <Ionicons name="location-outline" size={16} color="#999" style={styles.suggestionIcon} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {suggestion.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 9999,
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
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#1A1A1A',
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
