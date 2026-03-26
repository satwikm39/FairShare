import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { isDemoMode } from '../../config/demo';
import { Footer } from './Footer';

export function Layout() {
  const demoActive = isDemoMode();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className={`flex-1 w-full flex flex-col ${demoActive ? 'mt-24' : 'mt-16'}`}>
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}
