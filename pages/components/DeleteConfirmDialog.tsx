import { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
}

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, projectTitle }: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-tactical-earth-900/95 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={dialogRef}
        className="relative w-full max-w-lg mx-4 animate-fade-in"
      >
        <div className="relative bg-tactical-earth-800/90 rounded-xl border border-[#ff4c2c]/20 overflow-hidden">
          {/* Status Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#ff4c2c]/20 via-[#ff4c2c]/40 to-[#ff4c2c]/20" />
          
          {/* Header */}
          <div className="p-6 border-b border-[#ff4c2c]/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#ff4c2c]/20 blur-sm rounded-lg" />
                <div className="bg-tactical-earth-700/50 p-2.5 rounded-lg border border-[#ff4c2c]/30 relative">
                  <FiAlertTriangle className="w-5 h-5 text-[#ff4c2c]" />
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-[#ff4c2c] tracking-wide font-mono">CONFIRM DELETE</h2>
                <div className="text-xs text-[#ff4c2c]/70 font-mono mt-1">OPERATION ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-tactical-sand-100 font-mono text-sm">
                Are you sure you want to delete project:
                <div className="mt-2 p-3 bg-tactical-earth-700/50 rounded-lg border border-[#ff4c2c]/20">
                  <code className="text-[#ff4c2c]">{projectTitle}</code>
                </div>
              </div>
              
              <div className="bg-[#ff4c2c]/10 border border-[#ff4c2c]/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-[#ff4c2c] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-tactical-sand-200">
                    This action cannot be undone. The project and all its contents will be permanently deleted.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-tactical-earth-900/30 border-t border-[#ff4c2c]/20">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[10px] font-mono text-tactical-sand-300/60 tracking-wider">
                ⌘ AWAITING CONFIRMATION
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-mono text-tactical-sand-300 hover:text-tactical-sand-100 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={onConfirm}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ff4c2c]/10 hover:bg-[#ff4c2c]/20 border border-[#ff4c2c]/30 rounded-lg text-sm font-mono text-[#ff4c2c] transition-all"
                >
                  <FiTrash2 className="w-4 h-4" />
                  CONFIRM DELETE
                </button>
              </div>
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0" />
            <div className="absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0" />
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 left-0 w-[1px] h-8 bg-gradient-to-t from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0" />
            <div className="absolute bottom-0 left-0 h-[1px] w-8 bg-gradient-to-r from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0" />
          </div>
        </div>
      </div>
    </div>
  );
} 