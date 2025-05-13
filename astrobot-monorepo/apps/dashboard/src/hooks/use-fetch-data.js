import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch data from an API endpoint
 * @param {string} url - The URL to fetch data from
 * @param {object} options - Fetch options
 * @returns {object} The data, loading state, error, and refetch function
 */
export function useFetchData(url, options = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to fetch data
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  
  // Function to manually refetch data
  const refetch = () => {
    fetchData();
  };
  
  return { data, isLoading, error, refetch };
}