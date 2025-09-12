import React, { useState, useEffect } from 'react';
import { explainFigure } from '../services/geminiService';
import Icon from './Icon';

interface FigureExplainerModalProps {
    image: string; // base64 data URL
    documentText: string;
    onClose: () => void;
}

const FigureExplainerModal: React.FC<FigureExplainerModalProps> = ({ image, documentText, onClose }) => {
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getExplanation = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await explainFigure(documentText, image);
                setExplanation(result);
            } catch (e: any) {
                setError(e.message || "Failed to get explanation.");
            } finally {
                setIsLoading(false);
            }
        };

        getExplanation();
    }, [image, documentText]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-surface border border-brand-muted rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6" onClick={(e) => e.stopPropagation()}>
                <div className="md:w-1/2 flex-shrink-0">
                     <img src={image} alt="Figure for explanation" className="rounded-md w-full h-full object-contain" />
                </div>
                <div className="md:w-1/2 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-brand-text">Figure Explanation</h2>
                         <button onClick={onClose} className="text-2xl text-brand-subtle hover:text-brand-text">&times;</button>
                    </div>
                    {isLoading && (
                        <div className="flex-grow flex items-center justify-center">
                           <div className="flex items-center space-x-2 text-brand-text-muted">
                                <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                                <span>Analyzing figure...</span>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-400">{error}</p>}
                    {!isLoading && !error && (
                        <div className="text-brand-text-muted space-y-4 text-sm whitespace-pre-wrap">
                           {explanation}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FigureExplainerModal;