import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';

const Upload = () => {
  const { user } = useAppContext();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const backendURI = import.meta.env.VITE_BACKEND_URI;

  // Maximum file size (2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  // Allowed file types
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please select a JPEG or PNG image.');
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 2MB. Please select a smaller image.`);
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Clear previous errors
    setError('');
    
    // Set the file for upload
    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Form validation
    if (!name.trim()) {
      setError('Please enter a name for your NFT.');
      return;
    }

    if (!price.trim() || isNaN(price) || Number(price) <= 0) {
      setError('Please enter a valid positive number for price.');
      return;
    }

    if (!imageFile) {
      setError('Please select an image to upload.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      formData.append('image', imageFile);

      const auth_token = localStorage.getItem('auth_token');

      const response = await axios.post(
        `${backendURI}/upload-nft`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'auth_token': auth_token
          }
        }
      );

      if (response.data.success) {
        setSuccess('NFT uploaded successfully!');
        setName('');
        setPrice('');
        setImageFile(null);
        setPreviewUrl(null);
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(response.data.message || 'Upload failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during upload.');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 text-white pt-16">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New NFT</h1>
          <p className="text-[#22D3EE] mt-2">Upload your artwork to mint as an NFT on StegaVault</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/5">
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-100">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  NFT Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                  placeholder="Enter a name for your artwork"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                  Price (₹)
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0F172A]/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                  placeholder="Enter price in Rupees"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mt-4">
                  By creating this NFT, you confirm that you own the rights to this artwork and authorize StegaVault to embed your digital signature into the image.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22D3EE] focus:ring-offset-[#0F172A] disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating NFT...
                  </span>
                ) : (
                  'Create NFT'
                )}
              </button>
            </div>

            {/* Right Column - Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artwork Image
              </label>
              
              {!previewUrl ? (
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-6 h-64 flex flex-col items-center justify-center cursor-pointer hover:border-[#22D3EE] transition-colors"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FiUpload className="text-4xl text-gray-400 mb-3" />
                  <p className="text-sm text-gray-300 text-center">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    SVG, PNG, JPG (max. 2MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden h-64">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-[#0F172A]/80 hover:bg-[#0F172A] rounded-full p-2 text-white transition-colors"
                  >
                    <FiX />
                  </button>
                </div>
              )}
              
              {imageFile && (
                <p className="mt-2 text-xs text-gray-400">
                  {imageFile.name} ({(imageFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
