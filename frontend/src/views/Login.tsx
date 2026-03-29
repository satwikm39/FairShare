import { Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { isDemoMode } from '../config/demo';

export function Login() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isDemoMode() || currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Failed to log in with Google');
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(error.message || 'Authentication failed');
      }
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
          <p className="text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest leading-relaxed mb-6">
            Professional bill splitting <br /> for modern groups.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 text-left">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5" />}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            required
            disabled={isLoading}
          />
          
          <Button 
            type="submit"
            className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-brand-500/10 border-brand-500/20"
            isLoading={isLoading}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="flex items-center justify-center text-sm font-medium text-zinc-500 mt-4">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="hover:text-brand-600 transition-colors"
            disabled={isLoading}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-4">Or continue with</p>
          <Button 
            type="button"
            variant="outline"
            className="w-full h-14 text-sm font-bold shadow-sm flex items-center justify-center gap-3"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            isLoading={isLoading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Google
          </Button>
        </div>
      </Card>
    </div>
  );
}
