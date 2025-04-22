import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDollarSign, FiUser, FiCalendar, FiClock, FiShoppingCart, FiEdit, FiCheck, FiX, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useAppContext } from '../context/AppContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const NftDetail = () => {
  const { nft_id } = useParams();
  const navigate = useNavigate();
  const { 
    currentNft, 
    nftTransactions, 
    nftLoading, 
    fetchNftDetails, 
    user, 
    isAuthenticated,
    buyNft,
    updateNft
  } = useAppContext();
  
  const [buyLoading, setBuyLoading] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyError, setBuyError] = useState(null);
  
  // State for price editing
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [priceUpdateError, setPriceUpdateError] = useState(null);
  
  // State for status toggling
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(null);
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Fetch NFT details when component mounts
  useEffect(() => {
    if (isAuthenticated && nft_id) {
      fetchNftDetails(nft_id);
    }
  }, []);
  
  // Update newPrice when currentNft changes
  useEffect(() => {
    if (currentNft) {
      setNewPrice(currentNft.price.toString());
    }
  }, [currentNft]);
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!nftTransactions || nftTransactions.length < 2) {
      return null;
    }
    
    // Sort transactions by timestamp (oldest first for the chart)
    const sortedTransactions = [...nftTransactions].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const labels = sortedTransactions.map(tx => {
      const date = new Date(tx.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });
    
    const prices = sortedTransactions.map(tx => tx.price);
    
    return {
      labels,
      datasets: [
        {
          label: 'Price History (₹)',
          data: prices,
          borderColor: '#22D3EE',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: 'Price History',
        color: 'white'
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#22D3EE',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Price: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white',
          callback: function(value) {
            return `₹${value}`;
          }
        }
      }
    }
  };
  
  // Handle buy NFT
  const handleBuyNft = async () => {
    if (!currentNft) return;
    
    setBuyLoading(true);
    setBuyError(null);
    
    try {
      const result = await buyNft(nft_id);
      
      if (result.success) {
        setBuySuccess(true);
        // Refresh NFT details after purchase
        setTimeout(() => {
          fetchNftDetails(nft_id);
          setBuySuccess(false);
        }, 2000);
      } else {
        setBuyError(result.message);
      }
    } catch (err) {
      console.error('Error buying NFT:', err);
      setBuyError('Failed to complete purchase. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };
  
  // Handle price update
  const handlePriceUpdate = async () => {
    if (!currentNft || !newPrice) return;
    
    // Validate price
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      setPriceUpdateError('Please enter a valid price greater than zero');
      return;
    }
    
    setPriceUpdateLoading(true);
    setPriceUpdateError(null);
    
    try {
      const result = await updateNft(nft_id, { price: priceValue });
      
      if (result.success) {
        setIsEditingPrice(false);
        // NFT details will be refreshed by the updateNft function
      } else {
        setPriceUpdateError(result.message);
      }
    } catch (err) {
      console.error('Error updating price:', err);
      setPriceUpdateError('Failed to update price. Please try again.');
    } finally {
      setPriceUpdateLoading(false);
    }
  };
  
  // Handle status toggle
  const handleStatusToggle = async () => {
    if (!currentNft) return;
    
    const newStatus = currentNft.status === 'active' ? 'inactive' : 'active';
    
    setStatusUpdateLoading(true);
    setStatusUpdateError(null);
    
    try {
      const result = await updateNft(nft_id, { status: newStatus });
      
      if (!result.success) {
        setStatusUpdateError(result.message);
      }
      // NFT details will be refreshed by the updateNft function
    } catch (err) {
      console.error('Error updating status:', err);
      setStatusUpdateError('Failed to update status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  // Check if current user is the owner
  const isOwner = currentNft && user && currentNft.owner_mail === user.mail;
  
  // Loading state
  if (nftLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#22D3EE]"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // NFT not found state
  if (!currentNft && !nftLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
        <div className="p-6 max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/marketplace')}
            className="flex items-center text-[#22D3EE] hover:text-[#A855F7] transition-colors mb-6"
          >
            <FiArrowLeft className="mr-2" />
            Back to Marketplace
          </button>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-lg border border-white/5 text-center">
            <h2 className="text-2xl font-semibold mb-4">NFT Not Found</h2>
            <p className="text-gray-300 mb-6">The NFT you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/marketplace')}
              className="px-4 py-2 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white rounded-lg"
            >
              Explore Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-[#22D3EE] hover:text-[#A855F7] transition-colors mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back
        </button>
        
        {/* NFT Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Image */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5">
            <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
              <img 
                src={currentNft?.image_url} 
                alt={currentNft?.name} 
                className="w-full h-full object-cover"
                draggable="false"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                }}
              />
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${
                currentNft?.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {currentNft?.status === 'active' ? 'For Sale' : 'Not For Sale'}
              </div>
            </div>
            
            {/* Price History Chart */}
            {nftTransactions.length >= 2 ? (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Price History</h3>
                <div className="bg-[#0F172A]/60 p-4 rounded-lg">
                  <Line data={prepareChartData()} options={chartOptions} />
                </div>
              </div>
            ) : (
              <div className="mt-6 bg-[#0F172A]/60 p-4 rounded-lg text-center">
                <p className="text-gray-400">Not enough transaction data to display price history</p>
              </div>
            )}
          </div>
          
          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5">
              <h1 className="text-3xl font-bold mb-2">{currentNft?.name}</h1>
              
              <div className="flex items-center text-gray-300 mb-6">
                <FiCalendar className="mr-2" />
                <span>Created on {formatDate(currentNft?.timestamp)}</span>
              </div>
              
              {/* Price Display/Edit Section */}
              <div className="flex justify-between items-center mb-6">
                {isEditingPrice ? (
                  <div className="flex-1 mr-4">
                    <label className="text-sm text-gray-400 block mb-1">New Price (₹)</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        min="0.01"
                        step="0.01"
                        className="flex-1 px-3 py-2 rounded-l-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                        placeholder="Enter new price"
                      />
                      <button
                        onClick={handlePriceUpdate}
                        disabled={priceUpdateLoading}
                        className="px-3 py-2 bg-[#22D3EE] text-white rounded-r-lg hover:bg-[#22D3EE]/80 transition-colors"
                      >
                        {priceUpdateLoading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <FiCheck />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingPrice(false);
                          setNewPrice(currentNft.price.toString());
                          setPriceUpdateError(null);
                        }}
                        className="ml-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <FiX />
                      </button>
                    </div>
                    {priceUpdateError && (
                      <p className="text-red-400 text-sm mt-1">{priceUpdateError}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400">Current Price</p>
                    <div className="flex items-center">
                      <p className="text-3xl font-bold text-[#22D3EE]">{formatCurrency(currentNft?.price)}</p>
                      {isOwner && (
                        <button
                          onClick={() => setIsEditingPrice(true)}
                          className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
                          title="Edit Price"
                        >
                          <FiEdit />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Buy or Status Toggle Button */}
                {isOwner ? (
                  <button
                    onClick={handleStatusToggle}
                    disabled={statusUpdateLoading}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                      currentNft?.status === 'active'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    } transition-colors disabled:opacity-70`}
                  >
                    {statusUpdateLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    ) : currentNft?.status === 'active' ? (
                      <FiToggleRight className="mr-2" />
                    ) : (
                      <FiToggleLeft className="mr-2" />
                    )}
                    {currentNft?.status === 'active' ? 'Remove from Sale' : 'List for Sale'}
                  </button>
                ) : (
                  currentNft?.status === 'active' && (
                    <button
                      onClick={handleBuyNft}
                      disabled={buyLoading || buySuccess}
                      className="px-6 py-3 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white rounded-lg font-medium flex items-center disabled:opacity-70"
                    >
                      {buyLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : buySuccess ? (
                        <>
                          <FiDollarSign className="mr-2" />
                          Purchase Complete!
                        </>
                      ) : (
                        <>
                          <FiShoppingCart className="mr-2" />
                          Buy Now
                        </>
                      )}
                    </button>
                  )
                )}
              </div>
              
              {statusUpdateError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-100">
                  {statusUpdateError}
                </div>
              )}
              
              {buyError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-100">
                  {buyError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0F172A]/60 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Creator</p>
                  <div className="flex items-center">
                    <FiUser className="text-[#22D3EE] mr-2" />
                    <span>{currentNft?.publisher?.name || currentNft?.publisher_mail}</span>
                  </div>
                </div>
                
                <div className="bg-[#0F172A]/60 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Current Owner</p>
                  <div className="flex items-center">
                    <FiUser className="text-[#A855F7] mr-2" />
                    <span>{currentNft?.owner?.name || currentNft?.owner_mail}</span>
                    {isOwner && (
                      <span className="ml-2 px-2 py-1 bg-[#22D3EE]/20 text-[#22D3EE] text-xs rounded-full">You</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Transaction History */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5">
              <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
              
              {nftTransactions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {nftTransactions.map((transaction) => (
                    <div key={transaction._id} className="bg-[#0F172A]/60 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <FiDollarSign className="text-[#22D3EE] mr-2" />
                            <span className="font-medium">
                              {transaction.from === user?.mail ? 'You sold' : `${transaction.from} sold`}
                            </span>
                          </div>
                          <div className="ml-6 mt-1 text-sm text-gray-400">
                            to {transaction.to === user?.mail ? 'you' : transaction.to}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(transaction.price)}</div>
                          <div className="text-xs text-gray-400 flex items-center justify-end mt-1">
                            <FiClock className="mr-1" />
                            {formatDate(transaction.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0F172A]/60 p-4 rounded-lg text-center">
                  <p className="text-gray-400">No transaction history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NftDetail;
