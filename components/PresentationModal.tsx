
import React from 'react';
import type { PresentationSlide } from '../types';
import Icon from './Icon';
import useCopyToClipboard from '../hooks/useCopyToClipboard';

interface PresentationModalProps {
    slides: PresentationSlide[];
    onClose: () => void;
}

const Slide: React.FC<{ slide: PresentationSlide; slideNumber: number }> = ({ slide, slideNumber }) => {
    const [isCopied, copy] = useCopyToClipboard();
    const contentToCopy = `${slide.title}\n\n${slide.content.map(point => `- ${point}`).join('\n')}`;
    
    const handleCopy = () => {
        copy(contentToCopy);
    };

    return (
        <div className="bg-brand-bg p-4 rounded-lg border border-brand-muted relative">
            <div className="absolute top-2 right-2">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs bg-brand-muted hover:bg-brand-subtle text-brand-text-muted px-2 py-1 rounded-md transition-colors"
                >
                    {isCopied ? <Icon name="check-circle" className="w-4 h-4 text-green-400" /> : <Icon name="copy" className="w-4 h-4" />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <p className="text-sm text-brand-text-muted mb-2">Slide {slideNumber}</p>
            <h3 className="text-lg font-bold text-brand-cyan mb-3">{slide.title}</h3>
            <ul className="space-y-2 list-disc list-inside">
                {slide.content.map((point, i) => (
                    <li key={i} className="text-brand-text text-sm">{point}</li>
                ))}
            </ul>
        </div>
    );
};

const PresentationModal: React.FC<PresentationModalProps> = ({ slides, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-brand-surface border border-brand-muted rounded-lg p-6 max-w-2xl w-full max-h-[90vh] flex flex-col gap-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Icon name="presentation" className="w-6 h-6 text-brand-magenta" />
                        <h2 className="text-xl font-bold text-brand-text">AI-Generated Presentation Draft</h2>
                    </div>
                    <button onClick={onClose} className="text-2xl text-brand-subtle hover:text-brand-text">&times;</button>
                </div>
                <div className="overflow-y-auto space-y-4 pr-2">
                    {slides.length > 0 ? (
                        slides.map((slide, i) => <Slide key={i} slide={slide} slideNumber={i + 1} />)
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-brand-text-muted">No presentation slides were generated.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PresentationModal;
