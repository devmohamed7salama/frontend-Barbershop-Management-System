import { useState, useEffect, useCallback, useRef } from 'react';

// Global in-memory cache store
const apiCache = new Map();

/**
 * Custom Hook for making API requests with optional caching.
 * 
 * @param {Function} apiFunc - Promise-returning API call function.
 * @param {Object} options - Configuration options.
 * @param {string} options.cacheKey - Unique key to cache the request data.
 * @param {number} options.cacheTime - Expiration time in milliseconds (default: 5 mins).
 * @param {boolean} options.immediate - Whether to run the query immediately on mount (default: true).
 * @param {Array} options.dependencies - List of dependencies that trigger a refetch.
 */
export default function useApi(apiFunc, options = {}) {
  const {
    cacheKey = null,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    immediate = true,
    dependencies = [],
  } = options;

  const [data, setData] = useState(() => {
    if (cacheKey && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
      } else {
        apiCache.delete(cacheKey); // Expired
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(immediate && (!cacheKey || !apiCache.has(cacheKey)));
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);
  const apiFuncRef = useRef(apiFunc);

  useEffect(() => {
    apiFuncRef.current = apiFunc;
  }, [apiFunc]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await apiFuncRef.current(...args);
      
      if (cacheKey) {
        apiCache.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
        });
      }

      if (isMounted.current) {
        setData(response);
      }
      return response;
    } catch (err) {
      console.error(`API Error for cacheKey [${cacheKey}]:`, err);
      if (isMounted.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [cacheKey]);

  useEffect(() => {
    if (immediate) {
      if (cacheKey && apiCache.has(cacheKey)) {
        const cached = apiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < cacheTime) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, cacheKey, cacheTime, ...dependencies]);

  const invalidateCache = useCallback(() => {
    if (cacheKey) {
      apiCache.delete(cacheKey);
    }
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    invalidateCache,
  };
}
