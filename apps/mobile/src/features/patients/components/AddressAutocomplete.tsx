import { useState, useRef, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { TextInput, Text, HelperText } from 'react-native-paper';

import { searchAddresses, type AddressSuggestion } from '@/lib/geocoding';

export interface AddressCoords {
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCoordinates: (coords: AddressCoords | null) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export function AddressAutocomplete({ value, onChange, onCoordinates, hasError, disabled }: Props): React.JSX.Element {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 5) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchAddresses(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleChange(text: string): void {
    onChange(text);
    onCoordinates(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(text), 500);
  }

  function handleSelect(suggestion: AddressSuggestion): void {
    onChange(suggestion.displayName);
    onCoordinates({ lat: suggestion.lat, lng: suggestion.lng });
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          label="Adresse *"
          value={value}
          onChangeText={handleChange}
          style={styles.input}
          error={hasError}
          disabled={disabled}
          multiline
          numberOfLines={2}
          accessibilityLabel="Champ adresse"
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#1e2d6b" style={styles.spinner} />
        )}
      </View>
      {isOpen && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => String(item.placeId)}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestion}
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
              >
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.displayName}
                </Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  inputRow: { position: 'relative' },
  input: { backgroundColor: 'transparent' },
  spinner: { position: 'absolute', right: 12, top: 20 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 2,
  },
  suggestion: { paddingHorizontal: 12, paddingVertical: 10 },
  suggestionText: { fontSize: 13, color: '#334155' },
  separator: { height: 1, backgroundColor: '#f1f5f9' },
});
