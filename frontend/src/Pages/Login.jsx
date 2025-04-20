import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const backendURI = import.meta.env.VITE_BACKEND_URI;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Create user credentials object with mail instead of email
      const userData = {
        mail: mail,
        password: password
      };
      
      // Use axios instead of fetch for the API call
      const response = await axios.post(`${backendURI}/login`, userData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
      });
      
      const data = response.data;
      
      // Store JWT token in localStorage
      localStorage.setItem('auth_token', data.token);
      navigate('/dashboard');
    } catch (err) {
      // Handle error from axios response
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-10">
          <div className="flex justify-center">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white">StegaVault</h1>
          <p className="mt-2 text-[#22D3EE]">Secure your digital art with embedded signatures</p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="mail" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="mail"
                name="mail"
                type="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <a href="/forgot-password" className="text-sm text-[#22D3EE] hover:text-[#A855F7] transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="mb-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22D3EE] disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <a href="/register" className="text-[#22D3EE] hover:text-[#A855F7] transition-colors font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2025 StegaVault. All rights reserved.</p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="/terms" className="hover:text-[#22D3EE] transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-[#22D3EE] transition-colors">Privacy</a>
            <a href="/help" className="hover:text-[#22D3EE] transition-colors">Help</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
