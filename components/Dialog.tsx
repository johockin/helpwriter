import { useEffect, useRef, useMemo } from 'react';
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
  operationId?: string;
  disableBackdropClick?: boolean;
  disableEscapeKey?: boolean;
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
  children,
  operationId,
  disableBackdropClick = false,
  disableEscapeKey = false
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Generate a stable operation ID based on title and type
  const generatedOperationId = useMemo(() => {
    const base = `${type.toUpperCase()}_${title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    return operationId || base.substring(0, 12);
  }, [type, title, operationId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (!disableEscapeKey && e.key === 'Escape') onClose();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        confirmButtonRef.current?.click();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, disableEscapeKey]);

  // Focus management
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getColors = () => {
    const colorType = type === 'delete' ? 'danger' : type;
    return {
      primary: `text-tactical-${colorType}-primary`,
      border: `border-tactical-${colorType}-light`,
      bg: `bg-tactical-${colorType}-light`,
      hover: `hover:bg-tactical-${colorType}-medium`,
      text: `text-tactical-${colorType}-primary`,
      gradient: {
        from: `from-tactical-${colorType}-light`,
        via: `via-tactical-${colorType}-medium`,
        to: `to-tactical-${colorType}-light`
      }
    };
  };

  const getIcon = () => {
    switch (icon || type) {
      case 'reset':
        return <FiRotateCcw className="w-5 h-5" />;
      case 'back':
        return <FiArrowLeft className="w-5 h-5" />;
      case 'delete':
        return <FiTrash2 className="w-5 h-5" />;
      default:
        return <FiAlertTriangle className="w-5 h-5" />;
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
        onClick={() => !disableBackdropClick && onClose()}
      />
      
      {/* Modal */}
      <div 
        ref={dialogRef}
        className="relative w-full max-w-lg mx-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`dialog-title-${generatedOperationId}`}
        aria-describedby={message ? `dialog-message-${generatedOperationId}` : undefined}
      >
        <div className={`relative bg-tactical-earth-800/90 rounded-xl ${colors.border} overflow-hidden`}>
          {/* Status Bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${colors.gradient.from} ${colors.gradient.via} ${colors.gradient.to}`} />
          
          {/* Header */}
          <div className={`p-6 border-b ${colors.border}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`absolute inset-0 ${colors.bg} blur-sm rounded-lg`} />
                <div className={`bg-tactical-earth-700/50 p-2.5 rounded-lg ${colors.border} relative`}>
                  <div className={colors.primary}>{getIcon()}</div>
                </div>
              </div>
              <div className="flex flex-col">
                <h2 
                  id={`dialog-title-${generatedOperationId}`}
                  className={`text-sm font-medium ${colors.text} tracking-wide font-mono`}
                >
                  {title}
                </h2>
                <div className={`text-xs ${colors.text}/70 font-mono mt-1`}>
                  OPERATION ID: {generatedOperationId}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {projectTitle && (
                <div className="text-tactical-sand-100 font-mono text-sm">
                  Are you sure you want to delete project:
                  <div className="mt-2 p-3 bg-tactical-earth-700/50 rounded-lg border border-tactical-danger-light">
                    <code className="text-tactical-danger-primary">{projectTitle}</code>
                  </div>
                </div>
              )}
              
              {message && (
                <div 
                  id={`dialog-message-${generatedOperationId}`}
                  className={`${colors.bg} ${colors.border} rounded-lg p-4`}
                >
                  <div className="flex items-start gap-3">
                    <div className={colors.primary}>{getIcon()}</div>
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
                ⌘ + ↵ TO CONFIRM
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-mono text-tactical-sand-300 hover:text-tactical-sand-100 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  ref={confirmButtonRef}
                  onClick={onConfirm}
                  className={`flex items-center gap-2 px-4 py-2 ${colors.bg} ${colors.hover} ${colors.border} rounded-lg text-sm font-mono ${colors.text} transition-all`}
                >
                  <div className={colors.primary}>{getIcon()}</div>
                  {finalConfirmText}
                </button>
              </div>
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className={`absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b ${colors.gradient.from} ${colors.gradient.via} ${colors.gradient.to}`} />
            <div className={`absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l ${colors.gradient.from} ${colors.gradient.via} ${colors.gradient.to}`} />
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className={`absolute bottom-0 left-0 w-[1px] h-8 bg-gradient-to-t ${colors.gradient.from} ${colors.gradient.via} ${colors.gradient.to}`} />
            <div className={`absolute bottom-0 left-0 h-[1px] w-8 bg-gradient-to-r ${colors.gradient.from} ${colors.gradient.via} ${colors.gradient.to}`} />
          </div>
        </div>
      </div>
    </div>
  );
} 