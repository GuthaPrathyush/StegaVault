import { useState, useEffect } from 'react';
import { FiUpload, FiDollarSign, FiImage, FiTrendingUp, FiUser, FiClock } from 'react-icons/fi';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Static data
  const stats = {
    totalArtworks: 147,
    totalSales: 32,
    pendingTransactions: 8,
    newUsers: 24
  };
  
  // Static artworks with real images from Unsplash
  const staticArtworks = [
    { 
      id: 1, 
      title: "Cosmic Dreamer", 
      artist: "Elena Bright", 
      price: 8500, 
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
    { 
      id: 2, 
      title: "Digital Serenity", 
      artist: "Marcus Wei", 
      price: 12000, 
      imageUrl: "https://images.unsplash.com/photo-1633186223008-a86b90689023?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
    { 
      id: 3, 
      title: "Neon Memories", 
      artist: "Sophia Chen", 
      price: 6500, 
      imageUrl: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
    { 
      id: 4, 
      title: "Quantum Landscape", 
      artist: "Jamal Harris", 
      price: 21000, 
      imageUrl: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
    },
  ];
  
  const staticTransactions = [
    {
      id: 101,
      artwork: "Astral Projection",
      buyer: "Alex Morgan",
      seller: "Diana Prince",
      price: 14500,
      status: "completed",
      date: "2025-04-18T14:22:30Z"
    },
    {
      id: 102,
      artwork: "Cyber Dawn",
      buyer: "James Wilson",
      seller: "Elena Bright",
      price: 9500,
      status: "completed",
      date: "2025-04-19T09:15:45Z"
    },
    {
      id: 103,
      artwork: "Quantum Landscape",
      buyer: "Sarah Johnson",
      seller: "Jamal Harris",
      price: 21000,
      status: "pending",
      date: "2025-04-20T11:05:12Z"
    },
    {
      id: 104,
      artwork: "Digital Serenity",
      buyer: "Michael Brown",
      seller: "Marcus Wei",
      price: 12000,
      status: "pending",
      date: "2025-04-20T16:30:22Z"
    },
  ];
  
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
      {/* Main content with padding-top to account for fixed navbar */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome to StegaVault</h1>
          <p className="text-[#22D3EE] mt-2">Your secure digital art platform with embedded signatures</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 hover:border-[#22D3EE]/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Artworks</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalArtworks}</h3>
              </div>
              <div className="bg-[#22D3EE]/20 p-3 rounded-lg">
                <FiImage className="text-[#22D3EE] text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <FiTrendingUp className="mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 hover:border-[#A855F7]/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Sales</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalSales}</h3>
              </div>
              <div className="bg-[#A855F7]/20 p-3 rounded-lg">
                <FiDollarSign className="text-[#A855F7] text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <FiTrendingUp className="mr-1" />
              <span>+8% from last month</span>
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
                <p className="text-gray-400 text-sm">New Users</p>
                <h3 className="text-2xl font-bold mt-1">{stats.newUsers}</h3>
              </div>
              <div className="bg-[#A855F7]/20 p-3 rounded-lg">
                <FiUser className="text-[#A855F7] text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <FiTrendingUp className="mr-1" />
              <span>+15% from last month</span>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Artworks */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recent Artworks</h2>
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
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {staticArtworks.map((artwork) => (
                    <div key={artwork.id} className="group cursor-pointer">
                      <div className="relative overflow-hidden rounded-lg mb-2">
                        <img 
                          src={artwork.imageUrl} 
                          alt={artwork.title} 
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="p-3 w-full">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium">{formatCurrency(artwork.price)}</span>
                              <button className="bg-[#22D3EE] hover:bg-[#A855F7] transition-colors text-white rounded-full p-1">
                                <FiDollarSign />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-medium text-white group-hover:text-[#22D3EE] transition-colors">{artwork.title}</h3>
                      <p className="text-sm text-gray-400">by {artwork.artist}</p>
                    </div>
                  ))}
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
          
          {/* Recent Transactions */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5 h-full">
              <h2 className="text-xl font-semibold mb-6">Recent Transactions</h2>
              
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
              ) : (
                <div className="space-y-4">
                  {staticTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-start p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        transaction.status === 'completed' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                      }`}>
                        <FiDollarSign className={`${
                          transaction.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-white">{transaction.artwork}</h4>
                          <span className="font-medium text-white">{formatCurrency(transaction.price)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-400">
                            {transaction.buyer} from {transaction.seller}
                          </p>
                          <span className="text-xs text-gray-400">{formatDate(transaction.date)}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
