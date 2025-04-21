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
  // const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState(null);
  // const [userNfts, setUserNfts] = useState([]);
  // const [userTransactions, setUserTransactions] = useState([]);

  const [user, setUser] = useState({
    name: "John Doe",
    mail: "john@example.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80"
  });
  // const [isAuthenticated, setIsAuthenticated] = useState(true);
  // const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Static data for user's NFTs
  const [userNfts, setUserNfts] = useState([]);
  // ([
  //   { 
  //     _id: "nft1", 
  //     name: "Cosmic Dreamer", 
  //     publisher_mail: "john@example.com", 
  //     owner_mail: "john@example.com", 
  //     price: 8500, 
  //     image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
  //   },
  //   { 
  //     _id: "nft2", 
  //     name: "Digital Serenity", 
  //     publisher_mail: "marcus@example.com", 
  //     owner_mail: "john@example.com", 
  //     price: 12000, 
  //     image: "https://images.unsplash.com/photo-1633186223008-a86b90689023?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
  //   },
  //   { 
  //     _id: "nft3", 
  //     name: "Neon Memories", 
  //     publisher_mail: "john@example.com", 
  //     owner_mail: "john@example.com", 
  //     price: 6500, 
  //     image: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
  //   },
  //   { 
  //     _id: "nft4", 
  //     name: "Quantum Landscape", 
  //     publisher_mail: "jamal@example.com", 
  //     owner_mail: "john@example.com", 
  //     price: 21000, 
  //     image: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
  //   },
  // ]);
  
  // Static data for user's transactions
  const [userTransactions, setUserTransactions] = useState([])
  // ([
  //   {
  //     _id: "tx101",
  //     nft_id: "nft5",
  //     nft_name: "Astral Projection",
  //     from: "john@example.com",
  //     to: "alex@example.com",
  //     price: 14500,
  //     timestamp: "2025-04-18T14:22:30Z"
  //   },
  //   {
  //     _id: "tx102",
  //     nft_id: "nft6",
  //     nft_name: "Cyber Dawn",
  //     from: "elena@example.com",
  //     to: "john@example.com",
  //     price: 9500,
  //     timestamp: "2025-04-19T09:15:45Z"
  //   },
  //   {
  //     _id: "tx103",
  //     nft_id: "nft4",
  //     nft_name: "Quantum Landscape",
  //     from: "jamal@example.com",
  //     to: "john@example.com",
  //     price: 21000,
  //     timestamp: "2025-04-20T11:05:12Z"
  //   },
  //   {
  //     _id: "tx104",
  //     nft_id: "nft2",
  //     nft_name: "Digital Serenity",
  //     from: "marcus@example.com",
  //     to: "john@example.com",
  //     price: 12000,
  //     timestamp: "2025-04-20T16:30:22Z"
  //   },
  // ]);
  
  // Static marketplace data
  const [marketplaceNfts, setMarketplaceNfts] = useState([
    { 
      _id: "nft5", 
      name: "Ethereal Dreams", 
      publisher_mail: "sarah@example.com", 
      owner_mail: "sarah@example.com", 
      price: 15000, 
      image: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
    { 
      _id: "nft6", 
      name: "Cyber Dawn", 
      publisher_mail: "elena@example.com", 
      owner_mail: "elena@example.com", 
      price: 9500, 
      image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
    { 
      _id: "nft7", 
      name: "Digital Horizon", 
      publisher_mail: "michael@example.com", 
      owner_mail: "michael@example.com", 
      price: 18000, 
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
    { 
      _id: "nft8", 
      name: "Abstract Thoughts", 
      publisher_mail: "priya@example.com", 
      owner_mail: "priya@example.com", 
      price: 7500, 
      image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
  ]);
  
  // Static notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "sale",
      message: "Your artwork 'Digital Serenity' was sold",
      timestamp: "2025-04-20T14:30:00Z",
      read: false
    },
    {
      id: 2,
      type: "follower",
      message: "New follower: Alex Morgan",
      timestamp: "2025-04-19T11:15:00Z",
      read: true
    },
    {
      id: 3,
      type: "collection",
      message: "New collection available: 'Neon Dreams'",
      timestamp: "2025-04-18T09:45:00Z",
      read: false
    }
  ]);
  
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
      const response = await axios.post(`${backendURI}/checkUser`, { auth_token }, {
        headers: {
          'Content-Type': 'application/json',
          'auth_token': `${auth_token}`,
          Accept: 'application/json'
        }
      });
      
      const { valid, user: userData } = response.data;
      
      if (valid) {
        setIsAuthenticated(true);
        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        // Session is invalid
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
          'Content-type': "application/json",
          Accept: 'application/json',
          'auth_token': `${auth_token}`
        }
      });
      
      setUserNfts(response.data.artworks);
      console.log(response.data.artworks);
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
          'Content-type': 'application/json',
          Accept: 'application/json',
          'auth_token': `${auth_token}`
        }
      });
      
      setUserTransactions(response.data.transactions);
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
      
      const { auth_token, user: userData } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('auth_token', auth_token);
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Load user data
      //******************* fetch user data*************************** */
      // await Promise.all([
      //   fetchUserNfts(),
      //   fetchUserTransactions()
      // ]);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
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
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
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
      const response = await axios.post(`${backendURI}/nft/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${auth_token}`
        }
      });
      
      // Refresh NFTs after upload
      await fetchUserNfts();
      
      return {
        success: true,
        nft: response.data.nft,
        message: 'Artwork uploaded successfully'
      };
    } catch (err) {
      console.error('NFT upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload artwork.');
      
      // If unauthorized, validate session again
      if (err.response?.status === 401) {
        validateSession();
      }
      
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to upload artwork'
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buy an NFT
  const buyNft = async (nftId, price) => {
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
      const response = await axios.post(`${backendURI}/nft/buy`, 
        { nft_id: nftId, price }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${auth_token}`
          }
        }
      );
      
      // Refresh data after purchase
      await Promise.all([
        fetchUserNfts(),
        fetchUserTransactions()
      ]);
      
      return {
        success: true,
        transaction: response.data.transaction,
        message: 'Artwork purchased successfully'
      };
    } catch (err) {
      console.error('NFT purchase error:', err);
      setError(err.response?.data?.message || 'Failed to purchase artwork.');
      
      // If unauthorized, validate session again
      if (err.response?.status === 401) {
        validateSession();
      }
      
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to purchase artwork'
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial authentication check when app loads
  useEffect(() => {
    const initializeAuth = async () => {
      const isValid = await validateSession();
      
      if (isValid) {
        // If session is valid, fetch user data
        //***************** fetching user data ********************** */
        // await Promise.all([
        //   fetchUserNfts(),
        //   fetchUserTransactions()
        // ]);
      } else {
        // If no valid session, redirect to login
        navigate('/login');
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
    login,
    register,
    logout: handleLogout,
    validateSession,
    fetchUserNfts,
    fetchUserTransactions,
    uploadNft,
    buyNft,
    clearError: () => setError(null)
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
