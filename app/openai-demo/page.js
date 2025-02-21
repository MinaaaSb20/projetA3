"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCcw, Search, Paperclip, ArrowUp, Brain, Settings, Menu, X, Edit2, Trash2, Copy, Check, MoreVertical } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function OpenAIDemo() {
  const [prompt, setPrompt] = useState("")
  const [currentChat, setCurrentChat] = useState({ id: Date.now(), messages: [], title: "New Conversation" })
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingTitle, setEditingTitle] = useState(null)
  const [editedContent, setEditedContent] = useState("")
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat.messages])

  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory")
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory))
    }
  }, [])

  const saveChat = (chat) => {
    const updatedHistory = [chat, ...chatHistory.filter((c) => c.id !== chat.id)]
    setChatHistory(updatedHistory)
    localStorage.setItem("chatHistory", JSON.stringify(updatedHistory))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return

    setLoading(true)
    const userMessage = { id: Date.now(), role: "user", content: prompt }
    setCurrentChat((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }))
    setPrompt("")

    try {
      const response = await fetch("/api/openai-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unknown error")
      }

      if (data.completions?.[0]) {
        const aiMessage = { id: Date.now(), role: "assistant", content: data.completions[0] }
        setCurrentChat((prev) => {
          const updatedChat = {
            ...prev,
            messages: [...prev.messages, aiMessage],
          }
          saveChat(updatedChat)
          return updatedChat
        })
      } else {
        throw new Error(data.error || "No completion received")
      }
    } catch (error) {
      console.error("Error:", error)
      setCurrentChat((prev) => ({
        ...prev,
        messages: [...prev.messages, { id: Date.now(), role: "assistant", content: `Error: ${error.message}` }],
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setCurrentChat({ id: Date.now(), messages: [], title: "New Conversation" })
  }

  const loadChat = (chat) => {
    setCurrentChat(chat)
  }

  const deleteChat = (chatId) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory.filter(chat => chat.id !== chatId)))
    if (currentChat.id === chatId) {
      handleNewChat()
    }
  }

  const startEditingTitle = (chat) => {
    setEditingTitle(chat.id)
    setEditedContent(chat.title)
  }

  const saveTitle = (chatId) => {
    const updatedChat = chatHistory.find(c => c.id === chatId) || currentChat
    const newChat = { ...updatedChat, title: editedContent }
    
    if (chatId === currentChat.id) {
      setCurrentChat(newChat)
    }
    
    setChatHistory(prev => prev.map(c => c.id === chatId ? newChat : c))
    localStorage.setItem("chatHistory", JSON.stringify(
      chatHistory.map(c => c.id === chatId ? newChat : c)
    ))
    setEditingTitle(null)
  }

  const startEditingMessage = (messageId, content) => {
    setEditingMessageId(messageId)
    setEditedContent(content)
  }

  const saveEditedMessage = (messageId) => {
    setCurrentChat(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, content: editedContent } : msg
      )
    }))
    setEditingMessageId(null)
    saveChat({
      ...currentChat,
      messages: currentChat.messages.map(msg => 
        msg.id === messageId ? { ...msg, content: editedContent } : msg
      )
    })
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-md"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative w-80 h-full flex flex-col bg-gray-900/95 backdrop-blur-md border-r border-gray-800 transition-all duration-300 z-40",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Vocaliz AI
            </h1>
          </Link>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl w-full transition-colors duration-200"
          >
            <RefreshCcw className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4">
          <h2 className="text-sm font-medium text-gray-400 px-2 mb-3">Recent Conversations</h2>
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="group relative">
                <button
                  onClick={() => loadChat(chat)}
                  className="w-full text-left text-gray-300 hover:bg-gray-800/50 rounded-lg p-3 transition-colors duration-200"
                >
                  {editingTitle === chat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="flex-1 bg-gray-800 rounded px-2 py-1 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && saveTitle(chat.id)}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          saveTitle(chat.id)
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm truncate">{chat.title || "New Conversation"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(chat.id).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </button>
                <div className="absolute right-2 top-3 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingTitle(chat)
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChat(chat.id)
                    }}
                    className="p-1 hover:bg-gray-700 rounded text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <a href="/dashboard" className="p-4 border-t border-gray-800/50">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">My Account</p>
              <p className="text-xs text-gray-400">Settings & preferences</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
        </a>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Welcome to VocalizAI</h2>
              <p className="text-gray-400 mb-8">
              I'm your AI assistant, ready to help you in transforming written content into professional-grade audio.
              podcasts.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                {["Convert blog posts to engaging audio.",
                "Best practices for audio versions of articles.",
                "Enhance scripts for audio delivery.",
                "Create high-quality audio from written content."].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="text-left p-4 rounded-xl border border-gray-800 hover:bg-gray-800/50 transition-all duration-200"
                  >
                    <p className="text-sm">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {currentChat.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "mb-6 flex group",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-6 py-4",
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800/75 backdrop-blur-sm"
                      )}
                    >
                      {editingMessageId === message.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="bg-transparent border rounded p-2 text-sm lg:text-base w-full"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-2 py-1 text-sm rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEditedMessage(message.id)}
                              className="px-2 py-1 text-sm rounded bg-blue-500 hover:bg-blue-600"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm lg:text-base">
                          {message.content}
                        </p>
                      )}
                    </div>
                    <div className={cn(
                      "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                      message.role === "user" ? "left-0 -translate-x-full" : "right-0 translate-x-full"
                    )}>
                      <div className="flex items-center gap-1 px-2">
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="p-1 hover:bg-gray-700 rounded-lg"
                          title="Copy message"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {message.role === "user" && (
                          <button
                            onClick={() => startEditingMessage(message.id, message.content)}
                            className="p-1 hover:bg-gray-700 rounded-lg"
                            title="Edit message"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-gray-800/75 backdrop-blur-sm rounded-2xl border border-gray-700 focus-within:border-blue-500 transition-colors duration-200">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={loading ? "Thinking..." : "Message VocalizAI..."}
                className="flex-1 bg-transparent border-0 outline-none px-6 py-4 text-white placeholder-gray-400"
                disabled={loading}
              />
              <div className="flex items-center gap-2 px-4">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    prompt.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 text-gray-400"
                  )}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
          <p className="text-xs text-gray-500 text-center mt-2">
            AI-generated responses are for reference only
          </p>
        </div>
      </div>
    </div>
  )
}