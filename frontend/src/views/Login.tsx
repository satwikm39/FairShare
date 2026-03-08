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
      <Card className="max-w-md w-full space-y-8 p-10 text-center shadow-2xl border-brand-100">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-100 mb-6">
            <LogIn className="h-8 w-8 text-brand-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to FairShare
          </h2>
          <p className="mt-3 text-lg text-slate-500 font-medium">
            Sign in to start splitting bills easily with your groups.
          </p>
        </div>
        
        <div className="mt-8">
          <Button 
            className="w-full h-12 text-lg shadow-brand-500/20"
            onClick={handleLogin}
            isLoading={isLoading}
          >
            Sign in with Google
          </Button>
        </div>
      </Card>
    </div>
  );
}
