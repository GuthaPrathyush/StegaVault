import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const backendURI = import.meta.env.VITE_BACKEND_URI;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Calculate password strength when password field changes
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    // Simple password strength calculator
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (passwordStrength < 3) {
      setError('Please use a stronger password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create a new object with only the needed fields and rename email to mail
      const userData = {
        name: formData.name,
        mail: formData.email, // Changed from email to mail as requested
        password: formData.password
        // confirmPassword is intentionally omitted
      };
      
      const response = await axios.post(`${backendURI}/register`, userData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
      });
      
      const data = response.data;
      
      // Optionally auto-login the user
      setError(data.message);
      
      // Navigate to login page after successful registration
      if (response.status === 200 || response.status === 201) {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.log(err)
      if(err.response) {
        setError(err?.response?.data?.message);
      }
      else {
        setError(err.message)
      }
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
          <p className="mt-2 text-[#22D3EE]">Join the secure digital art revolution</p>
        </div>
        
        {/* Registration Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6">Create Account</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                placeholder="••••••••"
                required
              />
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Password strength:</span>
                    <span className="text-xs font-medium" style={{ 
                      color: passwordStrength === 0 ? '#ef4444' : 
                             passwordStrength === 1 ? '#f59e0b' : 
                             passwordStrength === 2 ? '#10b981' : 
                             passwordStrength >= 3 ? '#22D3EE' : '#ef4444'
                    }}>
                      {passwordStrength === 0 ? 'Weak' : 
                       passwordStrength === 1 ? 'Fair' : 
                       passwordStrength === 2 ? 'Good' : 
                       passwordStrength >= 3 ? 'Strong' : 'Weak'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ 
                      width: `${passwordStrength * 25}%`,
                      backgroundColor: passwordStrength === 0 ? '#ef4444' : 
                                       passwordStrength === 1 ? '#f59e0b' : 
                                       passwordStrength === 2 ? '#10b981' : 
                                       passwordStrength >= 3 ? '#22D3EE' : '#ef4444'
                    }}></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Use 8+ characters with a mix of letters, numbers & symbols
                  </p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-700 focus:ring-[#22D3EE]'
                } text-white focus:outline-none focus:ring-2 focus:border-transparent`}
                placeholder="••••••••"
                required
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}
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
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
            
            <div className="text-xs text-gray-400 mb-6">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-[#22D3EE] hover:text-[#A855F7] transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-[#22D3EE] hover:text-[#A855F7] transition-colors">
                Privacy Policy
              </a>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <a href="/login" className="text-[#22D3EE] hover:text-[#A855F7] transition-colors font-medium">
                Sign in
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

export default Register;
