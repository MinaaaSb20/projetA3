import React from 'react';

export default function WelcomeMessage() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">👋</span>
        <div>
          <h1 className="text-xl font-semibold text-blue-400">Welcome to VocalizAI!</h1>
          <p className="text-sm text-gray-400">Your AI Podcast Creation Assistant</p>
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-3 text-gray-300 text-sm">
        <p>Let's create your podcast script. I'll need a few details:</p>
        
        <div className="space-y-2 ml-1">
          <p>📝 <span className="text-blue-400">Topic:</span> What's your podcast about? (e.g., cryptocurrency trends, mental health)</p>
          <p>🎙️ <span className="text-blue-400">Format:</span> Solo narration, interview style, or storytelling?</p>
          <p>⏱️ <span className="text-blue-400">Length:</span> How long should it be? (5, 15, 30 minutes)</p>
          <p>👥 <span className="text-blue-400">Audience:</span> Who are you creating this for?</p>
          <p>✨ <span className="text-blue-400">Key points:</span> 2-3 main ideas you want to cover</p>
        </div>

        <p className="text-gray-400 mt-2">Just share these details, and I'll generate a customized podcast script for you!</p>
      </div>
    </div>
  );
}

    
