// TransactionItem.jsx
import { FiDollarSign } from 'react-icons/fi';

const TransactionItem = ({ transaction, user, formatCurrency, formatDate }) => {
  const isSeller = transaction.from === user?.mail;
  
  return (
    <div className="flex items-start p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
        isSeller ? 'bg-green-500/20' : 'bg-blue-500/20'
      }`}>
        <FiDollarSign className={`${
          isSeller ? 'text-green-400' : 'text-blue-400'
        }`} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="font-medium text-white">{transaction.nft_name || 'Artwork'}</h4>
          <span className="font-medium text-white">{formatCurrency(transaction.price)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-400">
            {isSeller ? `Sold to ${transaction.to}` : `Bought from ${transaction.from}`}
          </p>
          <span className="text-xs text-gray-400">{formatDate(transaction.timestamp)}</span>
        </div>
        <div className="mt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            isSeller ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isSeller ? 'Sold' : 'Purchased'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
