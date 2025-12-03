import { useState, useEffect } from 'react';

interface Country {
  name: string;
  officialName: string;
  nationality: string;
  flag: string;
  code: string;
}

interface UseCountriesReturn {
  countries: Country[];
  loading: boolean;
  error: string | null;
  searchCountries: (search: string) => void;
}

export function useCountries(): UseCountriesReturn {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCountries = async (search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/countries${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCountries(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch countries');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch countries');
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial countries on mount
  useEffect(() => {
    searchCountries();
  }, []);

  return {
    countries,
    loading,
    error,
    searchCountries
  };
}
