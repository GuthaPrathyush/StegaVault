import { useEffect, useState } from 'react';
import { FiDollarSign, FiShoppingCart, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import { Navigate, useNavigate } from 'react-router-dom';

const Marketplace = () => {
  const { 
    isAuthenticated,
    marketplaceItems, 
    marketplaceLoading, 
    marketplacePage, 
    marketplacePagination,
    fetchMarketplaceItems,
    changeMarketplacePage,
    user
  } = useAppContext();
  
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  
  // Fetch marketplace items when component mounts or page changes
  useEffect(() => {
    fetchMarketplaceItems(marketplacePage);
  }, []);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const { current_page, total_pages } = marketplacePagination;
    const buttons = [];
    
    // Previous button
    buttons.push(
      <button 
        key="prev" 
        onClick={() => changeMarketplacePage(current_page - 1)}
        disabled={current_page === 1}
        className="px-3 py-1 rounded-md bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiChevronLeft />
      </button>
    );
    
    // Page number buttons
    let startPage = Math.max(1, current_page - 2);
    let endPage = Math.min(total_pages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => changeMarketplacePage(i)}
          className={`px-3 py-1 rounded-md ${
            i === current_page 
              ? 'bg-[#22D3EE] text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Next button
    buttons.push(
      <button 
        key="next" 
        onClick={() => changeMarketplacePage(current_page + 1)}
        disabled={current_page === total_pages}
        className="px-3 py-1 rounded-md bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiChevronRight />
      </button>
    );
    
    return buttons;
  };
  
  // Filter categories
  const categories = [
    { id: 'all', name: 'All Artworks' },
    { id: 'digital', name: 'Digital Art' },
    { id: 'photography', name: 'Photography' },
    { id: 'abstract', name: 'Abstract' }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-[#22D3EE] mt-2">Discover and collect unique digital artworks</p>
        </div>
        
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === category.id
                    ? 'bg-[#22D3EE] text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                } transition-colors`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Marketplace Grid */}
        <div className="mb-8">
          {marketplaceLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-700/50 h-48 rounded-lg mb-2"></div>
                  <div className="bg-gray-700/50 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-700/50 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : marketplaceItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {marketplaceItems.map((nft) => (
                <div key={nft._id} className="group cursor-pointer" onClick={() => navigate(`/nft/${nft._id}`)}>
                  <div className="relative overflow-hidden rounded-lg mb-2">
                    <img 
                      src={nft.image_url} 
                      alt={nft.name} 
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                      draggable="false"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4 w-full">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{formatCurrency(nft.price || 0)}</span>
                          <button className="bg-[#22D3EE] hover:bg-[#A855F7] transition-colors text-white rounded-full p-2">
                            <FiShoppingCart className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-medium text-white group-hover:text-[#22D3EE] transition-colors">{nft.name}</h3>
                  <p className="text-sm text-gray-400">by {nft.publisher_mail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/5 rounded-lg">
              <FiShoppingCart className="mx-auto text-4xl text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No artworks available</h3>
              <p className="text-gray-400">Check back later for new listings</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {marketplaceItems.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {renderPaginationButtons()}
            </div>
          </div>
        )}
        
        {/* Marketplace Info */}
        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5">
          <h2 className="text-xl font-semibold mb-4">About StegaVault Marketplace</h2>
          <p className="text-gray-300 mb-4">
            StegaVault uses advanced steganography to embed ownership information directly into each artwork.
            This creates a secure, verifiable record of ownership that travels with the digital asset itself.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium text-[#22D3EE] mb-2">Secure Ownership</h3>
              <p className="text-sm text-gray-400">Each artwork contains embedded proof of ownership that can be verified at any time.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium text-[#22D3EE] mb-2">Direct Transfers</h3>
              <p className="text-sm text-gray-400">When you purchase an artwork, ownership is transferred directly to you.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium text-[#22D3EE] mb-2">Creator Support</h3>
              <p className="text-sm text-gray-400">Your purchases directly support the artists who create these unique digital works.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
