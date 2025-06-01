
import React, { useState, FormEvent } from 'react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSubmit: (password: string) => boolean; // Returns true on success
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSubmit }) => {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Password cannot be empty.');
      return;
    }
    const success = onSubmit(password);
    if (!success && password) { // Only show incorrect password if submit was attempted and failed
        setError('Incorrect password.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2A2640] p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#1E1B2E] border border-[#4A4466] rounded-lg text-white focus:ring-2 focus:ring-[#6F6AA0] focus:border-[#6F6AA0] outline-none transition-colors"
              placeholder="Enter admin password"
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-1/2 py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="w-full sm:w-1/2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Login
            </button>
          </div>
        </form>
         <p className="text-xs text-gray-500 mt-6 text-center">
          Note: For demonstration purposes. Real applications require backend security.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginModal;
    