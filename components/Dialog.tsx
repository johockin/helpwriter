import { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiRotateCcw, FiArrowLeft, FiTrash2 } from 'react-icons/fi';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'delete';
  icon?: 'warning' | 'reset' | 'back' | 'delete';
  projectTitle?: string;
  children?: React.ReactNode;
}

export default function Dialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  message,
  confirmText,
  cancelText = 'CANCEL',
  type = 'warning',
  icon,
  projectTitle,
  children
}: DialogProps) {
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

  const getColors = () => {
    switch (type) {
      case 'danger':
      case 'delete':
        return {
          primary: '#ff4c2c',
          border: 'border-[#ff4c2c]/20',
          bg: 'bg-[#ff4c2c]/10',
          hover: 'hover:bg-[#ff4c2c]/20',
          text: 'text-[#ff4c2c]'
        };
      case 'info':
        return {
          primary: '#60a5fa',
          border: 'border-blue-500/20',
          bg: 'bg-blue-500/10',
          hover: 'hover:bg-blue-500/20',
          text: 'text-blue-400'
        };
      default:
        return {
          primary: '#fbbf24',
          border: 'border-amber-500/20',
          bg: 'bg-amber-500/10',
          hover: 'hover:bg-amber-500/20',
          text: 'text-amber-400'
        };
    }
  };

  const getIcon = () => {
    switch (icon || type) {
      case 'reset':
        return <FiRotateCcw className="w-5 h-5" style={{ color: getColors().primary }} />;
      case 'back':
        return <FiArrowLeft className="w-5 h-5" style={{ color: getColors().primary }} />;
      case 'delete':
        return <FiTrash2 className="w-5 h-5" style={{ color: getColors().primary }} />;
      default:
        return <FiAlertTriangle className="w-5 h-5" style={{ color: getColors().primary }} />;
    }
  };

  const colors = getColors();
  const defaultConfirmText = type === 'delete' ? 'CONFIRM DELETE' : 'CONFIRM';
  const finalConfirmText = confirmText || defaultConfirmText;

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
        <div className={`relative bg-tactical-earth-800/90 rounded-xl ${colors.border} overflow-hidden`}>
          {/* Status Bar */}
          <div className={`h-1 w-full bg-gradient-to-r from-[${colors.primary}]/20 via-[${colors.primary}]/40 to-[${colors.primary}]/20`} />
          
          {/* Header */}
          <div className={`p-6 border-b ${colors.border}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`absolute inset-0 ${colors.bg} blur-sm rounded-lg`} />
                <div className={`bg-tactical-earth-700/50 p-2.5 rounded-lg ${colors.border} relative`}>
                  {getIcon()}
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className={`text-sm font-medium ${colors.text} tracking-wide font-mono`}>{title}</h2>
                <div className={`text-xs ${colors.text}/70 font-mono mt-1`}>OPERATION ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {projectTitle && (
                <div className="text-tactical-sand-100 font-mono text-sm">
                  Are you sure you want to delete project:
                  <div className="mt-2 p-3 bg-tactical-earth-700/50 rounded-lg border border-[#ff4c2c]/20">
                    <code className="text-[#ff4c2c]">{projectTitle}</code>
                  </div>
                </div>
              )}
              
              {message && (
                <div className={`${colors.bg} ${colors.border} rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    {getIcon()}
                    <div className="text-sm text-tactical-sand-200">
                      {message}
                    </div>
                  </div>
                </div>
              )}

              {children}
            </div>
          </div>

          {/* Actions */}
          <div className={`p-6 bg-tactical-earth-900/30 border-t ${colors.border}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-[10px] font-mono text-tactical-sand-300/60 tracking-wider">
                ⌘ AWAITING CONFIRMATION
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-mono text-tactical-sand-300 hover:text-tactical-sand-100 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex items-center gap-2 px-4 py-2 ${colors.bg} ${colors.hover} ${colors.border} rounded-lg text-sm font-mono ${colors.text} transition-all`}
                >
                  {getIcon()}
                  {finalConfirmText}
                </button>
              </div>
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className={`absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-[${colors.primary}]/0 via-[${colors.primary}]/20 to-[${colors.primary}]/0`} />
            <div className={`absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-[${colors.primary}]/0 via-[${colors.primary}]/20 to-[${colors.primary}]/0`} />
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className={`absolute bottom-0 left-0 w-[1px] h-8 bg-gradient-to-t from-[${colors.primary}]/0 via-[${colors.primary}]/20 to-[${colors.primary}]/0`} />
            <div className={`absolute bottom-0 left-0 h-[1px] w-8 bg-gradient-to-r from-[${colors.primary}]/0 via-[${colors.primary}]/20 to-[${colors.primary}]/0`} />
          </div>
        </div>
      </div>
    </div>
  );
} 