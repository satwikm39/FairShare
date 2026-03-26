import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { signInWithGoogle } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export function Login() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      alert('Failed to log in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500">
      <Card className="max-w-md w-full space-y-8 p-10 text-center shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black rounded-sharp">
        <div>
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-sharp bg-brand-50 dark:bg-brand-900/20 mb-8 border border-brand-500/10">
            <LogIn className="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase mb-4">
            FairShare
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
            Professional bill splitting <br /> for modern groups.
          </p>
        </div>
        
        <div className="mt-8">
          <Button 
            className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-brand-500/10 border-brand-500/20"
            onClick={handleLogin}
            isLoading={isLoading}
          >
            Connect with Google
          </Button>
        </div>
      </Card>
    </div>
  );
}
