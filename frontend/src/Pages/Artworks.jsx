import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiGrid, FiList, FiSearch, FiChevronDown, FiInfo } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';

const Artworks = () => {
  const navigate = useNavigate();
  const { 
    userNfts, 
    fetchUserNfts, 
    isLoading, 
    user, 
    isAuthenticated 
  } = useAppContext();
  
  // State for filtering and display options
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredNfts, setFilteredNfts] = useState([]);
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Fetch user's NFTs when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserNfts();
    }
  }, []);
  
  // Filter and sort NFTs based on search query and sort option
  useEffect(() => {
    if (!userNfts) return;
    
    let filtered = [...userNfts];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(query) || 
        (nft.publisher_mail && nft.publisher_mail.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'name-az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    
    setFilteredNfts(filtered);
  }, [userNfts, searchQuery, sortOption]);
  
  // Navigate to NFT detail page
  const handleNftClick = (nftId) => {
    navigate(`/nft/${nftId}`);
  };
  
  // Render loading skeleton
  const renderSkeleton = () => {
    return Array(8).fill(0).map((_, index) => (
      <div key={index} className="animate-pulse">
        {viewMode === 'grid' ? (
          <div className="bg-white/5 rounded-xl overflow-hidden">
            <div className="bg-gray-700/50 h-48 w-full"></div>
            <div className="p-4">
              <div className="bg-gray-700/50 h-4 w-3/4 rounded mb-2"></div>
              <div className="bg-gray-700/50 h-4 w-1/2 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-4 flex">
            <div className="bg-gray-700/50 h-20 w-20 rounded-lg flex-shrink-0"></div>
            <div className="ml-4 flex-grow">
              <div className="bg-gray-700/50 h-4 w-3/4 rounded mb-2"></div>
              <div className="bg-gray-700/50 h-4 w-1/2 rounded mb-2"></div>
              <div className="bg-gray-700/50 h-4 w-1/4 rounded"></div>
            </div>
          </div>
        )}
      </div>
    ));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Artworks</h1>
          <p className="text-[#22D3EE] mt-2">Manage your digital art collection</p>
        </div>
        
        {/* Filters and Controls */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search your artworks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-lg bg-white/10 border border-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent transition-all"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#22D3EE] text-white' : 'text-gray-400'}`}
                aria-label="Grid view"
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#22D3EE] text-white' : 'text-gray-400'}`}
                aria-label="List view"
              >
                <FiList />
              </button>
            </div>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 bg-white/10 rounded-lg text-white"
            >
              <FiFilter className="mr-2" />
              Filters
              <FiChevronDown className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 animate-slideDown">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="name-az">Name: A to Z</option>
                    <option value="name-za">Name: Z to A</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Artworks Grid/List */}
        <div className={`mb-8 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}`}>
          {isLoading ? (
            renderSkeleton()
          ) : filteredNfts.length > 0 ? (
            filteredNfts.map((nft) => (
              <div 
                key={nft._id} 
                onClick={() => handleNftClick(nft._id)}
                className={`cursor-pointer transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[#22D3EE]/10 hover:transform hover:-translate-y-1' 
                    : 'bg-white/5 hover:bg-white/10 rounded-xl p-4 flex items-center hover:shadow-lg hover:shadow-[#22D3EE]/10'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={nft.image_url || nft.image} 
                        alt={nft.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-4 w-full">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{formatCurrency(nft.price || 0)}</span>
                            <span className="bg-[#22D3EE]/20 text-[#22D3EE] text-xs px-2 py-1 rounded-full">
                              {nft.publisher_mail === user?.mail ? 'Creator' : 'Purchased'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-white text-lg">{nft.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {nft.publisher_mail === user?.mail ? 'Created by you' : `Created by ${nft.publisher_mail}`}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[#22D3EE]">{formatCurrency(nft.price || 0)}</span>
                        <span className="text-xs text-gray-400">{nft.timestamp ? formatDate(nft.timestamp) : 'No date'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={nft.image_url || nft.image} 
                        alt={nft.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-white">{nft.name}</h3>
                        <span className="text-[#22D3EE] font-medium">{formatCurrency(nft.price || 0)}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {nft.publisher_mail === user?.mail ? 'Created by you' : `Created by ${nft.publisher_mail}`}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="bg-[#22D3EE]/20 text-[#22D3EE] text-xs px-2 py-1 rounded-full">
                          {nft.publisher_mail === user?.mail ? 'Creator' : 'Purchased'}
                        </span>
                        <span className="text-xs text-gray-400">{nft.timestamp ? formatDate(nft.timestamp) : 'No date'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white/5 rounded-xl p-8 text-center">
              <FiInfo className="mx-auto text-4xl text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No artworks found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "No artworks match your search criteria. Try adjusting your filters." 
                  : "You don't have any artworks in your collection yet."}
              </p>
              <button 
                onClick={() => navigate('/upload')}
                className="px-6 py-3 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white rounded-lg font-medium"
              >
                Upload New Artwork
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Artworks;
