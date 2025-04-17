'use client';

import { useState, useEffect } from "react";
import { X, Share2, Music, Loader, CheckCircle, ExternalLink } from "lucide-react";
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const EXPORT_FORMATS = [
  {
    id: 'spotify',
    name: 'Spotify',
    format: 'MP3',
    specs: '320kbps, 44.1kHz',
    icon: '🎧'
  },
  // Add more platforms as needed
];

export default function PodcastExport({ podcastAudio, conversationId, onClose }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [error, setError] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [needsSpotifyAuth, setNeedsSpotifyAuth] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && searchParams.get('spotify_connected') === 'true') {
      handleExport();
    }
  }, [isClient, searchParams]);

  // Check if we're returning from Spotify auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      // We've returned from Spotify auth
      console.log('Returned from Spotify with auth code');
      handleSpotifyUpload(code);
    }
  }, []);

  const handleSpotifyUpload = async (authCode) => {
    setExporting(true);
    setError(null);

    try {
      // First exchange the code for an access token
      const tokenResponse = await fetch('/api/spotify/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: authCode })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      // Then upload the podcast
      const uploadResponse = await fetch('/api/spotify/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioUrl: podcastAudio,
          title: `AI Podcast ${new Date().toLocaleDateString()}`,
          description: 'Generated with VocalizAI'
        })
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to Spotify');
      }

      setExportStatus('success');
    } catch (error) {
      console.error('Spotify upload error:', error);
      setError(error.message || 'Failed to upload to Spotify');
      setExportStatus('error');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = async () => {
    if (!selectedFormat || !podcastAudio) {
      setError("Please select a format and ensure audio is available");
      return;
    }

    setExporting(true);
    setError(null);

    try {
      if (selectedFormat.id === 'spotify') {
        // Redirect to Spotify auth
        const response = await fetch('/api/spotify/auth', {
          method: 'POST'
        });
        const data = await response.json();
        
        if (data.authUrl) {
          // Save current state before redirect
          localStorage.setItem('spotifyExport', JSON.stringify({
            podcastAudio,
            conversationId
          }));
          // Redirect to Spotify
          window.location.href = data.authUrl;
          return;
        }
      } else if (selectedFormat.id === 'download') {
        // Handle direct download
        const response = await fetch('/api/export-podcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audioUrl: podcastAudio,
            format: selectedFormat.format,
            formatId: selectedFormat.id
          })
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `podcast-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setExportStatus('success');
    } catch (error) {
      console.error('Export failed:', error);
      setError(error.message || 'Export failed');
      setExportStatus('error');
    } finally {
      setExporting(false);
    }
  };

  const handleSpotifyConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback/spotify`;
    const scope = 'playlist-modify-public playlist-modify-private user-read-private user-read-email';
    
    const spotifyAuthUrl = new URL('https://accounts.spotify.com/authorize');
    spotifyAuthUrl.searchParams.append('client_id', clientId);
    spotifyAuthUrl.searchParams.append('response_type', 'code');
    spotifyAuthUrl.searchParams.append('redirect_uri', redirectUri);
    spotifyAuthUrl.searchParams.append('scope', scope);
    spotifyAuthUrl.searchParams.append('show_dialog', 'true');
    
    window.location.href = spotifyAuthUrl.toString();
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-white mb-4">
          Share to Spotify
        </h2>

        {needsSpotifyAuth ? (
          <div className="text-center space-y-4">
            <p className="text-gray-300">Connect your Spotify account to share podcasts</p>
            <button
              onClick={handleSpotifyConnect}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] rounded-lg text-white"
            >
              <Music className="w-5 h-5" />
              Connect Spotify Account
            </button>
          </div>
        ) : (
          <>
            <div
              className="p-4 border border-gray-800 rounded-lg cursor-pointer hover:bg-gray-800/50"
              onClick={() => setSelectedFormat({ id: 'spotify', name: 'Spotify' })}
            >
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-[#1DB954]" />
                <div>
                  <h3 className="font-medium">Spotify</h3>
                  <p className="text-sm text-gray-400">MP3 • 320kbps, 44.1kHz</p>
                </div>
              </div>
            </div>

            {exportStatus === 'success' && shareLink && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Share Link:</span>
                  <a
                    href={shareLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Open <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={!selectedFormat || exporting}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 ${
                !selectedFormat || exporting
                  ? 'bg-gray-800 text-gray-500'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {exporting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : exportStatus === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Shared Successfully!
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Share to Spotify
                </>
              )}
            </button>
          </>
        )}

        {exportStatus === 'error' && (
          <div className="text-red-400 text-sm text-center mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
// Export button component for reuse
export function ExportButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors"
      title="Export podcast"
    >
      <Share2 className="w-4 h-4 text-blue-400 hover:text-blue-300" />
    </button>
  );
} 
