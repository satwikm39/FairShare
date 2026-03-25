import { Rocket, Globe, Database, UserX, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { enableDemoMode } from '../config/demo';

const bullets = [
  {
    icon: Globe,
    text: 'Runs entirely in your browser — no servers involved.',
  },
  {
    icon: Database,
    text: 'Pre-loaded with sample groups, bills, and members to explore.',
  },
  {
    icon: UserX,
    text: 'No signup or account required. Jump right in.',
  },
];

export function LiveDemo() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center text-center">
      {/* Icon */}
      <div className="inline-flex items-center justify-center p-5 bg-brand-50 dark:bg-brand-900/20 rounded-full mb-4 shadow-lg shadow-brand-500/10">
        <Rocket className="w-14 h-14 text-brand-500" />
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
        Try FairShare — <br className="hidden sm:block" />No Signup Required
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
        Experience the full app instantly. The interactive demo runs locally in your browser so you can explore every feature risk-free.
      </p>

      {/* CTA */}
      <Button
        className="text-lg px-10 py-4 rounded-2xl shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all font-bold mb-8"
        onClick={() => {
          enableDemoMode();
          window.location.href = '/dashboard';
        }}
      >
        🚀 Launch Demo
      </Button>

      {/* Bullet points */}
      <div className="w-full bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 space-y-5 mb-6 text-left">
        {bullets.map((b, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <b.icon className="w-5 h-5" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-2">
              {b.text}
            </span>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-full font-medium text-sm mb-4">
        <Clock className="w-4 h-4" />
        <span>Demo data resets when you clear your browser storage.</span>
      </div>

      <Link to="/">
        <Button variant="secondary" className="px-8">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
