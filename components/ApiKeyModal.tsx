
import React, { useState } from 'react';
import { setApiKey } from '../services/apiKeys';

interface ApiKeyModalProps {
    onKeySubmit: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySubmit }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            setApiKey(key.trim());
            onKeySubmit();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-brand-surface border border-brand-muted rounded-lg p-8 max-w-lg w-full">
                <form onSubmit={handleSubmit}>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-brand-text mb-4">Enter your Gemini API Key</h2>
                        <p className="text-brand-text-muted mb-6">
                            To use Prism, please provide your Google Gemini API key. It will be stored securely in your browser's session storage for this session only.
                        </p>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Enter your API key here"
                            className="w-full bg-brand-bg border border-brand-muted rounded-lg py-2 px-4 text-brand-text focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                            autoFocus
                        />
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-brand-cyan hover:underline mt-2 inline-block"
                        >
                            Get your API key from Google AI Studio
                        </a>
                    </div>
                    <button 
                        type="submit"
                        disabled={!key.trim()}
                        className="mt-6 w-full bg-brand-cyan text-brand-bg font-bold py-2 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        Save and Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyModal;
