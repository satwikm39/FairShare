import { useState } from 'react';
import html2canvas from 'html2canvas';
import { Camera, Send, X, Loader2, AlertCircle } from 'lucide-react';
import { ModalPortal } from '../ui/ModalPortal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const { currentUser } = useAuth();
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const captureScreenshot = async () => {
    setIsCapturing(true);
    setError(null);
    try {
      // Find and hide elements that shouldn't be in the screenshot
      const portal = document.getElementById('modal-portal-root');
      const reportButton = document.getElementById('bug-report-button');
      
      if (portal) portal.style.display = 'none';
      if (reportButton) reportButton.style.display = 'none';

      // Capture!
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 0.5, // Reduce size for storage efficiency
        logging: false, // Silence CORS warnings in console
        ignoreElements: (element) => {
          // Ignore external images that might cause CORS issues (like Google avatars)
          if (element.tagName === 'IMG') {
            const src = (element as HTMLImageElement).src;
            if (src && (src.includes('googleusercontent.com') || src.includes('facebook.com'))) {
              return true;
            }
          }
          return false;
        }
      });

      // Restore elements
      if (portal) portal.style.display = 'flex';
      if (reportButton) reportButton.style.display = 'flex';

      const base64Image = canvas.toDataURL('image/jpeg', 0.7);
      setScreenshot(base64Image);
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      setError('Could not capture screenshot. You can still submit the report.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const metadata = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    try {
      await api.post(`/bug-reports/`, {
        description,
        metadata_json: metadata,
        screenshot_base64: screenshot,
        user_id: currentUser?.id,
        status: 'open'
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state after closing
        setDescription('');
        setScreenshot(null);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit bug report:', err);
      setError(err.response?.data?.detail || 'Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div 
        id="bug-report-modal"
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Report a Bug
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Report Sent!</h3>
              <p className="text-zinc-500">Thank you for helping us improve FairShare.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  What happened?
                </label>
                <textarea
                  autoFocus
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the bug..."
                  className="w-full h-32 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Screenshot</span>
                  {!screenshot && (
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      disabled={isCapturing}
                      className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                    >
                      {isCapturing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                      Capture Page
                    </button>
                  )}
                </div>
                
                {screenshot ? (
                  <div className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video bg-zinc-100 dark:bg-zinc-950">
                    <img src={screenshot} alt="Bug screenshot" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setScreenshot(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={captureScreenshot}
                    className="cursor-pointer border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl aspect-video flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all bg-zinc-50/50 dark:bg-zinc-950/50"
                  >
                    {isCapturing ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">Click to capture current page</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex gap-2 items-start animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex items-stretch gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </ModalPortal>
  );
}
