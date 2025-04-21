import { useState, useEffect } from 'react';
import { FiUpload, FiDollarSign, FiImage, FiTrendingUp, FiUser, FiClock } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { 
    isLoading, 
    userNfts, 
    userTransactions, 
    fetchUserNfts, 
    fetchUserTransactions,
    user,
    isAuthenticated
  } = useAppContext();
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  
  // Calculate stats
  const stats = {
    totalArtworks: userNfts.length,
    totalSales: userTransactions.filter(t => t.from === user?.mail).length,
    pendingTransactions: 0, // This would come from backend if you have pending status
    newPurchases: userTransactions.filter(t => t.to === user?.mail).length
  };
  
  // Refresh data when component mounts
  useEffect(() => {
    // ****************** refresh user data ************************
    // fetchUserNfts();
    // fetchUserTransactions();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#22D3EE]"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
      {/* Main content with padding-top to account for fixed navbar */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'User'}</h1>
          <p className="text-[#22D3EE] mt-2">Your secure digital art platform with embedded signatures</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 hover:border-[#22D3EE]/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Your Artworks</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalArtworks}</h3>
              </div>
              <div className="bg-[#22D3EE]/20 p-3 rounded-lg">
                <FiImage className="text-[#22D3EE] text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <FiTrendingUp className="mr-1" />
              <span>Your collection</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 hover:border-[#A855F7]/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Artworks Sold</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalSales}</h3>
              </div>
              <div className="bg-[#A855F7]/20 p-3 rounded-lg">
                <FiDollarSign className="text-[#A855F7] text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <FiTrendingUp className="mr-1" />
              <span>Your sales</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 hover:border-[#22D3EE]/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Transactions</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pendingTransactions}</h3>
              </div>
              <div className="bg-[#22D3EE]/20 p-3 rounded-lg">
                <FiClock className="text-[#22D3EE] text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-yellow-400">
              <FiClock className="mr-1" />
              <span>Awaiting confirmation</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 hover:border-[#A855F7]/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Artworks Purchased</p>
                <h3 className="text-2xl font-bold mt-1">{stats.newPurchases}</h3>
              </div>
              <div className="bg-[#A855F7]/20 p-3 rounded-lg">
                <FiUser className="text-[#A855F7] text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <FiTrendingUp className="mr-1" />
              <span>Your purchases</span>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User's NFTs */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Artworks</h2>
                <button className="text-sm text-[#22D3EE] hover:text-[#A855F7] transition-colors">
                  View All
                </button>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-700/50 h-40 rounded-lg mb-2"></div>
                      <div className="bg-gray-700/50 h-4 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-700/50 h-4 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : userNfts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {userNfts.slice(0, 4).map((nft) => (
                    <div key={nft._id} className="group cursor-pointer">
                      <div className="relative overflow-hidden rounded-lg mb-2">
                        <img 
                          src={nft.image} 
                          alt={nft.name} 
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="p-3 w-full">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium">{formatCurrency(nft.price || 0)}</span>
                              <button className="bg-[#22D3EE] hover:bg-[#A855F7] transition-colors text-white rounded-full p-1">
                                <FiDollarSign />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-medium text-white group-hover:text-[#22D3EE] transition-colors">{nft.name}</h3>
                      <p className="text-sm text-gray-400">by {nft.publisher_mail === user?.mail ? 'You' : nft.publisher_mail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">You don't have any artworks yet.</p>
                </div>
              )}
              
              <div className="mt-6">
                <button className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22D3EE] focus:ring-offset-[#0F172A]">
                  <div className="flex items-center justify-center">
                    <FiUpload className="mr-2" />
                    Upload New Artwork
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* User's Transactions */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 h-full">
              <h2 className="text-xl font-semibold mb-6">Your Transactions</h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center">
                      <div className="bg-gray-700/50 h-10 w-10 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="bg-gray-700/50 h-4 rounded w-3/4 mb-2"></div>
                        <div className="bg-gray-700/50 h-3 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userTransactions.length > 0 ? (
                <div className="space-y-4">
                  {userTransactions.slice(0, 4).map((transaction) => (
                    <div key={transaction._id} className="flex items-start p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        transaction.from === user?.mail ? 'bg-green-500/20' : 'bg-blue-500/20'
                      }`}>
                        <FiDollarSign className={`${
                          transaction.from === user?.mail ? 'text-green-400' : 'text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-white">{transaction.nft_name || 'Artwork'}</h4>
                          <span className="font-medium text-white">{formatCurrency(transaction.cost)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-400">
                            {transaction.from === user?.mail 
                              ? `Sold to ${transaction.to}` 
                              : `Bought from ${transaction.from}`}
                          </p>
                          <span className="text-xs text-gray-400">{formatDate(transaction.timestamp)}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.from === user?.mail 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {transaction.from === user?.mail ? 'Sold' : 'Purchased'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">You don't have any transactions yet.</p>
                </div>
              )}
              
              <div className="mt-6">
                <button className="w-full py-2 px-4 border border-[#22D3EE] text-[#22D3EE] rounded-lg font-medium hover:bg-[#22D3EE]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 focus:ring-offset-[#0F172A]">
                  View All Transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
