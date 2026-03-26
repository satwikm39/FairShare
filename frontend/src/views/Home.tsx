import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Users, Receipt, SplitSquareVertical, CheckCircle2 } from 'lucide-react';

const features = [
  {
    step: '01',
    title: 'Create Groups',
    description: 'Organize shared expenses for trips, roommates, or events.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Upload Receipts',
    description: 'Smart OCR extracts items and prices from any receipt photo.',
    icon: Receipt,
  },
  {
    step: '03',
    title: 'Assign Shares',
    description: 'Split each item exactly as consumed — fair and transparent.',
    icon: SplitSquareVertical,
  },
  {
    step: '04',
    title: 'Track Balances',
    description: 'Real-time view of who owes what within every group.',
    icon: CheckCircle2,
  },
];

export function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="max-w-3xl text-center space-y-4 mb-12">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none uppercase">
          Split bills without the <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent italic">headache</span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Upload a receipt, tap to split items, and instantly know who owes what. FairShare does the math so you don't have to.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full text-sm px-8 py-3.5 font-bold tracking-wide">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/demo" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full text-sm px-8 py-3.5 font-bold tracking-wide">
              Try It Yourself
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="w-full max-w-5xl border-t border-zinc-200 dark:border-zinc-800/60 pt-8">
        <h2 className="text-xs font-bold text-center text-zinc-400 dark:text-zinc-500 mb-8 uppercase tracking-widest">
          How it works — from receipt to settlement in minutes
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative bg-white dark:bg-zinc-900/50 dark:backdrop-blur-sm rounded-xl p-6 border border-zinc-200 dark:border-zinc-800/60 hover:border-brand-500/50 dark:hover:border-brand-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5"
            >
              <span className="absolute top-4 right-4 text-[10px] font-bold text-zinc-300 dark:text-zinc-700 tabular-nums">
                {feature.step}
              </span>
              <div className="w-12 h-12 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 group-hover:scale-105 transition-transform duration-300 border border-brand-500/10">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
