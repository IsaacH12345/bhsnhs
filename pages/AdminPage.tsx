
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

interface AdminPageProps {
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#1E1B2E] text-white">
      <div className="bg-[#2A2640] p-10 rounded-xl shadow-2xl text-center max-w-3xl w-full">
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>
        <p className="text-lg text-gray-300 mb-6">
          Welcome to the admin control center. Here you will be able to manage website content,
          upload documents, update statistics, and manage upcoming events.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#3B375E] p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Manage Content</h2>
            <p className="text-sm text-gray-300 mb-4">Edit text, upload images, and update page information.</p>
            <Button onClick={() => alert('Content management feature coming soon!')}>Edit Pages</Button>
          </div>
          <div className="bg-[#3B375E] p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Upload Files</h2>
            <p className="text-sm text-gray-300 mb-4">Upload spreadsheets, documents, and other resources.</p>
            <Button onClick={() => alert('File upload feature coming soon!')}>Upload</Button>
          </div>
          <div className="bg-[#3B375E] p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Update Statistics</h2>
            <p className="text-sm text-gray-300 mb-4">Modify the statistics displayed on the homepage.</p>
            <Button onClick={() => alert('Statistics update feature coming soon!')}>Edit Stats</Button>
          </div>
          <div className="bg-[#3B375E] p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Manage Dates</h2>
            <p className="text-sm text-gray-300 mb-4">Add, edit, or remove upcoming events and dates.</p>
            <Button onClick={() => alert('Date management feature coming soon!')}>Edit Dates</Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={handleLogoutClick} className="bg-red-600 hover:bg-red-500">
            Logout
          </Button>
          <Button onClick={() => navigate('/')} className="bg-slate-600 hover:bg-slate-500">
            Back to Home
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-8">
          This admin panel is a work in progress. More features will be added soon.
        </p>
      </div>
    </div>
  );
};

export default AdminPage;
    