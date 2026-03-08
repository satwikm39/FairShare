import { Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
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
            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold cursor-pointer ring-2 ring-transparent hover:ring-brand-200 transition-all">
              US
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
