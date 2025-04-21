// ArtworkCard.jsx
import { FiDollarSign } from 'react-icons/fi';

const ArtworkCard = ({ nft, user, formatCurrency }) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-lg mb-2">
        <img 
          src={nft.image_url} 
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
  );
};

export default ArtworkCard;
