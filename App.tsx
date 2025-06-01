
import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ContentPage from './pages/ContentPage';
import AdminPage from './pages/AdminPage';
import AdminLoginModal from './components/AdminLoginModal';
import { NAVIGATION_LINKS, ADMIN_PASSWORD_PLACEHOLDER } from './constants';

const App: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  const handleAdminLoginAttempt = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD_PLACEHOLDER) {
      setIsAdminAuthenticated(true);
      setShowAdminLoginModal(false);
      return true;
    }
    alert("Incorrect password. This system is for authorized personnel only.");
    return false;
  }, []);

  const handleAdminLogout = useCallback(() => {
    setIsAdminAuthenticated(false);
  }, []);

  const openAdminLogin = useCallback(() => {
    setShowAdminLoginModal(true);
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#121212] text-[#E0E0E0] font-mono">
        <Routes>
          <Route path="/" element={<HomePage onAdminAreaClick={openAdminLogin} />} />
          {NAVIGATION_LINKS.slice(1).map(link => ( // Skip "Home", first 5 for buttons
            <Route 
              key={link.id} 
              path={link.path} 
              element={<ContentPage pageTitle={link.label} />} 
            />
          ))}
          <Route 
            path="/admin" 
            element={
              isAdminAuthenticated ? (
                <AdminPage onLogout={handleAdminLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Fallback route */}
        </Routes>
        {showAdminLoginModal && !isAdminAuthenticated && (
          <AdminLoginModal 
            onClose={() => setShowAdminLoginModal(false)}
            onSubmit={handleAdminLoginAttempt} 
          />
        )}
      </div>
    </HashRouter>
  );
};

export default App;
    