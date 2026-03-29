import { useState } from 'react';
import { Rocket, Globe, Database, UserX, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enableDemoMode } from '../config/demo';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const bullets = [
  {
    icon: Globe,
    text: 'Runs entirely in your browser. No servers involved.',
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
  const navigate = useNavigate();
  const { setDemoModeActive } = useAuth();
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);

  const handleLaunchDemo = () => {
    const existingData = localStorage.getItem('fairshare_mock_db');
    if (existingData) {
      setShowDemoPrompt(true);
    } else {
      enableDemoMode();
      setDemoModeActive(true);
      navigate('/dashboard');
    }
  };

  const handleContinue = () => {
    enableDemoMode();
    setDemoModeActive(true);
    navigate('/dashboard');
  };

  const handleStartFresh = () => {
    localStorage.removeItem('fairshare_mock_db');
    setShowDemoPrompt(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center text-center">
      {/* Icon */}
      <div className="inline-flex items-center justify-center p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl mb-4 border border-brand-500/20">
        <Rocket className="w-10 h-10 text-brand-500" />
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-3 leading-none uppercase">
        Try FairShare
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed mb-6">
        Experience the full app instantly. The interactive demo runs locally in your browser.
      </p>

      {/* CTA */}
      <Button
        className="text-sm px-12 py-4 font-bold tracking-wide mb-10"
        onClick={handleLaunchDemo}
      >
        Launch Instant Demo
      </Button>

      <ConfirmModal
        isOpen={showDemoPrompt}
        onClose={handleContinue}
        onConfirm={handleStartFresh}
        title="Continue Demo?"
        description="We found existing demo data on your system. Would you like to continue where you left off or start fresh with default data?"
        confirmText="Start Fresh"
        cancelText="Continue with existing data"
        variant="warning"
      />

      {/* Bullet points */}
      <div className="w-full bg-white dark:bg-zinc-900/50 dark:backdrop-blur-sm rounded-xl border border-zinc-200 dark:border-zinc-800/60 p-6 space-y-4 mb-6 text-left shadow-sm">
        {bullets.map((b, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-500/10">
              <b.icon className="w-4 h-4" />
            </div>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-2">
              {b.text}
            </span>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-lg border border-brand-500/10 font-semibold text-xs mb-6">
        <Clock className="w-3.5 h-3.5" />
        <span>Demo data resets when you clear storage.</span>
      </div>

      <Link to="/">
        <Button variant="secondary" className="px-8 py-2.5 text-sm">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
