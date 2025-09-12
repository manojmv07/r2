
import React, { useState, useRef, useEffect } from 'react';
import { getChatStream } from '../services/geminiService';
import type { ChatMessage } from '../types';
import Icon from './Icon';
import AttachFigureModal from './AttachFigureModal';

interface ChatInterfaceProps {
    documentText: string;
    figures: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ documentText, figures }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [showAttachFigureModal, setShowAttachFigureModal] = useState(false);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: input, image: attachedImage || undefined };
        const newHistory = [...history, newUserMessage];
        setHistory(newHistory);
        setInput('');
        setAttachedImage(null);
        setIsLoading(true);

        try {
            const stream = await getChatStream(history, newUserMessage, documentText);
            
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

    const handleFigureSelect = (imageBase64: string) => {
        setAttachedImage(imageBase64);
        setShowAttachFigureModal(false);
    }

    return (
        <>
            <div className="bg-brand-surface border border-brand-muted rounded-lg shadow-lg flex flex-col h-[85vh] animate-slide-up backdrop-blur-sm">
                <div className="p-4 bg-black/20 border-b border-brand-muted flex items-center space-x-3">
                    <Icon name="chat" className="w-6 h-6 text-brand-cyan" />
                    <h2 className="text-xl font-bold text-brand-text">Interactive Q&A</h2>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-sm xl:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan text-brand-bg' : 'bg-brand-muted text-brand-text'}`}>
                                {msg.image && (
                                    <img src={msg.image} alt="attached figure" className="rounded-md mb-2 max-h-40" />
                                )}
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
                    {attachedImage && (
                        <div className="mb-2 flex items-center gap-2 p-2 bg-brand-bg rounded-lg">
                            <img src={attachedImage} alt="thumbnail" className="w-12 h-12 object-cover rounded" />
                            <p className="text-xs text-brand-text-muted flex-grow">Figure attached. Ask your question.</p>
                            <button onClick={() => setAttachedImage(null)} className="p-1 rounded-full hover:bg-brand-muted">
                                <Icon name="close" className="w-4 h-4 text-brand-subtle" />
                            </button>
                        </div>
                    )}
                    <div className="relative">
                         {figures.length > 0 && (
                             <button onClick={() => setShowAttachFigureModal(true)} className="absolute inset-y-0 left-0 flex items-center pl-3 disabled:opacity-50" disabled={isLoading} title="Attach a figure to your question">
                                <Icon name="attach-image" className="w-5 h-5 text-brand-text-muted hover:text-brand-cyan transition-colors" />
                            </button>
                         )}
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask a question about the paper..."
                            className={`w-full bg-brand-bg border border-brand-muted rounded-lg py-2 pr-12 text-brand-text focus:ring-2 focus:ring-brand-cyan focus:outline-none ${figures.length > 0 ? 'pl-10' : 'pl-4'}`}
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} className="absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50" disabled={isLoading || !input.trim()}>
                            <Icon name="send" className="w-5 h-5 text-brand-text-muted hover:text-brand-cyan transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
            {showAttachFigureModal && (
                <AttachFigureModal 
                    figures={figures}
                    onClose={() => setShowAttachFigureModal(false)}
                    onFigureSelect={handleFigureSelect}
                />
            )}
        </>
    );
};

export default ChatInterface;
