import { useState, useEffect } from 'react';
import { FiArrowLeft, FiSave, FiRotateCcw, FiChevronDown, FiChevronUp, FiAlertTriangle, FiCornerUpLeft, FiTrash2 } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Dialog from '../components/Dialog';

const defaultStyleInstructions = `My writing style draws from classical storytelling traditions while subverting modern tropes:

INFLUENCES & PREFERENCES:
- Shakespearean devices and structures (including but not limited to):
  • Second act revelations and celebrations (the party principle)
  • Dramatic irony and mistaken identities
  • Parallel plots that mirror and contrast
  • Comedic relief in serious moments
  • The wise fool archetype
  • Soliloquies that reveal inner turmoil
  Draw freely from other classical theatrical and literary devices as well

TONE & APPROACH:
- Hard realism mixed with dramedy
- Dark humor that stems from deep irony
- Character quirks should be threaded throughout rather than concentrated
- Willing to let tension cook in conversation (Tarantino-style)
- Embrace the Coen Brothers' unsentimental worldview and similar approaches:
  • Find humor in human oddity
  • Avoid emotional manipulation
  • Let consequences play out naturally
  • Embrace cosmic irony
  Feel free to draw from other filmmakers who share these sensibilities

STORYTELLING PREFERENCES:
- Subvert expectations without betraying character truth
- Thread character obsessions throughout (subtle callbacks > obvious escalation)
- Balance darkness with droll humor (Wes Anderson influence and similar styles)
- Embrace redemption arcs that don't feel forced
- Let stakes emerge from character rather than plot
- Find universal truth in specific, peculiar details
- Draw from any relevant classical or contemporary storytelling techniques

AVOID:
- Broad comedy or obvious jokes
- Heavy-handed character traits
- Conventional TV episode structures
- Forced sentimentality
- Obvious exposition
- Trendy dialogue patterns
- Any other elements that feel artificial or forced

EMBRACE:
- Classical storytelling devices in modern contexts
- Dark themes explored through humor
- Layered meanings and subtle callbacks
- Character-driven irony
- Dialogue that reveals through subtext
- The absurdity in human nature
- Any other techniques that serve these storytelling goals`;

const defaultSystemInstructions = `Act as a collaborative screenwriting assistant. Your role is to generate specific, concrete story ideas and scenes, not general descriptions or meta-commentary.

CRITICAL: NEVER START WITH THESE:
❌ DO NOT use academic outline formats (I., A., B., etc.)
❌ DO NOT write "Introduction" or "Overview" sections
❌ DO NOT include meta-commentary about adaptations or concepts
❌ DO NOT write about what the story will do
❌ DO NOT explain your approach or methodology

INSTEAD, ALWAYS START WITH SPECIFIC SCENES:
✓ OPENING SCENE:
  • Specific location, time, weather
  • Character actions happening right now
  • Concrete visual details
  • Specific dialogue or sound
  • Mood through tangible details

SCENE DEVELOPMENT:
- Every scene must include:
  • Exact location ("a bedroom" is too vague, "Sarah's cramped studio apartment, walls covered in dead plants" is specific)
  • Precise time ("night" is too vague, "3 AM, during a summer heat wave" is specific)
  • Character actions (not descriptions of what they might do)
  • Real dialogue snippets or exact sounds
  • Specific objects, colors, textures, smells

STORY ELEMENTS:
- Focus only on concrete elements:
  • "Marcus nervously adjusts his fake Rolex" (specific)
  • NOT "Marcus is a materialistic character" (too abstract)
  • "The neon sign flickers, casting red shadows" (specific)
  • NOT "The setting creates an ominous mood" (too abstract)

FEEDBACK STYLE:
- When responding to changes:
  • "Let's have Sarah discover the murder weapon in her mailbox" (specific)
  • NOT "Let's add more tension to this scene" (too abstract)
  • "Change the fight to take place in the rain, with thunder drowning out their words" (specific)
  • NOT "Let's make the scene more dramatic" (too abstract)

TITLE GENERATION GUIDELINES:
- Titles should be iconic and memorable, maximum 3 words (unless it's a known phrase/idiom)
- Prefer:
  • Cultural references (song titles, band names, movie quotes)
  • Idioms and phrases
  • Metaphorical connections
  • Single powerful words
  • Two-word combinations
  • Three-word phrases maximum
  • Known expressions that capture the theme
- Avoid:
  • Literal descriptions
  • Complete sentences
  • More than 3 words (unless it's a known phrase)
  • Generic or obvious titles
  • Technical terms unless very impactful
- Examples of good titles:
  • "Paper Tigers" (for a document about false threats)
  • "Neon Dreams" (for a piece about future cities)
  • "Paint It Black" (for a dark transformation story)
  • "Glass Houses" (for a piece about vulnerability)
  • "Wild Horses" (for something about freedom or untamed spirit)
  • "Through the Looking Glass" (acceptable longer idiom)
  • "Smoke and Mirrors" (familiar phrase that fits theme)

Remember: Titles should be thematically relevant but not too on-the-nose. They should intrigue rather than explain.

EXAMPLE - BAD:
❌ "I. Introduction
    A. Overview of the story
    B. Main themes to explore"

EXAMPLE - GOOD:
✓ "OPENING SCENE - DOWNTOWN TOKYO, 2AM:
- Neon signs reflect in rain puddles outside the 24-hour ramen shop
- Mai (19) counts her tips for the third time, knowing it's not enough
- Through the steamy window, she spots her father stumbling out of the pachinko parlor
- The cook shouts orders in the background: 'Tonkotsu! Extra chashu!'
- She slides her tips into her sock, pulls her hoodie tight"

REMEMBER: Every response should read like a movie scene, not an essay or outline.`;

const defaultTechnicalInstructions = `Technical Integration Instructions:
- Always provide title suggestions with "Title:" prefix
- Ensure titles are properly formatted and don't contain quotes
- Structure outlines with clear hierarchical bullet points
- Maintain outline formatting consistency
- Include specific markers for app features
- Follow API response format requirements
- Handle document state transitions appropriately
- Preserve existing outline structure when updating
- Format feedback messages with appropriate context
- Maintain technical markers for UI updates

WARNING: Editing these instructions may break core app functionality.
Only modify if you understand the technical implications.`;

export default function Settings() {
  const router = useRouter();
  const [styleInstructions, setStyleInstructions] = useState(defaultStyleInstructions);
  const [systemInstructions, setSystemInstructions] = useState(defaultSystemInstructions);
  const [technicalInstructions, setTechnicalInstructions] = useState(defaultTechnicalInstructions);
  const [previousStyleInstructions, setPreviousStyleInstructions] = useState<string | null>(null);
  const [previousSystemInstructions, setPreviousSystemInstructions] = useState<string | null>(null);
  const [previousTechnicalInstructions, setPreviousTechnicalInstructions] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetStyleDialogOpen, setIsResetStyleDialogOpen] = useState(false);
  const [isResetSystemDialogOpen, setIsResetSystemDialogOpen] = useState(false);
  const [isResetTechnicalDialogOpen, setIsResetTechnicalDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  useEffect(() => {
    const savedStyle = localStorage.getItem('styleInstructions');
    const savedSystem = localStorage.getItem('systemInstructions');
    const savedTechnical = localStorage.getItem('technicalInstructions');
    
    if (savedStyle) setStyleInstructions(savedStyle);
    if (savedSystem) setSystemInstructions(savedSystem);
    if (savedTechnical) setTechnicalInstructions(savedTechnical);
  }, []);

  const handleStyleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreviousStyleInstructions(styleInstructions);
    setStyleInstructions(e.target.value);
    setHasChanges(true);
    setSaveMessage('');
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreviousSystemInstructions(systemInstructions);
    setSystemInstructions(e.target.value);
    setHasChanges(true);
    setSaveMessage('');
  };

  const handleTechnicalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreviousTechnicalInstructions(technicalInstructions);
    setTechnicalInstructions(e.target.value);
    setHasChanges(true);
    setSaveMessage('');
  };

  const handleUndoStyle = () => {
    if (previousStyleInstructions !== null) {
      setStyleInstructions(previousStyleInstructions);
      setPreviousStyleInstructions(null);
      setHasChanges(true);
    }
  };

  const handleUndoSystem = () => {
    if (previousSystemInstructions !== null) {
      setSystemInstructions(previousSystemInstructions);
      setPreviousSystemInstructions(null);
      setHasChanges(true);
    }
  };

  const handleUndoTechnical = () => {
    if (previousTechnicalInstructions !== null) {
      setTechnicalInstructions(previousTechnicalInstructions);
      setPreviousTechnicalInstructions(null);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('styleInstructions', styleInstructions);
    localStorage.setItem('systemInstructions', systemInstructions);
    localStorage.setItem('technicalInstructions', technicalInstructions);
    setSaveMessage('Settings saved successfully!');
    setHasChanges(false);
    setTimeout(() => {
      setIsSaving(false);
      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
    }, 500);
  };

  const handleResetStyle = () => {
    setIsResetStyleDialogOpen(true);
  };

  const handleResetSystem = () => {
    setIsResetSystemDialogOpen(true);
  };

  const handleResetTechnical = () => {
    setIsResetTechnicalDialogOpen(true);
  };

  const handleConfirmResetStyle = () => {
    setStyleInstructions(defaultStyleInstructions);
    setHasChanges(true);
    setIsResetStyleDialogOpen(false);
  };

  const handleConfirmResetSystem = () => {
    setSystemInstructions(defaultSystemInstructions);
    setHasChanges(true);
    setIsResetSystemDialogOpen(false);
  };

  const handleConfirmResetTechnical = () => {
    setTechnicalInstructions(defaultTechnicalInstructions);
    setHasChanges(true);
    setIsResetTechnicalDialogOpen(false);
  };

  const handleConfirmLeave = () => {
    router.push('/');
  };

  const handleConfirmReset = () => {
    localStorage.clear();
    setStyleInstructions(defaultStyleInstructions);
    setSystemInstructions(defaultSystemInstructions);
    setTechnicalInstructions(defaultTechnicalInstructions);
    setHasChanges(false);
    setSaveMessage('Application reset successfully!');
    router.push('/');
  };

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
      <div className="fixed top-[20%] left-[50%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
      <div className="fixed top-[60%] left-[20%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="bg-gray-800/40 backdrop-blur-md border-b border-white/5 fixed top-0 left-0 right-0 z-10 shadow-2xl shadow-black/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => {
                if (hasChanges) {
                  setIsLeaveDialogOpen(true);
                } else {
                  router.push('/');
                }
              }}
              className="text-white hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Editor
            </button>
            {saveMessage && (
              <div className="text-green-400 text-sm animate-fade-in">
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 pt-24 pb-6 relative z-0">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800/40 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/20 border border-white/5 overflow-hidden">
            <div className="p-6 space-y-8">
              <h1 className="text-2xl font-semibold text-white mb-6">Settings</h1>
              
              {/* Writing Style Preferences */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl text-white font-medium">Writing Style</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Tell me about your personal writing style and preferences
                  </p>
                </div>
                <textarea
                  value={styleInstructions}
                  onChange={handleStyleChange}
                  className="w-full h-48 p-4 bg-gray-900/50 rounded-xl border border-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-100 text-sm leading-relaxed transition-all placeholder-gray-500"
                  placeholder="Describe your writing style preferences..."
                />
                <div className="flex gap-4 justify-end">
                  {previousStyleInstructions !== null && (
                    <button
                      onClick={handleUndoStyle}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      <FiCornerUpLeft className="w-3 h-3" /> Undo changes
                    </button>
                  )}
                </div>
              </div>

              {/* Core Behavior */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl text-white font-medium">Core Behavior</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Advanced: Configure how the AI assistant approaches writing tasks
                  </p>
                </div>
                <textarea
                  value={systemInstructions}
                  onChange={handleSystemChange}
                  className="w-full h-64 p-4 bg-gray-900/50 rounded-xl border border-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-100 text-sm leading-relaxed transition-all placeholder-gray-500"
                  placeholder="Configure AI assistant behavior..."
                />
                <div className="flex gap-4 justify-end">
                  {previousSystemInstructions !== null && (
                    <button
                      onClick={handleUndoSystem}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      <FiCornerUpLeft className="w-3 h-3" /> Undo changes
                    </button>
                  )}
                </div>
              </div>

              {/* Technical Integration */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl text-white font-medium">Technical Integration</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Advanced: Configure technical integration settings
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <div className="text-sm text-red-200">
                    <strong className="font-medium">Warning:</strong> Editing these instructions may break core app functionality.
                    Only modify if you understand the technical implications. Incorrect changes could cause the app to malfunction.
                  </div>
                </div>
                <textarea
                  value={technicalInstructions}
                  onChange={handleTechnicalChange}
                  className="w-full h-64 p-4 bg-gray-900/50 rounded-xl border border-red-500/20 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50 text-gray-100 text-sm leading-relaxed transition-all placeholder-gray-500"
                  placeholder="Configure technical integration..."
                />
                <div className="flex gap-4 justify-end">
                  {previousTechnicalInstructions !== null && (
                    <button
                      onClick={handleUndoTechnical}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      <FiCornerUpLeft className="w-3 h-3" /> Undo changes
                    </button>
                  )}
                </div>
              </div>

              {/* Project Management */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-red-300 p-3 rounded-lg bg-gray-900/30 hover:bg-red-500/20 transition-all text-sm border border-white/5 hover:border-red-500/30"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Reset Entire Application
                </button>
              </div>

              <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all shadow-lg ${
                    hasChanges
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiSave className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reset Style Dialog */}
      <Dialog
        isOpen={isResetStyleDialogOpen}
        onClose={() => setIsResetStyleDialogOpen(false)}
        onConfirm={handleConfirmResetStyle}
        title="RESET STYLE INSTRUCTIONS"
        type="warning"
        icon="reset"
        message="Are you sure you want to reset the style instructions to their default values? This action cannot be undone."
      />

      {/* Reset System Dialog */}
      <Dialog
        isOpen={isResetSystemDialogOpen}
        onClose={() => setIsResetSystemDialogOpen(false)}
        onConfirm={handleConfirmResetSystem}
        title="RESET SYSTEM INSTRUCTIONS"
        type="warning"
        icon="reset"
        message="Are you sure you want to reset the system instructions to their default values? This action cannot be undone."
      />

      {/* Reset Technical Dialog */}
      <Dialog
        isOpen={isResetTechnicalDialogOpen}
        onClose={() => setIsResetTechnicalDialogOpen(false)}
        onConfirm={handleConfirmResetTechnical}
        title="RESET TECHNICAL INSTRUCTIONS"
        type="warning"
        icon="reset"
        message="Are you sure you want to reset the technical instructions to their default values? This action cannot be undone."
      />

      {/* Leave Without Saving Dialog */}
      <Dialog
        isOpen={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        onConfirm={handleConfirmLeave}
        title="UNSAVED CHANGES"
        type="warning"
        icon="back"
        message="You have unsaved changes. Are you sure you want to leave? All changes will be lost."
      />

      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmReset}
        title="RESET APPLICATION"
        message="This will permanently delete ALL projects, outlines, settings, and history. This action cannot be undone."
        confirmText="RESET ENTIRE APPLICATION"
        type="danger"
        icon="warning"
      />
    </div>
  );
} 