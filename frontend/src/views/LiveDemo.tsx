import { Camera, CheckCircle2, Clock, Users, Receipt, SplitSquareVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function LiveDemo() {
  const features = [
    {
      title: 'Create Groups',
      description: 'Easily organize shared expenses by creating groups for trips, roommates, or events.',
      icon: Users,
    },
    {
      title: 'Upload Receipts',
      description: 'Snap a picture of your receipt and let our smart OCR technology extract items and prices.',
      icon: Receipt,
    },
    {
      title: 'Assign Shares',
      description: 'Split each item exactly as consumed. No more confusing math or unfair splits.',
      icon: SplitSquareVertical,
    },
    {
      title: 'Track Balances',
      description: 'See exactly who owes what in real-time within your group dashboard.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-brand-50 dark:bg-brand-900/20 rounded-full mb-6">
          <Camera className="w-12 h-12 text-brand-500" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Live Demo Coming Soon!
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          We sincerely apologize, but we are currently in the process of recording an interactive live demo video to showcase the full power of FairShare. Please bear with us!
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
          What you'll see in the demo:
        </h2>
        <div className="grid sm:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <feature.icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-full font-medium">
          <Clock className="w-4 h-4" />
          <span>Check back in a few days for the complete video tutorial!</span>
        </div>
        <div>
          <Link to="/">
            <Button variant="secondary" className="px-8 mt-4">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
