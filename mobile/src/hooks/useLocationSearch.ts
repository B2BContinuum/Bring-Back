import { useState, useEffect, useCallback } from 'react';
import { Location, Coordinates, LocationSearchResult } from '../types/location.types';
import { searchLocations, getNearbyLocations } from '../services/locationService';

export const useLocationSearch = (initialQuery: string = '') => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<LocationSearchResult>({
    locations: [],
    loading: false,
    error: null,
  });
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);

  // Debounce the search query to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults({
          locations: [],
          loading: false,
          error: null,
        });
        return;
      }

      setResults(prev => ({ ...prev, loading: true, error: null }));

      try {
        const locations = await searchLocations(debouncedQuery);
        setResults({
          locations,
          loading: false,
          error: null,
        });
      } catch (error) {
        setResults({
          locations: [],
          loading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    };

    fetchSearchResults();
  }, [debouncedQuery]);

  const searchNearbyLocations = useCallback(async (coordinates: Coordinates, radius?: number) => {
    setResults(prev => ({ ...prev, loading: true, error: null }));

    try {
      const locations = await getNearbyLocations(coordinates, radius);
      setResults({
        locations,
        loading: false,
        error: null,
      });
    } catch (error) {
      setResults({
        locations: [],
        loading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    searchNearbyLocations,
  };
};