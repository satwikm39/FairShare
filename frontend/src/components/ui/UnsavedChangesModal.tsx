import { Loader2 } from 'lucide-react';
import { Button } from './Button';
import { ModalPortal } from './ModalPortal';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  isSaving,
  onStay,
  onDiscard,
  onSave,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal className="z-[110] bg-slate-900/50 dark:bg-slate-900/80">
      <div
        className="w-full max-w-md rounded-sharp border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-black animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Unsaved changes</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
          Your bill edits haven&apos;t been saved yet. Save before leaving, or discard changes.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:items-stretch">
          <Button type="button" variant="outline" className="sm:min-w-[7rem]" onClick={onStay} disabled={isSaving}>
            Stay
          </Button>
          <Button type="button" variant="outline" className="sm:min-w-[7rem]" onClick={onDiscard} disabled={isSaving}>
            Discard
          </Button>
          <Button type="button" variant="primary" className="sm:min-w-[7rem] gap-2" onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
    </ModalPortal>
  );
}
