import { Moon, Sun, Menu, X as CloseIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../config/firebase';
import { EditProfileModal } from '../profile/EditProfileModal';
import { ConfirmModal } from '../ui/ConfirmModal';

export function Navbar() {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const openLogoutConfirm = () => {
    setIsMobileMenuOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
      setIsLogoutConfirmOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <>
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
              <img src="/fairShareLogo.svg" alt="FairShare Logo" className="w-8 h-8 rounded-xl shadow-lg shadow-brand-500/30" />
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                FairShare
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link to="/dashboard" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Dashboard
              </Link>
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold overflow-hidden border-2 border-brand-200 cursor-pointer hover:border-brand-400 transition-all"
                    title="Edit Profile"
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (currentUser.name || currentUser.displayName)?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <button 
                    onClick={openLogoutConfirm}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-500 dark:text-slate-400"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 pt-2 pb-6 space-y-3">
              <Link 
                to="/dashboard" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Dashboard
              </Link>
              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold overflow-hidden border border-brand-200">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        (currentUser.name || currentUser.displayName)?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    Edit Profile
                  </button>
                  <button 
                    onClick={openLogoutConfirm}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
      <EditProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => !isLoggingOut && setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign out?"
        description="You will need to sign in again to access your groups and bills."
        confirmText="Sign out"
        cancelText="Stay signed in"
        isLoading={isLoggingOut}
        variant="primary"
      />
    </>
  );
}
