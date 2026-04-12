'use client';

import { useState } from 'react';

export default function GenerateButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slateDate: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Generating parlays... results will appear in ~20 seconds.');
        setTimeout(() => window.location.reload(), 20000);
      } else {
        setMessage(`Error: ${data.error || 'Something went wrong'}`);
      }
    } catch {
      setMessage('Network error — please try again');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{
          backgroundColor: isGenerating ? '#00cc6a' : '#00ff87',
          color: '#0a0a0f',
          opacity: isGenerating ? 0.7 : 1,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
        }}
        className="font-bold py-3 px-6 rounded-xl transition-colors"
      >
        {isGenerating ? 'Generating...' : 'Generate Parlays'}
      </button>
      {message && (
        <p className="text-sm text-gray-400 max-w-xs text-right">{message}</p>
      )}
    </div>
  );
}