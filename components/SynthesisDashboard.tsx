
import React from 'react';
import type { SynthesisResult } from '../types';
import Icon from './Icon';

interface SynthesisDashboardProps {
    result: SynthesisResult;
    fileNames: string;
    onReset: () => void;
}

const SynthesisDashboard: React.FC<SynthesisDashboardProps> = ({ result, fileNames, onReset }) => {
    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <div className="mb-4 sm:mb-0 text-center sm:text-left max-w-4xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Icon name="synthesis" className="w-8 h-8 text-brand-cyan" />
                        <h1 className="text-3xl font-bold text-brand-text">
                            Cross-Document Synthesis Report
                        </h1>
                    </div>
                    <p className="text-brand-text-muted text-sm truncate" title={fileNames}>
                        Analysis of: {fileNames}
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center space-x-2 bg-brand-muted hover:bg-brand-cyan hover:text-brand-bg text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    title="Start New Analysis"
                >
                    <Icon name="reset" className="w-5 h-5" />
                    <span>New Analysis</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                <section className="bg-brand-surface border border-brand-muted rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-brand-cyan mb-4">Overall Synthesis</h2>
                    <p className="text-brand-text-muted whitespace-pre-wrap">{result.overallSynthesis}</p>
                </section>

                <section className="bg-brand-surface border border-brand-muted rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-brand-cyan mb-4">Common Themes</h2>
                    <div className="space-y-4">
                        {result.commonThemes.map((item, index) => (
                            <div key={index} className="pb-4 border-b border-brand-muted/50 last:border-b-0">
                                <h3 className="font-semibold text-brand-text mb-2">{item.theme}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-brand-text-muted">Found In:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.papers.map((paper, pIndex) => (
                                            <span key={pIndex} className="text-xs bg-brand-muted px-2 py-1 rounded-full">{paper}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-brand-surface border border-brand-muted rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-brand-magenta mb-4">Conflicting Findings</h2>
                     <div className="space-y-4">
                        {result.conflictingFindings.map((item, index) => (
                            <div key={index} className="pb-4 border-b border-brand-muted/50 last:border-b-0">
                                <h3 className="font-semibold text-brand-text mb-2">{item.finding}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-brand-text-muted">Conflict Between:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.papers.map((paper, pIndex) => (
                                            <span key={pIndex} className="text-xs bg-brand-muted px-2 py-1 rounded-full">{paper}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                 <section className="bg-brand-surface border border-brand-muted rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-brand-cyan mb-4">Concept Evolution</h2>
                    <p className="text-brand-text-muted whitespace-pre-wrap">{result.conceptEvolution}</p>
                </section>
            </main>
        </div>
    );
};

export default SynthesisDashboard;
