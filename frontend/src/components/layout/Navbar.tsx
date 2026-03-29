import { Menu, X as CloseIcon, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../config/firebase';
import { ProfileDropdown } from '../profile/ProfileDropdown';
import { ConfirmModal } from '../ui/ConfirmModal';
import { isDemoMode, disableDemoMode } from '../../config/demo';

export function Navbar() {
  const { currentUser, isDemoActive, setDemoModeActive } = useAuth();
  const navigate = useNavigate();
  const demoActive = isDemoActive;
  
  const [isDesktopProfileOpen, setIsDesktopProfileOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
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
      if (demoActive) {
        disableDemoMode();
        setDemoModeActive(false);
        window.location.href = '/';
        return;
      }
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
      {demoActive && (
        <div className="fixed top-0 w-full h-8 bg-amber-400 text-zinc-950 flex items-center justify-center text-[10px] sm:text-[11px] font-black z-50 shadow-lg gap-3 sm:gap-4 uppercase tracking-widest border-b border-black/5 px-4">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-950 fill-zinc-950/10 animate-pulse shrink-0" />
            <span className="truncate text-center">Demo: Local Data</span>
          </div>
          <button 
            onClick={() => { disableDemoMode(); setDemoModeActive(false); window.location.href = '/'; }}
            className="underline underline-offset-2 hover:opacity-75 transition-opacity shrink-0"
          >
            Exit Demo
          </button>
        </div>
      )}
      <nav className={`fixed ${demoActive ? 'top-8' : 'top-0'} w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 z-50 transition-colors duration-300`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
              <img src="/fairShareLogo.svg" alt="FairShare Logo" className="w-8 h-8" />
              <span className="font-black text-xl tracking-tighter text-zinc-900 dark:text-white uppercase">
                FairShare
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">

               <Link to="/dashboard" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-wider">
                Dashboard
              </Link>
              <Link to="/about" className="text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-wider">
                About
              </Link>
              {currentUser ? (
                <div 
                  className="relative group/profile"
                >
                  <div 
                    onClick={() => setIsDesktopProfileOpen(!isDesktopProfileOpen)}
                    className="h-9 w-9 rounded-sharp bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold overflow-hidden border-2 border-brand-500/50 cursor-pointer hover:border-brand-500 hover:scale-105 transition-all shadow-sm shadow-brand-500/10"
                    title="Profile Setting"
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (currentUser.name || currentUser.displayName)?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <ProfileDropdown 
                    isOpen={isDesktopProfileOpen} 
                    onClose={() => setIsDesktopProfileOpen(false)} 
                    onLogout={openLogoutConfirm}
                  />
                </div>
              ) : null}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sharp border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
              >
                {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 pt-2 pb-6 space-y-5">
               <Link 
                to="/dashboard" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-sharp text-base font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors uppercase tracking-wider"
              >
                Dashboard
              </Link>
              <Link 
                to="/about" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-sharp text-base font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors uppercase tracking-wider"
              >
                About Us
              </Link>
              {currentUser ? (
                <>
                  <div className="relative group/profile-mobile">
                    <button
                      onClick={() => {
                        setIsMobileProfileOpen(!isMobileProfileOpen);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-sharp text-base font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3 uppercase tracking-wider"
                    >
                      <div className="h-8 w-8 rounded-sharp bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold overflow-hidden border-2 border-brand-500/50">
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          (currentUser.name || currentUser.displayName)?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      Profile Setting
                    </button>
                    {isMobileProfileOpen && (
                      <div className="pl-4 pr-4 mt-2">
                        <ProfileDropdown 
                          isOpen={isMobileProfileOpen} 
                          onClose={() => setIsMobileProfileOpen(false)} 
                          onLogout={openLogoutConfirm}
                          isInline={true}
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-sharp text-base font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
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
