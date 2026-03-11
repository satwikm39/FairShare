import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Split bills without the <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">headache</span>.
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
          Upload a receipt, tap to split items, and instantly know who owes what. FairShare does the math so you don't have to.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full text-lg px-8 py-4 rounded-2xl shadow-xl shadow-brand-500/30">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/demo" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full text-lg px-8 py-4 rounded-2xl shadow-sm hover:shadow-md">
              View Live Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
