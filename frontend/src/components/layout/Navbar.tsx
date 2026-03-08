import { Receipt } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../config/firebase';

export function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <div className="bg-brand-500 text-white p-1.5 rounded-xl shadow-lg shadow-brand-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              FairShare
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold overflow-hidden border-2 border-brand-200">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.displayName?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
