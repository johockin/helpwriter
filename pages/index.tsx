import { useState, useEffect, useRef } from 'react';
import { FiSend, FiTrash2, FiDownload, FiCopy, FiBook, FiSettings, FiPlus, FiFolder, FiCornerUpLeft, FiCornerUpRight, FiArrowLeft, FiEdit2, FiEye, FiBold, FiItalic, FiList, FiLink } from 'react-icons/fi';
import { useRouter } from 'next/router';
import ConfirmDialog from './components/ConfirmDialog';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: number;
}

interface Project {
  id: string;
  title: string;
  outline: string;
  chatHistory: ChatMessage[];
  lastModified: number;
  outlineHistory: string[];
  currentHistoryIndex: number;
  customInstructions: string;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [outline, setOutline] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Untitled Document');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(true);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Focus input when project changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentProjectId]);

  // Load projects on mount with better error handling
  useEffect(() => {
    try {
      console.log('Loading projects from localStorage');
      const savedProjects = localStorage.getItem('projects');
      const lastProjectId = localStorage.getItem('currentProjectId');
      
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        console.log('Found projects:', parsedProjects.length);
        
        // Migrate and validate existing projects
        const migratedProjects = parsedProjects.map((project: Project) => ({
          ...project,
          outlineHistory: project.outlineHistory || [project.outline || ''],
          currentHistoryIndex: project.currentHistoryIndex || 0,
          chatHistory: Array.isArray(project.chatHistory) ? project.chatHistory : [],
          customInstructions: project.customInstructions || ''
        }));

        setProjects(migratedProjects);
        
        // Load the last active project or most recent
        if (lastProjectId && migratedProjects.find((p: Project) => p.id === lastProjectId)) {
          console.log('Loading last active project:', lastProjectId);
          const currentProject = migratedProjects.find((p: Project) => p.id === lastProjectId);
          setCurrentProjectId(lastProjectId);
          setTitle(currentProject.title);
          setOutline(currentProject.outline);
          setChatHistory(currentProject.chatHistory);
        } else if (migratedProjects.length > 0) {
          console.log('Loading most recent project');
          const mostRecent = migratedProjects.reduce((prev: Project, current: Project) => 
            (current.lastModified > prev.lastModified) ? current : prev
          );
          setCurrentProjectId(mostRecent.id);
          setTitle(mostRecent.title);
          setOutline(mostRecent.outline);
          setChatHistory(mostRecent.chatHistory);
        } else {
          console.log('No projects found, creating new');
          createNewProject();
        }
      } else {
        console.log('No saved projects, creating new');
        createNewProject();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      createNewProject();
    }
  }, []);

  // Save projects whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      try {
        localStorage.setItem('projects', JSON.stringify(projects));
      } catch (error) {
        console.error('Error saving projects:', error);
      }
    }
  }, [projects]);

  // Save current project ID
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('currentProjectId', currentProjectId);
    }
  }, [currentProjectId]);

  // Update project when outline, title, or chat history changes
  useEffect(() => {
    if (currentProjectId && projects.length > 0) {
      const currentProject = projects.find(p => p.id === currentProjectId);
      if (!currentProject) return;

      // Create a new project object with all updates
      const updatedProject = {
        ...currentProject,
        title,
        outline,
        chatHistory,
        lastModified: Date.now(),
        outlineHistory: currentProject.outlineHistory || [outline],
        currentHistoryIndex: currentProject.currentHistoryIndex || 0
      };

      // Only update if there are actual changes
      if (JSON.stringify(currentProject) !== JSON.stringify(updatedProject)) {
        console.log('Updating project:', { id: currentProjectId, title, chatHistory: chatHistory.length });
        const updatedProjects = projects.map(project => 
          project.id === currentProjectId ? updatedProject : project
        );
        setProjects(updatedProjects);
        
        // Save to localStorage
        try {
          localStorage.setItem('projects', JSON.stringify(updatedProjects));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
    }
  }, [outline, title, chatHistory, currentProjectId]);

  // Track mouse position for proximity effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate distance from mouse to folder icon
  const calculateGlowIntensity = () => {
    if (!isSidebarCollapsed) return 0;
    const threshold = 800; // Increased from 300 to 800 pixels for much larger radius
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - 40, 2) + // 40 is approximate center of folder icon
      Math.pow(mousePosition.y - 40, 2)
    );
    // Using a more gradual falloff curve for smoother long-distance effect
    return Math.pow(Math.max(0, Math.min(1, 1 - (distance / threshold))), 0.7);
  };

  const createNewProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: 'Untitled Document',
      outline: '',
      chatHistory: [],
      lastModified: Date.now(),
      outlineHistory: [''],
      currentHistoryIndex: 0,
      customInstructions: ''
    };
    
    setProjects(prev => {
      const updatedProjects = [...prev, newProject];
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      return updatedProjects;
    });
    
    setCurrentProjectId(newProject.id);
    setTitle(newProject.title);
    setOutline(newProject.outline);
    setChatHistory(newProject.chatHistory);
  };

  const loadProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProjectId(projectId);
      setTitle(project.title);
      setOutline(project.outline);
      setChatHistory(project.chatHistory);
    }
  };

  const deleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsDeleteProjectDialogOpen(true);
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete) return;
    
    setProjects(prev => prev.filter(p => p.id !== projectToDelete));
    if (projectToDelete === currentProjectId) {
      const remaining = projects.filter(p => p.id !== projectToDelete);
      if (remaining.length > 0) {
        const mostRecent = remaining.reduce((prev, current) => 
          (current.lastModified > prev.lastModified) ? current : prev
        );
        setCurrentProjectId(mostRecent.id);
        setTitle(mostRecent.title);
        setOutline(mostRecent.outline);
        setChatHistory(mostRecent.chatHistory);
      } else {
        createNewProject();
      }
    }
    setIsDeleteProjectDialogOpen(false);
    setProjectToDelete(null);
  };

  const generateOutline = async (prompt: string): Promise<{ outline: string; suggestedTitle: string | null }> => {
    try {
      const currentProject = projects.find(p => p.id === currentProjectId);
      console.log('Generating outline with:', {
        prompt,
        currentOutline: outline,
        currentTitle: title,
        hasCustomInstructions: !!currentProject?.customInstructions
      });

      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          currentOutline: outline,
          currentTitle: title,
          styleInstructions: localStorage.getItem('styleInstructions'),
          systemInstructions: localStorage.getItem('systemInstructions'),
          technicalInstructions: localStorage.getItem('technicalInstructions'),
          customInstructions: currentProject?.customInstructions,
          isDocumentRequest: prompt.toLowerCase().includes('outline') || prompt.toLowerCase().includes('document')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          errorData?.error || 
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.outline && !data.chatResponse) {
        throw new Error('Invalid API response format');
      }

      return {
        outline: data.outline || '',
        suggestedTitle: data.suggestedTitle
      };
    } catch (error) {
      console.error('Error in generateOutline:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: input.trim(),
      timestamp: Date.now(),
    };

    try {
      // Add user message immediately
      const newChatHistory = [...chatHistory, userMessage];
      setChatHistory(newChatHistory);
      setInput(''); // Clear input early for better UX

      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: input.trim(),
          currentOutline: outline,
          currentTitle: title,
          styleInstructions: localStorage.getItem('styleInstructions'),
          systemInstructions: localStorage.getItem('systemInstructions'),
          technicalInstructions: localStorage.getItem('technicalInstructions'),
          customInstructions: projects.find(p => p.id === currentProjectId)?.customInstructions,
          isDocumentRequest: input.trim().toLowerCase().includes('outline') || input.trim().toLowerCase().includes('document')
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Create AI response message
      let aiMessage: string;
      
      if (data.chatResponse) {
        // Handle chat response
        aiMessage = data.chatResponse;
      } else if (data.outline) {
        // Handle outline response
        setOutline(data.outline);
        aiMessage = `I've updated the outline based on your feedback.`;
        
        if (data.suggestedTitle && data.suggestedTitle !== title) {
          setTitle(data.suggestedTitle);
          aiMessage += ` I've also updated the title to better reflect the content: "${data.suggestedTitle}"`;
        }
      } else {
        throw new Error('Invalid API response format');
      }

      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: aiMessage,
        timestamp: Date.now(),
      };

      setChatHistory([...newChatHistory, aiChatMessage]);

    } catch (error) {
      console.error('Error in handleSend:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: Date.now(),
      };
      setChatHistory([...chatHistory, userMessage, aiChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear the current project?')) {
      setTitle('Untitled Document');
      setOutline('');
      setChatHistory([]);
    }
  };

  const downloadOutline = () => {
    const element = document.createElement('a');
    const file = new Blob([outline], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outline).then(() => {
      alert('Outline copied to clipboard!');
    });
  };

  const handleOutlineChange = (newOutline: string) => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject) return;

    // Add the new outline to history, removing any future states if we're not at the end
    const newHistory = [
      ...currentProject.outlineHistory.slice(0, currentProject.currentHistoryIndex + 1),
      newOutline
    ];
    
    const updatedProjects = projects.map(project =>
      project.id === currentProjectId
        ? {
            ...project,
            outline: newOutline,
            outlineHistory: newHistory,
            currentHistoryIndex: newHistory.length - 1,
            lastModified: Date.now()
          }
        : project
    );

    setProjects(updatedProjects);
    setOutline(newOutline);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  const canUndo = () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    return currentProject && currentProject.currentHistoryIndex > 0;
  };

  const canRedo = () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    return currentProject && currentProject.currentHistoryIndex < currentProject.outlineHistory.length - 1;
  };

  const handleUndo = () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject || !canUndo()) return;

    const newIndex = currentProject.currentHistoryIndex - 1;
    const newOutline = currentProject.outlineHistory[newIndex];

    const updatedProjects = projects.map(project =>
      project.id === currentProjectId
        ? {
            ...project,
            outline: newOutline,
            currentHistoryIndex: newIndex,
            lastModified: Date.now()
          }
        : project
    );

    setProjects(updatedProjects);
    setOutline(newOutline);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  const handleRedo = () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject || !canRedo()) return;

    const newIndex = currentProject.currentHistoryIndex + 1;
    const newOutline = currentProject.outlineHistory[newIndex];

    const updatedProjects = projects.map(project =>
      project.id === currentProjectId
        ? {
            ...project,
            outline: newOutline,
            currentHistoryIndex: newIndex,
            lastModified: Date.now()
          }
        : project
    );

    setProjects(updatedProjects);
    setOutline(newOutline);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  // Add effect to scroll to bottom when chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-tactical-earth-900 via-tactical-earth-800 to-tactical-earth-900">
      {/* Background Ambient Light Effects - More subtle, cleaner contrast */}
      <div className="fixed inset-0 bg-gradient-to-br from-tactical-olive-500/[0.15] via-transparent to-tactical-sand-400/[0.15] pointer-events-none" />
      <div className="fixed top-[20%] left-[50%] w-[800px] h-[800px] bg-tactical-olive-500/[0.15] rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed top-[60%] left-[20%] w-[600px] h-[600px] bg-tactical-sand-400/[0.15] rounded-full blur-[128px] pointer-events-none" />

      {/* Content Container */}
      <div className="flex flex-col min-h-screen relative z-0">
        {/* App Header */}
        <header className={`bg-tactical-earth-800/95 backdrop-blur-md border-b border-tactical-sand-500/20 fixed top-0 right-0 z-10 shadow-xl shadow-black/20 transition-all ease-in-out duration-700 ${isSidebarCollapsed ? 'left-0' : 'left-72'}`}>
          <div className="relative flex items-center">
            {/* Folder Icon in Header (Only visible when sidebar is collapsed) */}
            {isSidebarCollapsed && (
              <div 
                className="px-4 py-2 cursor-pointer group relative"
                onMouseEnter={() => setIsSidebarCollapsed(false)}
                style={{
                  '--glow-intensity': calculateGlowIntensity(),
                } as React.CSSProperties}
              >
                <div className="absolute inset-[-100px] rounded-[100px] transition-all duration-300"
                     style={{
                       background: `radial-gradient(circle at center, rgba(255, 76, 44, calc(0.15 * var(--glow-intensity))), transparent ${Math.min(150, 50 + calculateGlowIntensity() * 100)}px)`,
                       transform: `scale(${1 + calculateGlowIntensity() * 0.2})`,
                     }}
                />
                <div className="relative">
                  <div className="absolute inset-0 bg-[#ff4c2c]/20 blur-sm rounded-lg transition-all duration-300"
                       style={{
                         opacity: 0.2 + calculateGlowIntensity() * 0.8,
                       }}
                  />
                  <div className="bg-tactical-earth-700/50 p-2.5 rounded-lg border border-tactical-sand-500/10 relative transition-all duration-300"
                       style={{
                         borderColor: `rgba(255, 76, 44, ${0.1 + calculateGlowIntensity() * 0.5})`,
                         boxShadow: `0 0 ${30 + calculateGlowIntensity() * 50}px ${calculateGlowIntensity() * 20}px rgba(255, 76, 44, ${0.1 + calculateGlowIntensity() * 0.2})`,
                       }}
                  >
                    <FiFolder className="w-5 h-5 text-[#ff4c2c] transition-all duration-300"
                             style={{
                               filter: `brightness(${100 + calculateGlowIntensity() * 50}%) drop-shadow(0 0 ${5 + calculateGlowIntensity() * 10}px rgba(255, 76, 44, ${0.3 + calculateGlowIntensity() * 0.7}))`,
                             }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Document Info */}
            <div className="flex-1">
              <div className="px-8 mt-4">
                <div className="flex items-start gap-[5.5rem] text-[10px] font-mono text-tactical-sand-300/60 tracking-wider">
                  <div>⌘ DOC.6664</div>
                  <div>⎋ REV.5</div>
                </div>
              </div>

              {/* Title */}
              <div className="px-8 mt-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  className="w-full text-xl text-tactical-sand-100 bg-transparent border-0 focus:outline-none focus:ring-0 font-mono tracking-wider uppercase"
                  placeholder="DOCUMENT TITLE"
                  style={{
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}
                />
              </div>

              {/* Status Info */}
              <div className="px-8 mt-2 pb-4">
                <div className="flex items-start gap-[5.5rem] text-[10px] font-mono text-tactical-sand-300/60 tracking-wider">
                  <div>⌚ MOD.9:08:14 PM</div>
                  <div style={{ marginLeft: '-0.5rem' }}>⎋ STATUS.OK</div>
                </div>
              </div>

              {/* Settings Button */}
              <div className="absolute top-4 right-8">
                <button
                  onClick={() => router.push('/settings')}
                  className="text-tactical-sand-200 hover:text-tactical-sand-100 flex items-center gap-2"
                >
                  <FiSettings className="w-4 h-4" />
                  <span className="font-mono tracking-wider text-[10px]">SETTINGS</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Projects Sidebar */}
        <div 
          className={`fixed top-0 left-0 h-full bg-tactical-earth-900/95 backdrop-blur-sm border-r border-[#ff4c2c]/20 shadow-lg shadow-black/10 z-20 transition-all ease-in-out duration-700 ${
            isSidebarCollapsed 
              ? 'w-0 opacity-0 pointer-events-none' 
              : 'w-72 opacity-100'
          }`}
          onMouseLeave={() => setIsSidebarCollapsed(true)}
        >
          {/* Add backdrop when sidebar is open */}
          {!isSidebarCollapsed && (
            <div 
              className="fixed inset-0 bg-transparent z-[-1]" 
              onClick={() => setIsSidebarCollapsed(true)}
            />
          )}
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-[#ff4c2c]/20">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#ff4c2c]/20 blur-sm rounded-lg"></div>
                  <div className="bg-tactical-earth-800/50 p-2.5 rounded-lg border border-[#ff4c2c]/30 relative">
                    <FiFolder className="w-5 h-5 text-[#ff4c2c]" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-sm font-medium text-[#ff4c2c] tracking-wide font-mono group-hover/sidebar:text-[#ff4c2c] transition-colors">PROJECTS</h2>
                  <div className="text-xs text-[#ff4c2c]/70 font-mono group-hover/sidebar:text-[#ff4c2c]/90 transition-colors mt-1">{projects.length} Documents</div>
                </div>
              </div>
              {/* Grid Pattern Decoration */}
              <div className="mt-4 border-t border-tactical-sand-500/10 pt-4">
                <div className="grid grid-cols-4 gap-2 text-[8px] font-mono text-tactical-sand-300/60">
                  <div className="flex items-center justify-center">⌘</div>
                  <div className="flex items-center justify-center">◈</div>
                  <div className="flex items-center justify-center">⌥</div>
                  <div className="flex items-center justify-center">⎔</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
              <div className="space-y-5">
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setCurrentProjectId(project.id);
                      setTitle(project.title);
                      setOutline(project.outline);
                      setChatHistory(project.chatHistory);
                    }}
                    className={`group relative ${
                      project.id === currentProjectId
                        ? 'bg-tactical-earth-700/90 text-tactical-sand-100'
                        : 'hover:bg-tactical-earth-700/50 text-tactical-sand-300 hover:text-tactical-sand-100'
                    }`}
                  >
                    {/* Project Card */}
                    <div className="relative rounded-xl border border-[#ff4c2c]/20 overflow-hidden backdrop-blur-sm transition-all duration-300 group-hover:border-[#ff4c2c]/40">
                      {/* Hexagonal Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L15 0 L45 0 L60 30 L45 60 L15 60' fill='none' stroke='%23ff4c2c' stroke-width='1'/%3E%3C/svg%3E")`,
                          backgroundSize: '30px 30px'
                        }}></div>
                      </div>
                      
                      {/* Status Bar */}
                      <div className="h-1 w-full bg-gradient-to-r from-[#ff4c2c]/20 via-[#ff4c2c]/40 to-[#ff4c2c]/20"></div>
                      
                      {/* Main Content */}
                      <div className="p-5 relative">
                        {/* Header with enhanced styling */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-2 h-2 rounded-full bg-[#ff4c2c] shadow-lg shadow-[#ff4c2c]/50 animate-pulse"></div>
                              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#ff4c2c] blur-sm animate-pulse"></div>
                            </div>
                            <div className="text-[10px] font-mono tracking-wider text-[#ff4c2c]/80">DOC.{project.id.slice(-4)}</div>
                          </div>
                          {projects.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(project.id);
                              }}
                              className="text-[#ff4c2c]/60 hover:text-[#ff4c2c] p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Title with enhanced contrast */}
                        <div className="font-medium font-mono tracking-tight leading-relaxed text-base mb-3 text-tactical-sand-100 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#ff4c2c]/5 to-transparent rounded-lg -m-2 p-2"></div>
                          {project.title}
                        </div>

                        {/* Metadata with military-style indicators */}
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#ff4c2c]/60"></div>
                            <div className="text-[10px] font-mono tracking-wider text-tactical-sand-300/60">
                              REV.{project.outlineHistory.length}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#ff4c2c]/60"></div>
                            <div className="text-[10px] font-mono tracking-wider text-tactical-sand-300/60">
                              MSG.{chatHistory.length}
                            </div>
                          </div>
                        </div>

                        {/* Last Modified with enhanced styling */}
                        <div className="pt-3 border-t border-[#ff4c2c]/10">
                          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-[#ff4c2c]/60">
                            <span>⌚</span>
                            <span>MODIFIED {new Date(project.lastModified).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Corner Decorations */}
                        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                          <div className="absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0"></div>
                          <div className="absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0"></div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 overflow-hidden pointer-events-none">
                          <div className="absolute bottom-0 left-0 w-[1px] h-8 bg-gradient-to-t from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0"></div>
                          <div className="absolute bottom-0 left-0 h-[1px] w-8 bg-gradient-to-r from-[#ff4c2c]/0 via-[#ff4c2c]/20 to-[#ff4c2c]/0"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* New Project Button with enhanced styling */}
              <button
                onClick={createNewProject}
                className="w-full mt-6 bg-tactical-earth-800/50 hover:bg-[#ff4c2c]/10 border border-[#ff4c2c]/20 hover:border-[#ff4c2c]/40 rounded-xl p-5 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L15 0 L45 0 L60 30 L45 60 L15 60' fill='none' stroke='%23ff4c2c' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>
                <div className="relative flex items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-[#ff4c2c]/50 group-hover:bg-[#ff4c2c] shadow-lg shadow-[#ff4c2c]/30 transition-all"></div>
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#ff4c2c]/50 group-hover:bg-[#ff4c2c] blur-sm transition-all"></div>
                  </div>
                  <span className="font-medium font-mono tracking-wider text-xs text-[#ff4c2c]/60 group-hover:text-[#ff4c2c]">NEW DOCUMENT</span>
                </div>
              </button>
            </div>

            {/* Bottom Status Bar with enhanced styling */}
            <div className="p-4 border-t border-[#ff4c2c]/10 relative">
              <div className="absolute inset-0 bg-[#ff4c2c]/5"></div>
              <div className="relative grid grid-cols-4 gap-2 text-[10px] font-mono text-[#ff4c2c]/60">
                <div className="flex flex-col items-center">
                  <span>⌘</span>
                  <span className="mt-1">{projects.length}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span>⎔</span>
                  <span className="mt-1">ACTIVE</span>
                </div>
                <div className="flex flex-col items-center">
                  <span>⌥</span>
                  <span className="mt-1">SYNC</span>
                </div>
                <div className="flex flex-col items-center">
                  <span>⎋</span>
                  <span className="mt-1">OK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className={`flex-1 px-8 pt-32 pb-4 relative z-0 transition-all ease-in-out duration-700 ${isSidebarCollapsed ? 'ml-0' : 'ml-72'}`}>
          <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
            {/* Left Panel */}
            <div className="lg:w-1/3 flex flex-col space-y-3">
              {/* Custom Instructions */}
              <div className="bg-tactical-earth-800/95 backdrop-blur-md rounded-xl shadow-xl shadow-black/20 overflow-hidden border border-tactical-sand-500/20">
                <div className="p-3">
                  <textarea
                    value={projects.find(p => p.id === currentProjectId)?.customInstructions || ''}
                    onChange={(e) => {
                      const updatedProjects = projects.map(project =>
                        project.id === currentProjectId
                          ? { ...project, customInstructions: e.target.value, lastModified: Date.now() }
                          : project
                      );
                      setProjects(updatedProjects);
                      localStorage.setItem('projects', JSON.stringify(updatedProjects));
                    }}
                    placeholder="Add custom instructions for this outline..."
                    className="w-full bg-transparent resize-none focus:outline-none focus:ring-0 text-tactical-sand-100 placeholder-tactical-sand-300/50 font-mono text-sm leading-relaxed"
                    rows={2}
                    style={{
                      textShadow: '0 1px 0 rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              </div>

              {/* Chat Panel */}
              <div className="flex-1 bg-tactical-earth-700/95 backdrop-blur-md rounded-xl shadow-xl shadow-black/20 overflow-hidden border border-tactical-sand-500/20">
                <div className="flex items-center justify-between p-4 border-b border-tactical-sand-500/20">
                  <div className="flex items-center gap-4">
                    <div className="bg-tactical-earth-600/90 px-3 py-1.5 rounded-md">
                      <div className="text-[10px] font-mono text-tactical-sand-100 tracking-wider">CHAT.LOG</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-tactical-olive-300 animate-pulse"></div>
                      <div className="text-[10px] font-mono text-tactical-sand-100 tracking-wider">ACTIVE</div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto min-h-[150px] max-h-[calc(100vh-24rem)] p-4 space-y-4 scrollbar-thin scrollbar-thumb-tactical-sand-500/20 scrollbar-track-transparent hover:scrollbar-thumb-tactical-sand-500/30 flex flex-col"
                >
                  {chatHistory.length === 0 ? (
                    <div className="flex items-end justify-start h-full">
                      <div className="text-tactical-sand-300/60 text-xs font-mono p-3">
                        Share your ideas in the chat below.<br/>
                        I'll help you develop your story.
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      {chatHistory.map((chat) => (
                        <div
                          key={chat.id}
                          className={`flex ${chat.sender === 'ai' ? 'justify-start' : 'justify-end'} mb-4`}
                        >
                          <div
                            className={`max-w-[85%] p-4 rounded-xl shadow-lg relative ${
                              chat.sender === 'ai'
                                ? 'bg-tactical-earth-600/95 text-tactical-sand-100 border border-tactical-sand-500/30'
                                : 'bg-tactical-earth-500/95 text-tactical-sand-100 border border-tactical-sand-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-[10px] font-mono tracking-wider opacity-80">
                                {chat.sender === 'ai' ? '⎋ AI.RESPONSE' : '⌘ USER.INPUT'}
                              </div>
                              <div className="text-[10px] font-mono text-tactical-sand-200">
                                {new Date(chat.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="chat-message">{chat.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-tactical-earth-700/90 border-t border-tactical-sand-500/30">
                  <div className="flex gap-3">
                    <textarea
                      ref={inputRef}
                      className="flex-1 p-3 bg-tactical-earth-800/90 border border-tactical-sand-500/30 rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-tactical-sand-500/40 text-tactical-sand-100 text-base transition-all placeholder-tactical-sand-300 font-mono min-h-[40px] max-h-[120px]"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        // Auto-adjust height
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px';
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Share your ideas or give feedback..."
                      rows={2}
                    />
                    <button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className={`px-4 rounded-lg flex items-center justify-center transition-all ${
                        isLoading || !input.trim()
                          ? 'bg-tactical-earth-700/70 text-tactical-sand-500 cursor-not-allowed border border-tactical-sand-500/10'
                          : 'bg-tactical-earth-700/70 text-tactical-sand-100 hover:bg-tactical-olive-500/30 border border-tactical-sand-500/30'
                      }`}
                    >
                      <FiSend className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Document Outline */}
            <div className="lg:w-2/3 flex flex-col bg-tactical-earth-800/95 backdrop-blur-md rounded-xl shadow-xl shadow-black/20 overflow-hidden border border-tactical-sand-500/20">
              <div className="p-5 border-b border-tactical-sand-500/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-tactical-earth-700/90 px-3 py-1.5 rounded-md">
                      <div className="text-[10px] font-mono text-tactical-sand-100 tracking-wider">OUTLINE.MD</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-tactical-olive-300"></div>
                        <div className="text-[10px] font-mono text-tactical-sand-100 tracking-wider">AUTOSAVE</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                        <div className="text-[10px] font-mono text-tactical-sand-100 tracking-wider">REV.{projects.find(p => p.id === currentProjectId)?.outlineHistory.length || 1}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-tactical-sand-200 hover:text-tactical-sand-50 p-2 rounded-lg hover:bg-tactical-sand-500/10 transition-all border border-tactical-sand-500/20"
                    >
                      {isEditing ? <FiEye className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo()}
                      className={`p-2 rounded-lg transition-all border border-tactical-sand-500/20 ${
                        canUndo() ? 'text-tactical-sand-200 hover:text-tactical-sand-50 hover:bg-tactical-sand-500/10' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <FiCornerUpLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo()}
                      className={`p-2 rounded-lg transition-all border border-tactical-sand-500/20 ${
                        canRedo() ? 'text-tactical-sand-200 hover:text-tactical-sand-50 hover:bg-tactical-sand-500/10' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <FiCornerUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="text-tactical-sand-200 hover:text-tactical-sand-50 p-2 rounded-lg hover:bg-tactical-sand-500/10 transition-all border border-tactical-sand-500/20"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadOutline}
                      className="text-tactical-sand-200 hover:text-tactical-sand-50 p-2 rounded-lg hover:bg-tactical-sand-500/10 transition-all border border-tactical-sand-500/20"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6">
                <div className="relative w-full h-full">
                  {isEditing ? (
                    <textarea
                      value={outline}
                      onChange={(e) => handleOutlineChange(e.target.value)}
                      className="w-full h-full resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed bg-tactical-sand-150 text-tactical-olive-900 rounded-lg"
                      style={{
                        fontWeight: 600,
                        paddingLeft: 'calc(50% - 32ch)',
                        paddingRight: 'calc(50% - 32ch)',
                        paddingTop: '4rem',
                        paddingBottom: '2rem',
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full overflow-y-auto bg-tactical-sand-150 rounded-lg prose prose-tactical-olive max-w-none font-mono text-sm leading-relaxed"
                      style={{
                        paddingLeft: 'calc(50% - 32ch)',
                        paddingRight: 'calc(50% - 32ch)',
                        paddingTop: '4rem',
                        paddingBottom: '2rem',
                      }}
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold mb-4 font-mono" />,
                          h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold mb-3 font-mono" />,
                          h3: ({node, ...props}) => <h3 {...props} className="text-lg font-bold mb-2 font-mono" />,
                          p: ({node, ...props}) => <p {...props} className="mb-4 font-mono" />,
                          ul: ({node, ...props}) => <ul {...props} className="list-disc pl-4 mb-4 font-mono" />,
                          ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-4 mb-4 font-mono" />,
                          li: ({node, ...props}) => <li {...props} className="mb-1 font-mono" />,
                          code: ({node, ...props}) => <code {...props} className="bg-tactical-earth-800/20 rounded px-1 py-0.5 font-mono text-tactical-olive-800" />,
                          pre: ({node, ...props}) => <pre {...props} className="bg-tactical-earth-800/20 rounded p-4 mb-4 overflow-x-auto font-mono" />,
                          blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-tactical-olive-500/30 pl-4 italic mb-4 font-mono" />,
                          a: ({node, ...props}) => <a {...props} className="text-tactical-olive-700 underline hover:text-tactical-olive-900 font-mono" />,
                          hr: ({node, ...props}) => <hr {...props} className="border-tactical-olive-500/30 my-8" />,
                        }}
                      >
                        {outline}
                      </ReactMarkdown>
                    </div>
                  )}
                  {outline === '' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-tactical-olive-900/30 font-mono text-sm tracking-wider translate-y-4">
                        ⌘ Ready for your story...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <DeleteConfirmDialog
          isOpen={isDeleteProjectDialogOpen}
          onClose={() => {
            setIsDeleteProjectDialogOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleConfirmDeleteProject}
          projectTitle={projects.find(p => p.id === projectToDelete)?.title || ''}
        />
      </div>
    </div>
  );
} 