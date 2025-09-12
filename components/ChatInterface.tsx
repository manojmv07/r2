import React, { useState, useRef, useEffect } from 'react';
import { getChatStream } from '../services/geminiService';
import type { ChatMessage } from '../types';
import Icon from './Icon';

interface ChatInterfaceProps {
    documentText: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ documentText }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: input };
        const newHistory = [...history, newUserMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await getChatStream(history, input, documentText);
            
            let modelResponse = '';
            setHistory(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === 'model') {
                        const updatedHistory = [...prev.slice(0, -1), { ...lastMessage, text: modelResponse }];
                        return updatedHistory;
                    }
                    return prev;
                });
            }

        } catch (error) {
            console.error("Chat error:", error);
            setHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-brand-surface border border-brand-muted rounded-lg shadow-lg flex flex-col h-[85vh] animate-slide-up backdrop-blur-sm">
            <div className="p-4 bg-black/20 border-b border-brand-muted flex items-center space-x-3">
                <Icon name="chat" className="w-6 h-6 text-brand-cyan" />
                <h2 className="text-xl font-bold text-brand-text">Interactive Q&A</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-sm xl:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan text-brand-bg' : 'bg-brand-muted text-brand-text'}`}>
                            <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && history[history.length - 1]?.role === 'user' && (
                     <div className="flex justify-start">
                        <div className="max-w-xs md:max-w-md lg:max-w-sm xl:max-w-md px-4 py-2 rounded-lg bg-brand-muted text-brand-text">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 bg-brand-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-brand-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-brand-text-muted rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-brand-muted">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question about the paper..."
                        className="w-full bg-brand-bg border border-brand-muted rounded-lg py-2 pl-4 pr-12 text-brand-text focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} className="absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50" disabled={isLoading}>
                        <Icon name="send" className="w-5 h-5 text-brand-text-muted hover:text-brand-cyan transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;