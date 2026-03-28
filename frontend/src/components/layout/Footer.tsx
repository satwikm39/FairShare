import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <img src="/fairShareLogo.svg" alt="FairShare Logo" className="w-6 h-6 opacity-80" />
          <span className="font-black text-sm tracking-tighter text-zinc-900 dark:text-white uppercase">
            FairShare
          </span>
          <span className="text-xs text-zinc-400 ml-2">
            © 2026 Professional Ledger
          </span>
        </div>

        <div className="flex items-center gap-6">
           <Link to="/about" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            About Us
          </Link>
          <a href="https://github.com/satwikm39/FairShare" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Github
          </a>
        </div>
      </div>
    </footer>
  );
}
