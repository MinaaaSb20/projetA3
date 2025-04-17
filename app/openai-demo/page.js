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
  Play,
  Pause,
  Volume2,
  Share,
  XCircle,
  Music,
  Clock,
  Download,
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import AudioStudio from "@/components/audio-studio"
import { SessionProvider } from "next-auth/react"
import ExportModal from '@/components/export-modal';


// Utility function for conditional class names
const cn = (...classes) => classes.filter(Boolean).join(" ")

function OpenAIDemoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState("")
  const [currentChat, setCurrentChat] = useState({
    _id: null,
    messages: [
      {
        _id: "welcome-message",
        role: "assistant",
        content:
              `👋 Welcome to VocalizAI!

      Let's create your podcast script. I'll need a few details:

      📝 Topic: What's your podcast about?
      🎙️ Format: Solo narration, interview, or storytelling?
      ⏱️ Length: 5, 15, or 30 minutes?
      👥 Audience: Who is this for?
      ✨ Key points: 2-3 main ideas

      Share these details to get started!`
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
  const [showAudioStudio, setShowAudioStudio] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [persistentPodcasts, setPersistentPodcasts] = useState({})
  const [podcastVersions, setPodcastVersions] = useState([])
  const [currentPodcastId, setCurrentPodcastId] = useState(null)
  const [audioModifications, setAudioModifications] = useState([])
  const [isClient, setIsClient] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportAudioUrl, setExportAudioUrl] = useState(null);
  const chatId = searchParams.get('id');
  const [summaries, setSummaries] = useState([]);
  const [summarizing, setSummarizing] = useState(false);
  const [documentSummaries, setDocumentSummaries] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat.messages])

  // Fetch chat history from MongoDB on component mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // First fetch all conversations
        const response = await fetch("/api/conversation");
        if (response.ok) {
          const data = await response.json();
          setChatHistory(data);

          // Determine which chat to load
          let chatToLoad;
          const newChat = searchParams.get('new');
          
          if (newChat === 'true') {
            await handleNewChat();
            return;
          }

          // If there's a chat ID in the URL, load that chat
          if (chatId) {
            chatToLoad = data.find(chat => chat._id === chatId);
          }

          // If no specific chat found, load most recent
          if (!chatToLoad && data.length > 0) {
            chatToLoad = data[0];
          }

          // If we have a chat to load, fetch its messages and audio content
            if (chatToLoad) {
            // Fetch messages
            const messagesResponse = await fetch(`/api/message?conversationId=${chatToLoad._id}`);
            const messagesData = await messagesResponse.json();

            // Set current chat with messages
            setCurrentChat({
              ...chatToLoad,
              messages: messagesData
            });

            // If user is logged in, fetch podcasts and modifications
            if (session?.user?.id) {
              try {
                // Fetch both podcasts and modifications in parallel
                const [podcastsResponse, audioResponse] = await Promise.all([
                  fetch(`/api/podcasts?userId=${session.user.id}&conversationId=${chatToLoad._id}`),
                  fetch(`/api/audio-modifications?conversationId=${chatToLoad._id}`)
                ]);

                // Handle podcasts
                if (podcastsResponse.ok) {
                  const podcastData = await podcastsResponse.json();
                  if (podcastData.podcasts && podcastData.podcasts.length > 0) {
                    setConversationPodcasts(podcastData.podcasts);
                  }
                }

                // Handle modifications
                if (audioResponse.ok) {
                  const modificationData = await audioResponse.json();
                  if (modificationData.audioModifications) {
                    setAudioModifications(modificationData.audioModifications);
                  }
                }
              } catch (error) {
                console.error('Error fetching audio data:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };

    initializeChat();
  }, [chatId, session?.user?.id]); // Add session?.user?.id to dependencies

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && searchParams.get('showExport') === 'true') {
      setShowExportModal(true)
    }
  }, [isClient, searchParams])

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
  
    // Now session will be defined
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
        body: JSON.stringify({ 
          prompt,
          messages: currentChat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
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
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create conversation")
      }

      const newConversation = await response.json()

      // Save welcome message
      const welcomeMessageResponse = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: newConversation._id,
          role: "assistant",
          content:
          `👋 Welcome to VocalizAI!

Let's create your podcast script. I'll need a few details:

📝 Topic: What's your podcast about?
🎙️ Format: Solo narration, interview, or storytelling?
⏱️ Length: 5, 15, or 30 minutes?
👥 Audience: Who is this for?
✨ Key points: 2-3 main ideas

Share these details to get started!`
            
        }),
      })

      const welcomeMessage = await welcomeMessageResponse.json()

      // Update UI state with conversation and welcome message
      setCurrentChat({
        ...newConversation,
        messages: [welcomeMessage],
      })
      setChatHistory((prev) => [newConversation, ...prev])
    } catch (error) {
      console.error("Error creating new chat:", error)
    }
  }

  const loadChat = async (chat) => {
    console.log('Starting loadChat with:', chat);
    try {
      // Fetch messages and document summaries in parallel
      const [messagesResponse, documentResponse] = await Promise.all([
        fetch(`/api/message?conversationId=${chat._id}`),
        fetch(`/api/document-summaries?conversationId=${chat._id}`)
      ]);

      const messagesData = await messagesResponse.json();
      const documentData = await documentResponse.json();
      
      console.log('Document response:', documentData);

      // Set document summaries
      if (documentData.success) {
        console.log('Setting document summaries for conversation:', chat._id);
        setDocumentSummaries(documentData.documents);
      } else {
        console.log('Failed to get documents:', documentData.error);
      }

      // Set the current chat with messages
      setCurrentChat({
        ...chat,
        messages: messagesData
      });

      // Fetch audio modifications and podcasts if user is logged in
      if (session?.user?.id) {
        try {
          // Fetch both podcasts and modifications in parallel
          const [podcastsResponse, audioResponse] = await Promise.all([
            fetch(`/api/podcasts?userId=${session.user.id}&conversationId=${chat._id}`),
            fetch(`/api/audio-modifications?conversationId=${chat._id}`)
          ]);

      // Handle podcasts
      if (podcastsResponse.ok) {
            const podcastData = await podcastsResponse.json();
            console.log('Fetched podcasts:', podcastData);
            if (podcastData.success && podcastData.podcasts) {
              setConversationPodcasts(podcastData.podcasts);
            }
          }

          // Handle audio modifications
          if (audioResponse.ok) {
            const modificationData = await audioResponse.json();
            console.log('Fetched modifications:', modificationData);
            if (modificationData.audioModifications) {
              setAudioModifications(modificationData.audioModifications);
            }
          }
        } catch (error) {
          console.error('Error fetching audio data:', error);
        }
      }

      router.push(`/openai-demo?id=${chat._id}`, undefined, { shallow: true });
    } catch (error) {
      console.error("Error in loadChat:", error);
    }
  };

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
      setIsPlaying(true)

      const response = await fetch("/api/generate-podcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate audio")
      }

      const data = await response.json()

      // Convert base64 to audio buffer and play
      const audioData = atob(data.audio)
      const audioArray = new Uint8Array(audioData.length)
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i)
      }

      const audioBlob = new Blob([audioArray], { type: "audio/mp3" })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error("Error playing audio:", error)
      alert("Failed to play audio")
      setIsPlaying(false)
    }
  }

  // Add this useEffect to fetch voices when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await fetch("/api/voices")
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setVoices(data)
          } else {
            // If we got an error or no voices, try syncing
            await syncVoices()
          }
        } else {
          await syncVoices()
        }
      } catch (error) {
        console.error("Failed to fetch voices:", error)
      }
    }

    loadVoices()
  }, [])

  const syncVoices = async () => {
    try {
      const response = await fetch("/api/sync-voices", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to sync voices")
      }

      const data = await response.json()
      setVoices(data.voices)
    } catch (error) {
      console.error("Error syncing voices:", error)
    }
  }

  const handleVoicePreview = async (voiceId) => {
    if (isPreviewPlaying) {
      previewAudio?.pause()
      setIsPreviewPlaying(false)
      return
    }

    try {
      const response = await fetch("/api/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          text: "Hello, this is a preview of my voice.",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate preview")

      const data = await response.json()
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)

      audio.onended = () => {
        setIsPreviewPlaying(false)
      }

      setPreviewAudio(audio)
      await audio.play()
      setIsPreviewPlaying(true)
    } catch (error) {
      console.error("Error playing preview:", error)
    }
  }

  const savePodcast = async (podcastData) => {
    try {
      const response = await fetch('/api/podcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(podcastData)
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      return data.podcast;
    } catch (error) {
      console.error('Error saving podcast:', error);
      throw error;
    }
  };

  const fetchPodcasts = async (userId) => {
    try {
      const response = await fetch(`/api/podcasts?userId=${userId}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      return data.podcasts;
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      throw error;
    }
  };

  const handleGeneratePodcast = async () => {
    const lastAssistantMessage = currentChat.messages.filter((msg) => msg.role === "assistant").pop();

    if (!selectedVoice || !lastAssistantMessage || !currentChat._id) {
      console.error("Missing required data:", {
        hasVoice: !!selectedVoice,
        hasMessage: !!lastAssistantMessage,
        hasConversationId: !!currentChat._id,
      });
      return;
    }

    setGeneratingPodcast(true);

    try {
      const payload = {
        voiceId: selectedVoice.voice_id,
        text: lastAssistantMessage.content,
        conversationId: currentChat._id,
      };

      const response = await fetch("/api/generate-podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate podcast");
      }

      const data = await response.json();

      if (!data.audio) {
        throw new Error("No audio data received");
      }

      const audioUrl = `data:audio/wav;base64,${data.audio}`;
      
      // Save the original podcast
      const savedPodcast = await savePodcast({
        userId: session.user.id,
        conversationId: currentChat._id,
        voiceId: selectedVoice.voice_id,
        scriptContent: lastAssistantMessage.content,
        title: currentChat.title || "Untitled Podcast",
        description: `Generated from conversation: ${currentChat.title}`,
        audioUrl: audioUrl,
        status: 'completed'
      });

      // Update the UI with the new podcast
      setConversationPodcasts(prev => {
        // Filter out any previous versions for this conversation
        const otherPodcasts = prev.filter(p => p.conversationId !== currentChat._id);
        return [savedPodcast, ...otherPodcasts];
      });

      setCurrentPodcastId(savedPodcast._id);
      setPodcastAudio(audioUrl);

    } catch (error) {
      console.error("Error generating podcast:", error);
      alert(`Failed to generate podcast: ${error.message}`);
    } finally {
      setGeneratingPodcast(false);
    }
  };

  // Function to generate a title from the prompt
  const generateTitle = (prompt) => {
    // Simple function to extract a title from the prompt
    const words = prompt.split(" ").slice(0, 5).join(" ")
    return words.length > 30 ? words.substring(0, 30) + "..." : words + "..."
  }

  // Function to update chat title
  const updateChatTitle = async (chatId, title) => {
    try {
      const response = await fetch(`/api/conversation/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) throw new Error("Failed to update title")

      setCurrentChat((prev) => ({ ...prev, title }))
      setChatHistory((prev) => prev.map((chat) => (chat._id === chatId ? { ...chat, title } : chat)))
    } catch (error) {
      console.error("Error updating title:", error)
    }
  }

  const toggleAudioStudio = () => {
    if (showAudioStudio) {
      // Don't reset podcast versions when closing the studio
      setShowAudioStudio(false);
    } else {
      setShowAudioStudio(true);
    }
  }

  const handleAudioUpdate = async (modifiedAudio, effects, backgroundSound) => {
    try {
      // Save the modification
      const response = await fetch('/api/audio-modifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          conversationId: currentChat._id,
          originalPodcastId: currentPodcastId,
          audioUrl: modifiedAudio,
          effects,
          backgroundSound,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save audio modification');
      }

      const data = await response.json();
      
      // Update the modifications list
      setAudioModifications(prev => [data.audioModification, ...prev]);
      
      // Close the audio studio
      setShowAudioStudio(false);
    } catch (error) {
      console.error('Error updating audio:', error);
    }
  };

  // Add this useEffect to fetch modifications when conversation changes
  useEffect(() => {
    if (currentChat._id) {
      fetchAudioModifications();
    } else {
      setAudioModifications([]); // Clear modifications when no conversation is selected
    }
  }, [currentChat._id]);

  // Add this function to fetch modifications
  const fetchAudioModifications = async () => {
    try {
      if (!currentChat._id) return; // Add this check
      
      const response = await fetch(`/api/audio-modifications?conversationId=${currentChat._id}`);
      if (response.ok) {
        const data = await response.json();
        setAudioModifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch audio modifications:', error);
    }
  };

  // Add this function after your existing functions
  const handleFileUpload = async (files) => {
    try {
      setSummarizing(true);
      
      for (const file of files) {
        // Create upload message
        const uploadMessage = {
          role: 'system',
          content: `Uploading file: ${file.name}...`,
          conversationId: currentChat._id
        };

        // Add to current chat and save to DB
        const updatedMessages = [...currentChat.messages, uploadMessage];
        setCurrentChat(prev => ({
          ...prev,
          messages: updatedMessages
        }));

        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        
        const { url } = await uploadResponse.json();

        // Get summary
        const summaryResponse = await fetch('/api/summarize-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentUrl: url,
            fileName: file.name,
            conversationId: currentChat._id
          })
        });

        if (!summaryResponse.ok) {
          throw new Error('Failed to summarize document');
        }

        const { summary, documentSummary } = await summaryResponse.json();

        // Create file and summary messages
        const fileMessage = {
          role: 'system',
          content: `📄 File uploaded: ${file.name}`,
          fileUrl: url,
          conversationId: currentChat._id
        };

        const summaryMessage = {
          role: 'assistant',
          content: `Here's a summary of ${file.name}:\n\n${summary}`,
          conversationId: currentChat._id
        };

        // Save messages to database
        await fetch('/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [fileMessage, summaryMessage],
            conversationId: currentChat._id
          })
        });

        // Update local state
        setCurrentChat(prev => ({
          ...prev,
          messages: [...prev.messages, fileMessage, summaryMessage]
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        conversationId: currentChat._id
      };

      // Save error message to database
      await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [errorMessage],
          conversationId: currentChat._id
        })
      });

      setCurrentChat(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setSummarizing(false);
    }
  };

  // Modify your existing file input handler
  const handleFileInputChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setSelectedFile(filesArray);
    
    const fileDetails = filesArray.map((file) => ({
      name: file.name,
      size: file.size,
    }));
    setUploadedFiles(fileDetails);
    
    // Call the summarization function
    handleFileUpload(filesArray);
  };

  const handlePlayPodcast = async (audioUrl) => {
    try {
      if (isPlaying) {
        // Stop current audio
        setIsPlaying(false);
        // Add logic to stop current audio
      } else {
        setIsPlaying(true);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handlePlayModification = async (audioUrl) => {
    // Similar to handlePlayPodcast
    await handlePlayPodcast(audioUrl);
  };

  const handleDownload = async (audioUrl) => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'podcast.mp3'; // You can customize the filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Hamburger menu button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={cn("fixed left-4 top-4 p-2 hover:bg-gray-800/80 rounded-lg transition-all duration-200 z-30",
          isSidebarOpen && "hidden"
        )}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:sticky top-0 left-0 w-80 h-full flex flex-col bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 transition-all duration-500 ease-in-out z-40 shadow-2xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 relative">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute right-4 top-4 p-2 hover:bg-gray-800/80 rounded-lg transition-all duration-200"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          </button>

          <Link href="/" className="flex items-center gap-3 mb-8 group hover:scale-[0.98] transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all duration-300">
              <Mic className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Vocaliz AI
            </h1>
          </Link>

          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-4 py-3.5 rounded-xl w-full transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-[0.98] group"
          >
            <MessageSquare className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium">New Conversation</span>
          </button>
        </div>

        {/* Chat History - Enhanced */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-4">
            <h2 className="text-sm font-medium text-gray-300">Recent Conversations</h2>
            
          </div>

          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <div key={chat._id} className="group relative">
                <button
                  onClick={() => {
                    console.log('Chat clicked:', chat);
                    loadChat(chat);
                  }}
                  className={cn(
                    "w-full text-left text-gray-300 rounded-xl p-3 transition-all duration-300",
                    currentChat._id === chat._id
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-2 border-blue-500 shadow-lg"
                      : "hover:bg-gray-800/50",
                  )}
                >
                  {editingTitle === chat._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="flex-1 bg-gray-800/90 rounded-lg px-3 py-1.5 text-sm border border-gray-700 focus:border-blue-500 outline-none transition-all duration-200"
                        onKeyPress={(e) => e.key === "Enter" && saveTitle(chat._id)}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          saveTitle(chat._id)
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-white transition-colors">
                          {chat.title}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(chat.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </button>

                {/* Action buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-gray-800/95 backdrop-blur-sm rounded-lg px-1 py-1 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingTitle(chat)
                    }}
                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                    aria-label="Edit title"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(chat._id)
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all duration-200 group"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all duration-200" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - Enhanced */}
        <a
          href="/dashboard"
          className="p-4 border-t border-gray-800/50 group hover:bg-gray-800/30 transition-all duration-300"
        >
          <div className="flex items-center gap-4 p-3 rounded-xl group-hover:scale-[0.98] transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
              <span className="text-sm font-bold group-hover:scale-110 transition-transform duration-300">P</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-200">My Account</p>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
          </div>
        </a>
      </div>

      {/* Main Content - Updated with responsive margins */}
      <div className={cn(
        "flex-1 flex flex-col relative transition-all duration-500 ease-in-out",
        isSidebarOpen ? "lg:ml-0" : "lg:ml-0"
      )}>
        {/* Chat Header - Updated */}
        {currentChat._id && (
          <div className={cn(
            "border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30 p-4 transition-all duration-500",
            isSidebarOpen ? "lg:ml-0" : "lg:ml-0"
          )}>
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="font-medium text-lg">{currentChat.title}</h2>
                <span className="ml-3 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                  {currentChat.messages?.length || 0} messages
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Messages Container - Updated */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar transition-all duration-500",
          isSidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
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
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">Select a voice for your podcast:</label>
                                  {/* Close button for voices dropdown */}
                                  <button
                                    onClick={() => setShowingVoices(false)}
                                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label="Close voice selection"
                                  >
                                    <XCircle className="w-4 h-4 text-gray-400 hover:text-white" />
                                  </button>
                                </div>
                                <div className="relative">
                                  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto">
                                      {voices.length > 0 ? (
                                        voices.map((voice) => (
                                          <div
                                            key={voice.voice_id}
                                            className={`flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer ${selectedVoice?.voice_id === voice.voice_id ? "bg-gray-700" : ""}`}
                                            onClick={() => setSelectedVoice(voice)}
                                          >
                                            <div>
                                              <div className="text-sm font-medium">{voice.name}</div>
                                              <div className="text-xs text-gray-400">
                                                {voice.description || voice.category}
                                              </div>
                                            </div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleVoicePreview(voice.voice_id)
                                              }}
                                              className="p-2 hover:bg-gray-600 rounded-lg"
                                            >
                                              {isPreviewPlaying &&
                                              previewAudio &&
                                              selectedVoice?.voice_id === voice.voice_id ? (
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
            
            {/* Document Summaries Section */}
            <div className="space-y-4 mb-8">
              {console.log('Current conversation ID:', currentChat._id)}
              {console.log('All document summaries:', documentSummaries)}
              
              {/* Filter summaries for current conversation */}
              {documentSummaries
                .filter(doc => {
                  console.log('Checking document:', doc, 'against conversation:', currentChat._id);
                  return doc.conversationId === currentChat._id;
                })
                .map((doc) => (
                  <div 
                    key={doc._id}
                    className="bg-gray-800/50 rounded-xl p-4 mb-4 hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-gray-200">
                          {doc.fileName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {doc.summary && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-gray-400 mb-1">Summary</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {doc.summary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            
            {/* Audio Content Section */}
            <div className="space-y-6 mb-8">
              {console.log('Current chat:', currentChat)}
              {console.log('Conversation podcasts:', conversationPodcasts)}
              
              {/* Original Podcasts */}
              {conversationPodcasts
                .filter(podcast => {
                  console.log('Checking podcast:', podcast);
                  return podcast.conversationId === currentChat._id;
                })
                .map((podcast) => (
                  <div key={podcast._id} className="group transform transition-all duration-300 hover:scale-[1.01]">
                    <div className="max-w-[85%] bg-gradient-to-r from-gray-800/75 to-gray-900/75 backdrop-blur-sm border border-gray-700/50 rounded-2xl rounded-tl-none px-6 py-4 shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              <h4 className="text-sm font-medium text-gray-200">{currentChat.title || 'Original Version'}</h4>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Created • {new Date(podcast.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setExportAudioUrl(podcast.audioUrl);
                                setShowExportModal(true);
                              }}
                              className="p-2 hover:bg-blue-500/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Export audio"
                            >
                              <Share className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentPodcastId(podcast._id);
                                setPodcastAudio(podcast.audioUrl);
                                toggleAudioStudio();
                              }}
                              className="p-2 hover:bg-blue-500/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Open in Audio Studio"
                            >
                              <Music className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-900/50 rounded-xl p-3 group-hover:bg-gray-900/70 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <Volume2 className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <audio
                              controls
                              key={podcast._id}
                              src={podcast.audioUrl}
                              className="w-full h-[36px] accent-blue-500"
                              preload="metadata"
                              onError={(e) => {
                                console.error('Audio playback error:', e.target.error);
                                console.error('Failed URL:', podcast.audioUrl);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Modified Versions */}
              {audioModifications
                .filter(mod => mod.conversationId === currentChat._id)
                .map((modification) => (
                  <div key={modification._id} className="group transform transition-all duration-300 hover:scale-[1.01] ml-8">
                    <div className="max-w-[85%] bg-gradient-to-r from-gray-800/75 to-gray-900/75 backdrop-blur-sm border border-gray-700/50 rounded-2xl rounded-tl-none px-6 py-4 shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                              <h4 className="text-sm font-medium text-gray-200">{currentChat.title || 'Modified Version'}</h4>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Modified • {new Date(modification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setExportAudioUrl(modification.audioUrl);
                                setShowExportModal(true);
                              }}
                              className="p-2 hover:bg-purple-500/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Export audio"
                            >
                              <Share className="w-4 h-4 text-purple-400 hover:text-purple-300" />
                            </button>
                            <button
                              onClick={() => {
                                setPodcastAudio(modification.audioUrl);
                                toggleAudioStudio();
                              }}
                              className="p-2 hover:bg-purple-500/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Open in Audio Studio"
                            >
                              <Music className="w-4 h-4 text-purple-400 hover:text-purple-300" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-900/50 rounded-xl p-3 group-hover:bg-gray-900/70 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Volume2 className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <audio
                              controls
                              key={modification._id}
                              src={modification.audioUrl}
                              className="w-full h-[36px] accent-purple-500"
                              preload="metadata"
                              onError={(e) => {
                                console.error('Audio playback error:', e.target.error);
                                console.error('Failed URL:', modification.audioUrl);
                                console.error('Modification details:', modification);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
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

        {/* Input Container - Updated */}
        <div className={cn(
          "p-4 lg:p-6 bg-gradient-to-t from-gray-900 to-transparent transition-all duration-500",
          isSidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              {/* File upload preview */}
              {uploadedFiles.length > 0 && (
                <div className="mb-2 p-3 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-300">
                      {summarizing ? 'Summarizing Documents...' : 'Uploaded Files'}
                    </h3>
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
                          <span className="text-gray-300 truncate max-w-[200px]">
                            {file.name}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {formatFileSize(file.size)}
                        </span>
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
                      title="Attach file for summarization"
                    >
                      <input
                        type="file"
                        accept=".txt,.pdf,.doc,.docx"
                        multiple
                        className="hidden"
                        onChange={handleFileInputChange}
                        disabled={summarizing}
                      />
                      <div className="relative">
                        <Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-200 transition-colors" />
                        {summarizing && (
                          <div className="absolute -top-1 -right-1 w-3 h-3">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                          </div>
                        )}
                      </div>
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

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}


        {/* Sound Design Studio Modal */}
        {showAudioStudio && podcastAudio && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm z-50">
            <div className="w-full max-w-4xl">
              <AudioStudio 
                podcastAudio={podcastAudio} 
                onClose={toggleAudioStudio}
                onAudioUpdate={handleAudioUpdate}
                originalPodcastId={currentPodcastId}
                conversationId={currentChat._id}
              />
            </div>
          </div>
        )}

        {showExportModal && (
          <ExportModal
            audioUrl={exportAudioUrl || podcastAudio}
            onClose={() => {
              setShowExportModal(false);
              setExportAudioUrl(null);
            }}
            podcastTitle={currentChat.title}
            userId={session?.user?.id}
            podcastId={currentPodcastId}
          />
        )}

    </div>
  )
}

export default function OpenAIDemo() {
  return (
    <SessionProvider>
      <OpenAIDemoContent />
    </SessionProvider>
  );
}

