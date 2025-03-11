"use client"

import { useState, useEffect, useRef } from "react"
import {
  RefreshCcw,
  Search,
  Paperclip,
  Settings,
  Menu,
  X,
  Edit2,
  Trash2,
  Copy,
  Check,
  MoreVertical,
  MessageSquare,
  Calendar,
  FileText,
  ChevronRight,
  Mic,
  Send,
  ChevronDown,
  Play,
  Pause,
  Volume2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function OpenAIDemo() {
  const { data: session } = useSession()
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [currentChat, setCurrentChat] = useState({
    _id: null,
    messages: [
      {
        _id: "welcome-message",
        role: "assistant",
        content:
          "👋 Welcome to VocalizAI! Let's create your podcast script. To craft the perfect script for you, I'll need a few details: 📝 Topic: What's your podcast about? (e.g., cryptocurrency trends, mental health) 🎙️ Format: Solo narration, interview style, or storytelling? ⏱️ Length: How long should it be? (5, 15, 30 minutes) 🎭 Tone: Conversational, educational, humorous, or professional? 👥 Audience: Who are you creating this for? ✨ Key points: 2-3 main ideas you want to cover Just share these details, and I'll generate a customized podcast script for you!",
      },
    ],
    title: "New Conversation",
  })
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingTitle, setEditingTitle] = useState(null)
  const [editedContent, setEditedContent] = useState("")
  const messagesEndRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([]) // New state for uploaded file details
  const [showFeatures, setShowFeatures] = useState(false)
  const [editingScript, setEditingScript] = useState(false)
  const [editedScriptContent, setEditedScriptContent] = useState("")
  const [scriptConfirmed, setScriptConfirmed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [showingVoices, setShowingVoices] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [previewAudio, setPreviewAudio] = useState(null)
  const [generatingPodcast, setGeneratingPodcast] = useState(false)
  const [podcastAudio, setPodcastAudio] = useState(null)
  const [message, setMessage] = useState(null)
  const [lastMessage, setLastMessage] = useState(null)
  const [scriptText, setScriptText] = useState("")
  const [generatedScript, setGeneratedScript] = useState("")
  const [podcastId, setPodcastId] = useState(null)
  const [conversationPodcasts, setConversationPodcasts] = useState([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat.messages])

  // Fetch chat history from MongoDB on component mount
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversation")
      if (response.ok) {
        const data = await response.json()
        setChatHistory(data)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/message?conversationId=${conversationId}`)
      if (response.ok) {
        const messages = await response.json()
        return messages
      }
      return []
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      return []
    }
  }

  // Handles the form submission for sending a message to the AI
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return
  
    // Check for session
    if (!session?.user) {
      router.push('/api/auth/signin')
      return
    }
  
    setLoading(true)
    let conversationId = currentChat._id
  
    try {
      // If no conversation exists, create one
      if (!conversationId) {
        const newConversationResponse = await fetch('/api/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: "New Conversation" })
        })
  
        if (!newConversationResponse.ok) {
          throw new Error("Failed to create conversation")
        }
  
        const newConversation = await newConversationResponse.json()
        conversationId = newConversation._id
  
        // Keep the welcome message and add the user's message
        setCurrentChat(prev => ({
          ...prev,
          _id: conversationId,
          messages: [
            ...prev.messages, // This keeps the welcome message
            { role: 'user', content: prompt }
          ]
        }))
      } else {
        // Add user message to existing conversation
        setCurrentChat(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'user', content: prompt }]
        }))
      }
  
      // Save user message to database
      const userMessageResponse = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          role: 'user',
          content: prompt
        })
      })
  
      if (!userMessageResponse.ok) {
        throw new Error("Failed to save user message")
      }
  
      const userMessage = await userMessageResponse.json()
      setPrompt("")
  
      // Send to OpenAI API
      const aiResponse = await fetch("/api/openai-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
  
      const data = await aiResponse.json()
  
      if (!aiResponse.ok) {
        throw new Error(data.error || "Unknown error")
      }
  
      if (data.completions?.[0]) {
        // Save AI message to database
        const aiMessageResponse = await fetch('/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            role: 'assistant',
            content: data.completions[0]
          })
        })
  
        if (!aiMessageResponse.ok) {
          throw new Error("Failed to save AI message")
        }
  
        const aiMessage = await aiMessageResponse.json()
  
        // Update current chat with AI response
        setCurrentChat(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: data.completions[0] }]
        }))
  
        // Update chat title if this is the first message
        if (currentChat.title === "New Conversation") {
          updateChatTitle(conversationId, generateTitle(prompt))
        }
  
        // Refresh conversation list
        fetchConversations()
      }
    } catch (error) {
      console.error("Full error details:", error)
      setCurrentChat(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: "assistant",
          content: `Error: ${error.message}. Please try again or refresh the page.`
        }],
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = async () => {
    try {
      // Create new conversation
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "New Conversation"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const newConversation = await response.json();
      
      // Save welcome message
      const welcomeMessageResponse = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: newConversation._id,
          role: 'assistant',
          content: "👋 Welcome to VocalizAI! Let's create your podcast script. To craft the perfect script for you, I'll need a few details: 📝 Topic: What's your podcast about? (e.g., cryptocurrency trends, mental health) 🎙️ Format: Solo narration, interview style, or storytelling? ⏱️ Length: How long should it be? (5, 15, 30 minutes) 🎭 Tone: Conversational, educational, humorous, or professional? 👥 Audience: Who are you creating this for? ✨ Key points: 2-3 main ideas you want to cover Just share these details, and I'll generate a customized podcast script for you!"
        })
      });

      const welcomeMessage = await welcomeMessageResponse.json();
      
      // Update UI state with conversation and welcome message
      setCurrentChat({
        ...newConversation,
        messages: [welcomeMessage]
      });
      setChatHistory(prev => [newConversation, ...prev]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }

  const loadChat = async (chat) => {
    try {
      // Fetch conversation with podcasts
      const response = await fetch(`/api/conversation/${chat._id}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      
      const data = await response.json();
      
      // Fetch messages
      const messages = await fetchMessages(chat._id);
      
      setCurrentChat({
        ...chat,
        messages,
      });
      
      // Set podcasts if they exist
      if (data.podcasts && data.podcasts.length > 0) {
        setConversationPodcasts(data.podcasts);
        // Set the most recent podcast audio
        setPodcastAudio(data.podcasts[0].audioUrl);
      } else {
        setConversationPodcasts([]);
        setPodcastAudio(null);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  }

  const deleteConversation = async (chatId) => {
    try {
      const response = await fetch(`/api/conversation/${chatId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete conversation")

      setChatHistory((prev) => prev.filter((chat) => chat._id !== chatId))
      if (currentChat._id === chatId) {
        handleNewChat()
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  const startEditingTitle = (chat) => {
    setEditingTitle(chat._id)
    setEditedContent(chat.title)
  }

  const saveTitle = async (chatId) => {
    try {
      const response = await fetch(`/api/conversation/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editedContent }),
      })

      if (!response.ok) throw new Error("Failed to update title")

      setChatHistory((prev) => prev.map((chat) => (chat._id === chatId ? { ...chat, title: editedContent } : chat)))

      if (currentChat._id === chatId) {
        setCurrentChat((prev) => ({ ...prev, title: editedContent }))
      }
    } catch (error) {
      console.error("Error updating title:", error)
    } finally {
      setEditingTitle(null)
      setEditedContent("")
    }
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
  }

  const handleEditScript = (content) => {
    setEditingScript(true)
    setEditedScriptContent(content)
  }

  const handleSaveScript = async () => {
    // Find the last assistant message and update its content
    const updatedMessages = [...currentChat.messages]
    for (let i = updatedMessages.length - 1; i >= 0; i--) {
      if (updatedMessages[i].role === "assistant") {
        // Update the message in the UI
        updatedMessages[i] = {
          ...updatedMessages[i],
          content: editedScriptContent,
        }

        // Also update in the database if the message has an ID
        if (updatedMessages[i]._id && updatedMessages[i]._id !== "welcome-message") {
          const response = await fetch(`/api/message/${updatedMessages[i]._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: editedScriptContent,
            }),
          })

          if (!response.ok) {
            console.error("Error updating message:", await response.json())
            return
          }
        }

        break
      }
    }

    setCurrentChat((prev) => ({
      ...prev,
      messages: updatedMessages,
    }))

    setEditingScript(false)
    setScriptConfirmed(true)
  }

  const handleNextStep = () => {
    setShowingVoices(true)
    setScriptConfirmed(true)
  }

  const formatFileSize = (size) => {
    if (size < 1024) return `${size} bytes`
    else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    else return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  // Function to load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/message?conversationId=${conversationId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const messages = await response.json()
      setCurrentChat((prev) => ({
        ...prev,
        messages,
      }))
    } catch (error) {
      console.error("Error loading messages:", error)
      // Add error handling here
    }
  }

  // Call loadMessages when the component mounts or conversation changes
  useEffect(() => {
    if (currentChat?._id) {
      loadMessages(currentChat._id)
    }
  }, [currentChat?._id])

  const handleTextToSpeech = async (text) => {
    try {
      setIsPlaying(true);
      
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      
      // Convert base64 to audio buffer and play
      const audioData = atob(data.audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Failed to play audio');
      setIsPlaying(false);
    }
  };

  // Add this useEffect to fetch voices when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setVoices(data);
          } else {
            // If we got an error or no voices, try syncing
            await syncVoices();
          }
        } else {
          await syncVoices();
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      }
    };

    loadVoices();
  }, []);

  const syncVoices = async () => {
    try {
      const response = await fetch('/api/sync-voices', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync voices');
      }
      
      const data = await response.json();
      setVoices(data.voices);
    } catch (error) {
      console.error('Error syncing voices:', error);
    }
  };

  const handleVoicePreview = async (voiceId) => {
    if (isPreviewPlaying) {
      previewAudio?.pause()
      setIsPreviewPlaying(false)
      return
    }

    try {
      const response = await fetch('/api/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voiceId,
          text: "Hello, this is a preview of my voice."
        })
      })

      if (!response.ok) throw new Error('Failed to generate preview')

      const data = await response.json()
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)
      
      audio.onended = () => {
        setIsPreviewPlaying(false)
      }

      setPreviewAudio(audio)
      await audio.play()
      setIsPreviewPlaying(true)
    } catch (error) {
      console.error('Error playing preview:', error)
    }
  }

  const handleGeneratePodcast = async () => {
    const lastAssistantMessage = currentChat.messages
      .filter(msg => msg.role === 'assistant')
      .pop();
      
    if (!selectedVoice || !lastAssistantMessage || !currentChat._id) {
      console.error("Missing required data:", { 
        hasVoice: !!selectedVoice, 
        hasMessage: !!lastAssistantMessage,
        hasConversationId: !!currentChat._id
      });
      return;
    }
    
    setGeneratingPodcast(true);
    
    try {
      const payload = {
        voiceId: selectedVoice.voice_id,
        text: lastAssistantMessage.content,
        conversationId: currentChat._id
      };

      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate podcast');
      }
      
      const data = await response.json();
      
      if (!data.audio) {
        throw new Error('No audio data received');
      }
      
      const audioUrl = `data:audio/mpeg;base64,${data.audio}`;
      setPodcastAudio(audioUrl);
      
      // Add the new podcast to the state
      const newPodcast = {
        podcastId: data.podcastId,
        audioUrl,
        createdAt: new Date().toISOString(),
        ...payload
      };
      
      setConversationPodcasts(prev => [newPodcast, ...prev]);
      
    } catch (error) {
      console.error('Error generating podcast:', error);
      alert(`Failed to generate podcast: ${error.message}`);
    } finally {
      setGeneratingPodcast(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative w-80 h-full flex flex-col bg-gray-900/90 backdrop-blur-md border-r border-gray-800/50 transition-all duration-300 ease-in-out z-40",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Vocaliz AI
            </h1>
          </Link>
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl w-full transition-all duration-200 shadow-md shadow-blue-600/20 hover:shadow-blue-600/30"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">New Conversation</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-3">
            <h2 className="text-sm font-medium text-gray-400">Recent Conversations</h2>
            <button className="p-1 hover:bg-gray-800/50 rounded-md">
              <Search className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-1.5">
            {chatHistory.map((chat) => (
              <div key={chat._id} className="group relative">
                <button
                  onClick={() => loadChat(chat)}
                  className={cn(
                    "w-full text-left text-gray-300 hover:bg-gray-800/50 rounded-lg p-3 transition-all duration-200",
                    currentChat._id === chat._id ? "bg-gray-800/70 border-l-2 border-blue-500" : "",
                  )}
                >
                  {editingTitle === chat._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="flex-1 bg-gray-800 rounded px-2 py-1 text-sm border border-gray-700 focus:border-blue-500 outline-none"
                        onKeyPress={(e) => e.key === "Enter" && saveTitle(chat._id)}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          saveTitle(chat._id)
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start">
                        <MessageSquare className="w-4 h-4 mt-0.5 mr-2 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{chat.title}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(chat.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </button>
                <div className="absolute right-2 top-3 hidden group-hover:flex items-center gap-1 bg-gray-800/90 backdrop-blur-sm rounded-md px-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingTitle(chat)
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    aria-label="Edit title"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(chat._id)
                    }}
                    className="p-1 hover:bg-gray-700 rounded text-red-400"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        {/* <div className="px-4 pt-2 pb-4">
          <div className="mb-3">
            <button 
              onClick={() => setShowFeatures(!showFeatures)}
              className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-blue-400" />
                <span>AI Features</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showFeatures ? 'rotate-90' : ''}`} />
            </button>
            
            {showFeatures && (
              <div className="mt-2 space-y-1 pl-2">
                <button className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 rounded-lg transition-colors">
                  <Volume2 className="w-4 h-4 mr-2 text-indigo-400" />
                  <span>Voice Library</span>
                </button>
                <button className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 rounded-lg transition-colors">
                  <FileText className="w-4 h-4 mr-2 text-indigo-400" />
                  <span>Script Templates</span>
                </button>
                <button className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 rounded-lg transition-colors">
                  <Settings className="w-4 h-4 mr-2 text-indigo-400" />
                  <span>Audio Settings</span>
                </button>
              </div>
            )}
          </div>
        </div> */}

        {/* Bottom Section */}
        <a href="/dashboard" className="p-4 border-t border-gray-800/50">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-sm font-bold">P</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">My Account</p>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
        </a>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        {currentChat._id && (
          <div className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="font-medium text-lg">{currentChat.title}</h2>
                <span className="ml-3 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                  {currentChat.messages?.length || 0} messages
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors">
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {currentChat.messages.map((message, index) => (
              <div
                key={message._id || `msg-${index}`}
                className={cn("mb-6 flex group", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className="relative max-w-[85%]">
                  {message.role === "assistant" && index > 0 && (
                    <div className="absolute -left-10 top-2 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Mic className="w-4 h-4" />
                    </div>
                  )}

                  {editingScript && message.role === "assistant" && index === currentChat.messages.length - 1 ? (
                    <div className="bg-gray-800/75 backdrop-blur-sm border border-gray-700/50 rounded-2xl rounded-tl-none p-4">
                      <textarea
                        value={editedScriptContent}
                        onChange={(e) => setEditedScriptContent(e.target.value)}
                        className="w-full h-64 bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end mt-3 gap-2">
                        <button
                          onClick={() => setEditingScript(false)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveScript}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-sm transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "rounded-2xl px-6 py-4 shadow-lg",
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
                            : "bg-gray-800/75 backdrop-blur-sm border border-gray-700/50 rounded-tl-none",
                        )}
                      >
                        <div className="whitespace-pre-wrap text-sm lg:text-base">
                          {message.content.split("\n\n").map((paragraph, i) => {
                            // Check if paragraph contains markdown-style bold text
                            const formattedParagraph = paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

                            return (
                              <p
                                key={i}
                                className={i > 0 ? "mt-4" : ""}
                                dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                              />
                            )
                          })}
                        </div>
                      </div>

                      {message.role === "assistant" && index === currentChat.messages.length - 1 && index > 0 && (
                        <div className="mt-3 flex gap-2 justify-end relative">
                          {/* Only show Edit/Next buttons if we're not showing voices */}
                          {!showingVoices ? (
                            <>
                              <button
                                onClick={() => handleEditScript(message.content)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors flex items-center gap-1"
                                disabled={editingScript}
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={handleNextStep}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-sm transition-colors flex items-center gap-1"
                              >
                                Next
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            // Show voice selection when Next is clicked
                            <div className="w-full">
                              <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Select a voice for your podcast:</label>
                                <div className="relative">
                                  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto">
                                      {voices.length > 0 ? (
                                        voices.map((voice) => (
                                          <div
                                            key={voice.voice_id}
                                            className={`flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer ${selectedVoice?.voice_id === voice.voice_id ? 'bg-gray-700' : ''}`}
                                            onClick={() => setSelectedVoice(voice)}
                                          >
                                            <div>
                                              <div className="text-sm font-medium">{voice.name}</div>
                                              <div className="text-xs text-gray-400">{voice.description || voice.category}</div>
                                            </div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleVoicePreview(voice.voice_id)
                                              }}
                                              className="p-2 hover:bg-gray-600 rounded-lg"
                                            >
                                              {isPreviewPlaying && previewAudio && selectedVoice?.voice_id === voice.voice_id ? (
                                                <Pause className="w-4 h-4" />
                                              ) : (
                                                <Play className="w-4 h-4" />
                                              )}
                                            </button>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-3 text-center text-gray-400">Loading voices...</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {selectedVoice && (
                                  <button
                                    onClick={handleGeneratePodcast}
                                    disabled={generatingPodcast}
                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                                  >
                                    {generatingPodcast ? (
                                      <span className="flex items-center">
                                        <span className="animate-spin mr-2">
                                          <RefreshCcw className="w-4 h-4" />
                                        </span>
                                        Generating...
                                      </span>
                                    ) : (
                                      <>
                                        <Mic className="w-4 h-4" />
                                        Generate Podcast
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              
                              {podcastAudio && (
                                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-lg font-medium mb-2">Your Podcast</h3>
                                  <audio controls className="w-full" src={podcastAudio}></audio>
                                  <div className="mt-2 flex justify-end">
                                    <a 
                                      href={podcastAudio}
                                      download="podcast.mp3"
                                      className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                      Download Audio
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div
                    className={cn(
                      "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                      message.role === "user" ? "left-0 -translate-x-full" : "right-0 translate-x-full",
                    )}
                  >
                    <div className="flex items-center gap-1 px-2">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1.5 hover:bg-gray-800/80 rounded-lg transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start mb-6">
                <div className="bg-gray-800/75 backdrop-blur-sm border border-gray-700/50 rounded-2xl rounded-tl-none px-6 py-4 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1.5">
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-400">VocalizAI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 lg:p-6 bg-gradient-to-t from-gray-900 to-transparent">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              {/* File upload preview */}
              {uploadedFiles.length > 0 && (
                <div className="mb-2 p-3 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-300">Uploaded Files</h3>
                    <button
                      onClick={() => setUploadedFiles([])}
                      className="text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-gray-700/50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-700/30 rounded-lg p-2 text-sm"
                      >
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-400" />
                          <span className="text-gray-300 truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative flex items-center bg-gray-800/75 backdrop-blur-sm rounded-xl border border-gray-700/50 focus-within:border-blue-500 shadow-lg transition-all duration-200">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={loading ? "Thinking..." : "Message VocalizAI..."}
                  className="flex-1 bg-transparent border-0 outline-none px-6 py-4 text-white placeholder-gray-400"
                  disabled={loading}
                />
                <div className="flex items-center gap-2 px-4">
                  <div>
                    <label
                      className="p-2 hover:bg-gray-700/70 rounded-lg transition-colors duration-200 cursor-pointer"
                      title="Attach file"
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.txt,.doc,.docx"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const filesArray = Array.from(e.target.files)
                          setSelectedFile(filesArray)

                          const fileDetails = filesArray.map((file) => ({
                            name: file.name,
                            size: file.size,
                          }))
                          setUploadedFiles(fileDetails)
                        }}
                      />
                      <Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-200 transition-colors" />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      prompt.trim()
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                        : "bg-gray-700 text-gray-400",
                    )}
                    title="Send message"
                  >
                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              AI-generated responses are for reference only • Powered by VocalizAI
            </p>
          </form>
        </div>
      </div>

      {/* Add this before or after your chat messages */}
      {conversationPodcasts.length > 0 && (
        <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-200 mb-2">Generated Podcasts</h3>
          <div className="space-y-2">
            {conversationPodcasts.map((podcast) => (
              <div 
                key={podcast.podcastId || podcast._id} 
                className="flex items-center justify-between bg-gray-700/30 rounded p-2"
              >
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPodcastAudio(podcast.audioUrl)}
                    className={`p-2 rounded-full transition-colors ${
                      podcastAudio === podcast.audioUrl 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'hover:bg-gray-600/50'
                    }`}
                  >
                    {podcastAudio === podcast.audioUrl ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-sm text-gray-300">
                    {new Date(podcast.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio player */}
      {podcastAudio && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <audio
            controls
            src={podcastAudio}
            className="rounded-lg shadow-lg"
            onEnded={() => setPodcastAudio(null)}
          />
        </div>
      )}
    </div>
  )
}

