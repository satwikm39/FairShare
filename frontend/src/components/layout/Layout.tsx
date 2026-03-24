import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { isDemoMode } from '../../config/demo';

export function Layout() {
  const demoActive = isDemoMode();
  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col ${demoActive ? 'pt-24' : 'pt-16'} selection:bg-brand-500 selection:text-white`}>
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
