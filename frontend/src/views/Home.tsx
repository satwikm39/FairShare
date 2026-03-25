import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Users, Receipt, SplitSquareVertical, CheckCircle2 } from 'lucide-react';

const features = [
  {
    title: 'Create Groups',
    description: 'Organize shared expenses for trips, roommates, or events.',
    icon: Users,
  },
  {
    title: 'Upload Receipts',
    description: 'Smart OCR extracts items and prices from any receipt photo.',
    icon: Receipt,
  },
  {
    title: 'Assign Shares',
    description: 'Split each item exactly as consumed — fair and transparent.',
    icon: SplitSquareVertical,
  },
  {
    title: 'Track Balances',
    description: 'Real-time view of who owes what within every group.',
    icon: CheckCircle2,
  },
];

export function Home() {
  return (
    <div className="flex flex-col items-center px-4 py-8 sm:py-10">
      {/* Hero */}
      <div className="max-w-3xl text-center space-y-5 mb-10 sm:mb-12">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Split bills without the <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">headache</span>.
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
          Upload a receipt, tap to split items, and instantly know who owes what. FairShare does the math so you don't have to.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full text-lg px-8 py-4 rounded-2xl shadow-xl shadow-brand-500/30">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/demo" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full text-lg px-8 py-4 rounded-2xl shadow-sm hover:shadow-md">
              🚀 Try It Yourself
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white mb-3">
          How it works
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto">
          From receipt to settlement in minutes.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-600 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
