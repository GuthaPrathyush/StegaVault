import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const backendURI = import.meta.env.VITE_BACKEND_URI;
  const navigate = useNavigate();
  
  // State variables
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data state
  const [userNfts, setUserNfts] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  
  // Marketplace state
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplacePage, setMarketplacePage] = useState(1);
  const [marketplacePagination, setMarketplacePagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 30
  });
  
  // Check if user session is valid
  const validateSession = async () => {
    setIsLoading(true);
    setError(null);
    
    const auth_token = localStorage.getItem('auth_token');
    
    if (!auth_token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
    
    try {
      const response = await axios.post(`${backendURI}/checkUser`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'auth_token': auth_token
        }
      });
      
      if (response.data.valid) {
        setIsAuthenticated(true);
        await fetchUserProfile(); // Fetch user profile after successful authentication
        setIsLoading(false);
        return true;
      } else {
        handleLogout();
        setError(response.data.message || 'Session expired. Please login again.');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Session validation error:', err);
      handleLogout();
      setError(err.response?.data?.message || 'Authentication failed. Please login again.');
      setIsLoading(false);
      return false;
    }
  };
  
  // Fetch user profile
  const fetchUserProfile = async () => {
    const auth_token = localStorage.getItem('auth_token');
    
    if (!auth_token) {
      return;
    }
    
    try {
      const response = await axios.get(`${backendURI}/getProfile`, {
        headers: {
          'auth_token': auth_token
        }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        setError(response.data.message || 'Failed to fetch user profile.');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch user profile.');
    }
  };
  
  // Fetch user's NFTs
  const fetchUserNfts = async () => {
    setIsLoading(true);
    const auth_token = localStorage.getItem('auth_token');
    
    if (!auth_token) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(`${backendURI}/getUserArtworks`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'auth_token': auth_token
        }
      });
      
      if (response.data.success) {
        setUserNfts(response.data.artworks);
      } else {
        setError(response.data.message || 'Failed to load your artwork collection.');
      }
    } catch (err) {
      console.error('Error fetching user NFTs:', err);
      setError(err.response?.data?.message || 'Failed to load your artwork collection.');
      
      // If unauthorized, validate session again
      if (err.response?.status === 401) {
        validateSession();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch user's transactions
  const fetchUserTransactions = async () => {
    setIsLoading(true);
    const auth_token = localStorage.getItem('auth_token');
    
    if (!auth_token) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(`${backendURI}/getUserTransactions`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'auth_token': auth_token
        }
      });
      
      if (response.data.success) {
        setUserTransactions(response.data.transactions);
      } else {
        setError(response.data.message || 'Failed to load your transaction history.');
      }
    } catch (err) {
      console.error('Error fetching user transactions:', err);
      setError(err.response?.data?.message || 'Failed to load your transaction history.');
      
      // If unauthorized, validate session again
      if (err.response?.status === 401) {
        validateSession();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch marketplace items with pagination
  const fetchMarketplaceItems = async (page = 1, itemsPerPage = 30) => {
    setMarketplaceLoading(true);
    setError(null);
    
    const auth_token = localStorage.getItem('auth_token');
    
    if (!auth_token) {
      setMarketplaceLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(
        `${backendURI}/getMarketplaceItems`,
        { page, items_per_page: itemsPerPage },
        {
          headers: {
            'Content-Type': 'application/json',
            'auth_token': auth_token
          }
        }
      );
      
      if (response.data.success) {
        setMarketplaceItems(response.data.items);
        setMarketplacePagination(response.data.pagination);
        setMarketplacePage(response.data.pagination.current_page);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
      setError(err.response?.data?.message || 'Failed to load marketplace items.');
      
      // If unauthorized, validate session again
      if (err.response?.status === 401) {
        validateSession();
      }
    } finally {
      setMarketplaceLoading(false);
    }
  };
  
  // Change marketplace page
  const changeMarketplacePage = (newPage) => {
    if (newPage >= 1 && newPage <= marketplacePagination.total_pages) {
      setMarketplacePage(newPage);
      fetchMarketplaceItems(newPage);
    }
  };
  
  // Handle user login
  const login = async (mail, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${backendURI}/login`, { mail, password }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Store token in localStorage
      localStorage.setItem('auth_token', response.data.auth_token);
      
      // Validate session and fetch user data
      await validateSession();
      
      // Load user data
      await Promise.all([
        fetchUserNfts(),
        fetchUserTransactions()
      ]);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
      return false;
    }
  };
  
  // Handle user registration
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${backendURI}/register`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setIsLoading(false);
      return {
        success: true,
        message: response.data.message
      };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };
  
  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    setUserNfts([]);
    setUserTransactions([]);
    navigate('/login');
  };
  
  // Upload a new NFT
  const uploadNft = async (formData) => {
    setIsLoading(true);
    setError(null);
    
    const auth_token = localStorage.getItem('auth_token');
    
    if (!auth_token) {
      setError('Authentication required');
      setIsLoading(false);
      navigate('/login');
      return { success: false, message: 'Authentication required' };
    }
    
    try {
      const response = await axios.post(`${backendURI}/upload-nft`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'auth_token': auth_token
        }
      });
      
      // Refresh NFTs after upload
      if (response.data.success) {
        await fetchUserNfts();
      }
      
      setIsLoading(false);
      return {
        success: response.data.success,
        message: response.data.message,
        nft_id: response.data.nft_id,
        image_url: response.data.image_url
      };
    } catch (err) {
      console.error('NFT upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload artwork.');
      
      // If unauthorized, validate session again
      if (err.response?.status === 401) {
        validateSession();
      }
      
      setIsLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to upload artwork'
      };
    }
  };
  
  // Initial authentication check when app loads
  useEffect(() => {
    const initializeAuth = async () => {
      await validateSession();
      
      if (isAuthenticated) {
        // If session is valid, fetch user data
        await Promise.all([
          fetchUserNfts(),
          fetchUserTransactions()
        ]);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Context value
  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    userNfts,
    userTransactions,
    marketplaceItems,
    marketplaceLoading,
    marketplacePage,
    marketplacePagination,
    login,
    register,
    logout: handleLogout,
    validateSession,
    fetchUserProfile,
    fetchUserNfts,
    fetchUserTransactions,
    fetchMarketplaceItems,
    changeMarketplacePage,
    uploadNft,
    clearError: () => setError(null)
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
