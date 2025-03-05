import { useState } from 'react';
import { FiMenu, FiX, FiEdit2, FiEye, FiSend, FiBook } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MobileLayoutProps {
  projects: any[];
  currentProjectId: string;
  title: string;
  outline: string;
  chatHistory: any[];
  input: string;
  isLoading: boolean;
  onProjectSelect: (projectId: string) => void;
  onTitleChange: (title: string) => void;
  onOutlineChange: (outline: string) => void;
  onInputChange: (input: string) => void;
  onSend: () => void;
  createNewProject: () => void;
}

export default function MobileLayout({
  projects,
  currentProjectId,
  title,
  outline,
  chatHistory,
  input,
  isLoading,
  onProjectSelect,
  onTitleChange,
  onOutlineChange,
  onInputChange,
  onSend,
  createNewProject
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'outline'>('chat');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-tactical-earth-900 via-tactical-earth-800 to-tactical-earth-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-tactical-earth-800/95 backdrop-blur-md border-b border-tactical-sand-500/20">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsProjectsOpen(true)}
            className="text-tactical-sand-200 hover:text-tactical-sand-100"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.toUpperCase())}
            className="flex-1 mx-4 text-base text-tactical-sand-100 bg-transparent border-0 focus:outline-none focus:ring-0 font-mono tracking-wider uppercase text-center"
            placeholder="DOCUMENT TITLE"
          />
          <div className="w-6" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Projects Sidebar */}
      {isProjectsOpen && (
        <div className="fixed inset-0 z-50 bg-tactical-earth-900/95 backdrop-blur-md">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-tactical-sand-500/20">
              <h2 className="text-tactical-sand-100 font-mono tracking-wider">PROJECTS</h2>
              <button
                onClick={() => setIsProjectsOpen(false)}
                className="text-tactical-sand-200 hover:text-tactical-sand-100"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project.id);
                    setIsProjectsOpen(false);
                  }}
                  className={`mb-4 p-4 rounded-lg border ${
                    project.id === currentProjectId
                      ? 'bg-tactical-earth-700/50 border-tactical-sand-500/40'
                      : 'bg-tactical-earth-800/50 border-tactical-sand-500/20'
                  }`}
                >
                  <div className="font-mono text-tactical-sand-100">{project.title}</div>
                  <div className="text-xs text-tactical-sand-300 mt-2">
                    Last modified: {new Date(project.lastModified).toLocaleDateString()}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  createNewProject();
                  setIsProjectsOpen(false);
                }}
                className="w-full p-4 mt-4 rounded-lg bg-tactical-earth-700/50 border border-tactical-sand-500/20 text-tactical-sand-100 font-mono"
              >
                NEW DOCUMENT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16 pb-20">
        {/* Content Tabs */}
        <div className="flex border-b border-tactical-sand-500/20">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-mono tracking-wider ${
              activeTab === 'chat'
                ? 'text-tactical-sand-100 border-b-2 border-tactical-sand-500'
                : 'text-tactical-sand-300'
            }`}
          >
            CHAT
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`flex-1 py-3 text-sm font-mono tracking-wider ${
              activeTab === 'outline'
                ? 'text-tactical-sand-100 border-b-2 border-tactical-sand-500'
                : 'text-tactical-sand-300'
            }`}
          >
            OUTLINE
          </button>
        </div>

        {/* Chat View */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-8.5rem)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex ${chat.sender === 'ai' ? 'justify-start' : 'justify-end'} mb-4`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-xl ${
                      chat.sender === 'ai'
                        ? 'bg-tactical-earth-600/95 text-tactical-sand-100 border border-tactical-sand-500/30'
                        : 'bg-tactical-earth-500/95 text-tactical-sand-100 border border-tactical-sand-500/40'
                    }`}
                  >
                    <div className="chat-message">{chat.message}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-tactical-earth-700/90 border-t border-tactical-sand-500/20">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder="Share your ideas..."
                  className="flex-1 p-3 bg-tactical-earth-800/90 border border-tactical-sand-500/30 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-tactical-sand-500/40 text-tactical-sand-100 text-base"
                  rows={1}
                />
                <button
                  onClick={onSend}
                  disabled={isLoading || !input.trim()}
                  className={`px-4 rounded-lg flex items-center justify-center ${
                    isLoading || !input.trim()
                      ? 'bg-tactical-earth-700/70 text-tactical-sand-500 cursor-not-allowed'
                      : 'bg-tactical-earth-700/70 text-tactical-sand-100 hover:bg-tactical-olive-500/30'
                  }`}
                >
                  <FiSend className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Outline View */}
        {activeTab === 'outline' && (
          <div className="h-[calc(100vh-8.5rem)]">
            <div className="flex items-center justify-end p-2 bg-tactical-earth-700/90 border-b border-tactical-sand-500/20">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-tactical-sand-200 hover:text-tactical-sand-50 p-2 rounded-lg hover:bg-tactical-sand-500/10"
              >
                {isEditing ? <FiEye className="w-5 h-5" /> : <FiEdit2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="h-[calc(100vh-12rem)] p-4 bg-tactical-sand-150">
              {isEditing ? (
                <textarea
                  value={outline}
                  onChange={(e) => onOutlineChange(e.target.value)}
                  className="w-full h-full resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed bg-transparent text-tactical-olive-900"
                  placeholder="Start your outline here..."
                />
              ) : (
                <div className="h-full overflow-y-auto prose prose-tactical-olive max-w-none font-mono text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {outline || '*Ready for your story...*'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-tactical-earth-800/95 backdrop-blur-md border-t border-tactical-sand-500/20">
        <div className="flex justify-around p-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center ${
              activeTab === 'chat' ? 'text-tactical-sand-100' : 'text-tactical-sand-300'
            }`}
          >
            <FiBook className="w-6 h-6" />
            <span className="text-xs mt-1 font-mono">CHAT</span>
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`flex flex-col items-center ${
              activeTab === 'outline' ? 'text-tactical-sand-100' : 'text-tactical-sand-300'
            }`}
          >
            <FiEdit2 className="w-6 h-6" />
            <span className="text-xs mt-1 font-mono">OUTLINE</span>
          </button>
        </div>
      </nav>
    </div>
  );
} 