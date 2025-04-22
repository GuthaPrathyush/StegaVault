import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiUpload, FiDollarSign, FiGrid, FiSettings } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';

const Navbar = () => {
  const { user, logout } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-menu')) {
        setIsProfileOpen(false);
      }
      if (isNotificationOpen && !event.target.closest('.notification-menu')) {
        setIsNotificationOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotificationOpen]);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/marketplace') return 'Marketplace';
    if (path === '/upload') return 'Upload Artwork';
    if (path === '/profile') return 'My Profile';
    if (path === '/settings') return 'Settings';
    return 'StegaVault';
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/10 backdrop-filter backdrop-blur-lg bg-[#0F172A]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-white">StegaVault</span>
            </Link>
            
            {/* Page Title - Desktop */}
            <div className="hidden md:block ml-6">
              <h1 className="text-white font-medium">{getPageTitle()}</h1>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {/* Balance Display */}
              <div className="px-3 py-2 rounded-lg bg-white/10 border border-[#22D3EE]/30 flex items-center">
                <FiDollarSign className="text-[#22D3EE] mr-2" />
                <span className="text-white font-medium">{formatCurrency(user?.balance || 0)}</span>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search artworks, artists..."
                  className="w-64 py-2 pl-10 pr-4 rounded-lg bg-white/10 border border-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent transition-all"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Navigation Links */}
              <Link 
                to="/marketplace" 
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === '/marketplace' 
                    ? 'bg-white/10 text-[#22D3EE]' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                } transition-colors`}
              >
                Marketplace
              </Link>
              
              <Link 
                to="/upload" 
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === '/upload' 
                    ? 'bg-white/10 text-[#22D3EE]' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                } transition-colors`}
              >
                Upload
              </Link>
              
              {/* Notification Bell */}
              <div className="relative notification-menu">
                <button 
                  className="p-2 rounded-lg bg-white/10 text-gray-300 hover:text-white focus:outline-none"
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsProfileOpen(false);
                  }}
                >
                  <FiBell />
                  <span className="absolute top-0 right-0 block w-2 h-2 rounded-full bg-[#A855F7]"></span>
                </button>
                
                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-[#0F172A] border border-white/10 py-1 z-10">
                    <div className="px-4 py-2 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5">
                        <div className="flex">
                          <div className="flex-shrink-0 bg-green-500/20 rounded-full p-2">
                            <FiDollarSign className="text-green-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">Your artwork "Digital Serenity" was sold</p>
                            <p className="text-xs text-gray-400 mt-1">April 20, 2025 • 2:30 PM</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5">
                        <div className="flex">
                          <div className="flex-shrink-0 bg-blue-500/20 rounded-full p-2">
                            <FiUser className="text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">New follower: Alex Morgan</p>
                            <p className="text-xs text-gray-400 mt-1">April 19, 2025 • 11:15 AM</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-white/5 transition-colors">
                        <div className="flex">
                          <div className="flex-shrink-0 bg-purple-500/20 rounded-full p-2">
                            <FiGrid className="text-purple-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">New collection available: "Neon Dreams"</p>
                            <p className="text-xs text-gray-400 mt-1">April 18, 2025 • 9:45 AM</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-white/10">
                      <button className="text-sm text-[#22D3EE] hover:text-[#A855F7] transition-colors w-full text-center">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile Menu */}
              <div className="relative profile-menu">
                <button 
                  className="flex items-center space-x-2 p-2 rounded-lg bg-white/10 text-gray-300 hover:text-white focus:outline-none"
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotificationOpen(false);
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80" 
                    alt="User" 
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium">{user?.name || 'User'}</span>
                </button>
                
                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-[#0F172A] border border-white/10 py-1 z-10">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <div className="flex items-center">
                        <FiUser className="mr-2" />
                        My Profile
                      </div>
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <div className="flex items-center">
                        <FiSettings className="mr-2" />
                        Settings
                      </div>
                    </Link>
                    <div className="border-t border-white/10 my-1"></div>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center">
                        <FiLogOut className="mr-2" />
                        Sign Out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/10 text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0F172A] border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Balance Display - Mobile */}
            <div className="px-3 py-2 mb-2 rounded-lg bg-white/10 border border-[#22D3EE]/30 flex items-center justify-between">
              <span className="text-gray-400">Balance:</span>
              <div className="flex items-center">
                <FiDollarSign className="text-[#22D3EE] mr-1" />
                <span className="text-white font-medium">{formatCurrency(user?.balance || 0)}</span>
              </div>
            </div>
            
            {/* Page Title - Mobile */}
            <div className="px-3 py-2 text-white font-medium border-b border-white/10 mb-2">
              {getPageTitle()}
            </div>
            
            {/* Search Bar - Mobile */}
            <div className="px-3 py-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search artworks, artists..."
                  className="w-full py-2 pl-10 pr-4 rounded-lg bg-white/10 border border-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            {/* Navigation Links - Mobile */}
            <Link 
              to="/dashboard" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                location.pathname === '/dashboard' 
                  ? 'bg-white/10 text-[#22D3EE]' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } transition-colors`}
            >
              Dashboard
            </Link>
            
            <Link 
              to="/marketplace" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                location.pathname === '/marketplace' 
                  ? 'bg-white/10 text-[#22D3EE]' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } transition-colors`}
            >
              Marketplace
            </Link>
            
            <Link 
              to="/upload" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                location.pathname === '/upload' 
                  ? 'bg-white/10 text-[#22D3EE]' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } transition-colors`}
            >
              Upload
            </Link>
            
            <Link 
              to="/profile" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                location.pathname === '/profile' 
                  ? 'bg-white/10 text-[#22D3EE]' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } transition-colors`}
            >
              My Profile
            </Link>
            
            <Link 
              to="/settings" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                location.pathname === '/settings' 
                  ? 'bg-white/10 text-[#22D3EE]' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } transition-colors`}
            >
              Settings
            </Link>
            
            <div className="border-t border-white/10 my-2"></div>
            
            <button 
              onClick={logout}
              className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center">
                <FiLogOut className="mr-2" />
                Sign Out
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
