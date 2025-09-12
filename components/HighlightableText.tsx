
import React from 'react';
import type { GlossaryTerm } from '../types';

interface HighlightableTextProps {
    text: string;
    glossary?: GlossaryTerm[];
}

const HighlightableText: React.FC<HighlightableTextProps> = ({ text, glossary }) => {
    if (!glossary || glossary.length === 0) {
        return <>{text}</>;
    }

    // Create a regex that matches any of the glossary terms
    // Sort terms by length descending to match longer terms first (e.g., "neural network" before "network")
    const sortedGlossary = [...glossary].sort((a, b) => b.term.length - a.term.length);
    const termsRegex = new RegExp(`\\b(${sortedGlossary.map(g => g.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    const parts = text.split(termsRegex);

    return (
        <>
            {parts.map((part, index) => {
                const termInfo = sortedGlossary.find(g => g.term.toLowerCase() === part.toLowerCase());
                if (termInfo) {
                    return (
                        <span key={index} className="relative group cursor-pointer">
                            <span className="text-brand-cyan border-b border-brand-cyan/50 border-dotted">{part}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-brand-bg border border-brand-subtle rounded-lg shadow-lg text-sm text-brand-text-muted z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <strong className="text-brand-text block">{termInfo.term}</strong>
                                {termInfo.definition}
                            </div>
                        </span>
                    );
                }
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </>
    );
};

export default HighlightableText;
