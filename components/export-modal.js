import { useState } from 'react';
import { Download, Share2, X, Check, Loader2 } from 'lucide-react';

const EXPORT_FORMATS = [
  {
    id: 'mp3-high',
    name: 'MP3 High Quality',
    format: 'mp3',
    quality: '320k',
    platforms: ['Spotify', 'Apple Podcasts'],
    icon: '🎵'
  },
  {
    id: 'mp3-medium',
    name: 'MP3 Standard',
    format: 'mp3',
    quality: '192k',
    platforms: ['Google Podcasts', 'General Use'],
    icon: '🎧'
  },
  {
    id: 'aac',
    name: 'AAC Format',
    format: 'aac',
    quality: '256k',
    platforms: ['Apple Podcasts', 'iTunes'],
    icon: '🍎'
  },
  {
    id: 'youtube',
    name: 'YouTube Audio',
    format: 'mp4',
    quality: '320k',
    platforms: ['YouTube'],
    icon: '▶️'
  }
];

export default function ExportModal({ audioUrl, onClose, podcastTitle, userId, podcastId }) {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    if (!selectedFormat) return;
    
    setExporting(true);
    try {
      let audioData = audioUrl;
      if (audioUrl.startsWith('/api/audio/')) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        audioData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch('/api/export-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: audioData,
          format: selectedFormat.format,
          quality: selectedFormat.quality,
          title: podcastTitle,
          userId: userId || 'anonymous',
          podcastId: podcastId || undefined
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      setShareUrl(data.shareUrl);
      setExportSuccess(true);
      
      if (data.downloadUrl) {
        const downloadLink = document.createElement('a');
        downloadLink.href = data.downloadUrl;
        downloadLink.download = `${podcastTitle}.${selectedFormat.format}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export podcast. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-md w-full shadow-2xl border border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Export Podcast</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format)}
                className={`w-full p-4 rounded-lg border transition-all ${
                  selectedFormat?.id === format.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{format.icon}</span>
                    <div className="text-left">
                      <h3 className="font-medium text-white">{format.name}</h3>
                      <p className="text-sm text-gray-400">
                        Quality: {format.quality}
                      </p>
                    </div>
                  </div>
                  {selectedFormat?.id === format.id && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <button
              onClick={handleExport}
              disabled={!selectedFormat || exporting}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                !selectedFormat || exporting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              }`}
            >
              {exporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export
                </>
              )}
            </button>

            {shareUrl && (
              <button
                onClick={handleShare}
                className="w-full py-3 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Copy Share Link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 