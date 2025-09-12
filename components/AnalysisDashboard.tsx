

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { regenerateSummary } from '../services/geminiService';
import type { AnalysisResult, VerifiablePoint } from '../types';
import { Persona, SummaryLength, TechnicalDepth } from '../types';
import Icon from './Icon';
import ChatInterface from './ChatInterface';
import FigureExplainerModal from './FigureExplainerModal';
import ExportModal from './ExportModal';

interface AnalysisDashboardProps {
    result: AnalysisResult;
    documentText: string;
    fileName: string;
    onReset: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            active
                ? 'border-brand-cyan text-brand-cyan'
                : 'border-transparent text-brand-text-muted hover:text-brand-text'
        }`}
    >
        {children}
    </button>
);

const VerifiablePointDisplay: React.FC<{ item: VerifiablePoint }> = ({ item }) => (
    <li>
        <p>{item.point}</p>
        <blockquote className="mt-1 pl-3 border-l-2 border-brand-subtle text-xs text-brand-text-muted/80 italic">
            "{item.evidence}"
        </blockquote>
    </li>
);

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result, documentText, fileName, onReset }) => {
    const [activeTab, setActiveTab] = useState('takeaways');
    const [summary, setSummary] = useState(result.overallSummary);
    const [isRegenerating, setIsRegenerating] = useState(false);
    
    const [persona, setPersona] = useState<Persona>(Persona.ENGINEER);
    const [length, setLength] = useState<SummaryLength>(SummaryLength.DETAILED);
    const [depth, setDepth] = useState<TechnicalDepth>(TechnicalDepth.MEDIUM);
    
    const [showFigureModal, setShowFigureModal] = useState<string | null>(null); // Holds the image data URL
    const [showExportModal, setShowExportModal] = useState(false);

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const newSummary = await regenerateSummary(documentText, persona, length, depth);
            setSummary(newSummary);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to regenerate summary.');
        }
        setIsRegenerating(false);
    };
    
    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8 animate-fade-in">
                <div className="mb-4 sm:mb-0 text-center sm:text-left max-w-3xl">
                    <h1 className="text-3xl font-bold text-brand-text break-words">{result.title}</h1>
                    <p className="text-brand-text-muted truncate">{fileName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                     <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center space-x-2 bg-brand-muted hover:bg-brand-cyan hover:text-brand-bg text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        title="Export Analysis"
                    >
                        <span>📥 Export</span>
                    </button>
                    <button
                        onClick={onReset}
                        className="flex items-center space-x-2 bg-brand-muted hover:bg-brand-cyan hover:text-brand-bg text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        title="Analyze a New Paper"
                    >
                        <span>📄 New Paper</span>
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col space-y-8">
                    <div className="bg-brand-surface border border-brand-muted rounded-lg backdrop-blur-sm">
                        <div className="flex border-b border-brand-muted px-4 overflow-x-auto">
                            <TabButton active={activeTab === 'takeaways'} onClick={() => setActiveTab('takeaways')}><Icon name="takeaways" className="w-4 h-4" />Key Takeaways</TabButton>
                            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
                            <TabButton active={activeTab === 'critique'} onClick={() => setActiveTab('critique')}>Critique</TabButton>
                            <TabButton active={activeTab === 'novelty'} onClick={() => setActiveTab('novelty')}>Novelty & Future Work</TabButton>
                             {result.images && result.images.length > 0 && (
                                <TabButton active={activeTab === 'figures'} onClick={() => setActiveTab('figures')}>Figures</TabButton>
                            )}
                            <TabButton active={activeTab === 'related'} onClick={() => setActiveTab('related')}>Related Papers</TabButton>
                        </div>
                        <div className="p-6 min-h-[300px]">
                             {activeTab === 'takeaways' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h3 className="font-semibold text-brand-text mb-4">Key Takeaways</h3>
                                        <ul className="list-none space-y-4">
                                            {result.takeaways.map((takeaway, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <Icon name="takeaways" className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-1" />
                                                    <p className="text-brand-text-muted">{takeaway}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="p-4 border border-brand-muted/50 rounded-lg">
                                        <h3 className="font-semibold text-brand-text mb-3">User-Centric Controls</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <select value={persona} onChange={(e) => setPersona(e.target.value as Persona)} className="bg-brand-bg border border-brand-muted rounded-md p-2 w-full focus:ring-1 focus:ring-brand-cyan focus:outline-none">
                                                {Object.entries(Persona).map(([key, value]) => <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>)}
                                            </select>
                                            <select value={length} onChange={(e) => setLength(e.target.value as SummaryLength)} className="bg-brand-bg border border-brand-muted rounded-md p-2 w-full focus:ring-1 focus:ring-brand-cyan focus:outline-none">
                                                {Object.entries(SummaryLength).map(([key, value]) => <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>)}
                                            </select>
                                            <select value={depth} onChange={(e) => setDepth(e.target.value as TechnicalDepth)} className="bg-brand-bg border border-brand-muted rounded-md p-2 w-full focus:ring-1 focus:ring-brand-cyan focus:outline-none">
                                                {Object.entries(TechnicalDepth).map(([key, value]) => <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>)}
                                            </select>
                                        </div>
                                         <button onClick={handleRegenerate} disabled={isRegenerating} className="mt-4 w-full flex justify-center items-center gap-2 bg-brand-cyan/90 hover:bg-brand-cyan text-brand-bg font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isRegenerating ? 'Regenerating...' : 'Regenerate Summary'}
                                            <Icon name="regenerate" className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-brand-text mb-2">Overall Summary:</h3>
                                        <p>{summary}</p>
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-brand-cyan mb-2">Problem Statement</h4>
                                        <p className="text-sm">{result.aspects.problemStatement}</p>
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-brand-cyan mb-2">Methodology</h4>
                                        <p className="text-sm">{result.aspects.methodology}</p>
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-brand-cyan mb-2">Key Findings</h4>
                                        <ul className="list-none space-y-3 text-sm">
                                            {result.aspects.keyFindings.map((kf, i) => <VerifiablePointDisplay key={i} item={kf} />)}
                                        </ul>
                                    </div>
                                </div>
                            )}
                             {activeTab === 'critique' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2"><Icon name="strength" />Strengths</h4>
                                        <ul className="list-none space-y-3 text-sm">
                                            {result.critique.strengths.map((s, i) => <VerifiablePointDisplay key={i} item={s} />)}
                                        </ul>
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2"><Icon name="weakness" />Weaknesses</h4>
                                        <ul className="list-none space-y-3 text-sm">
                                            {result.critique.weaknesses.map((w, i) => <VerifiablePointDisplay key={i} item={w} />)}
                                        </ul>
                                    </div>
                                </div>
                            )}
                             {activeTab === 'novelty' && (
                                 <div className="space-y-6 animate-fade-in">
                                     <div>
                                        <h4 className="font-semibold text-brand-cyan mb-2 flex items-center gap-2"><Icon name="novelty" />Novelty Assessment</h4>
                                        <p className="text-sm">{result.novelty.assessment}</p>
                                        <p className="text-xs text-brand-text-muted/70 mt-2">{result.novelty.comparison}</p>
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-brand-cyan mb-2 flex items-center gap-2"><Icon name="future" />Future Work</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            {result.futureWork.map((fw, i) => <li key={i}>{fw}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'figures' && (
                                <div className="animate-fade-in">
                                    <h3 className="font-semibold text-brand-text mb-4">Extracted Figures</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {result.images.map((imgSrc, i) => (
                                            <div key={i} className="group relative cursor-pointer" onClick={() => setShowFigureModal(imgSrc)}>
                                                <img src={imgSrc} alt={`Figure ${i + 1}`} className="rounded-md border-2 border-brand-muted group-hover:border-brand-cyan transition-colors" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white font-bold">Explain</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                             {activeTab === 'related' && (
                                <div className="animate-fade-in">
                                    <h3 className="font-semibold text-brand-text mb-4">Similar Research Papers</h3>
                                    <div className="space-y-3">
                                        {result.relatedPapers.length > 0 ? result.relatedPapers.map((paper, i) => (
                                            <a href={paper.uri} target="_blank" rel="noopener noreferrer" key={i} className="block p-3 bg-brand-bg/50 hover:bg-brand-muted rounded-md transition-colors group">
                                                <div className="flex items-center space-x-3">
                                                    <Icon name="link" className="w-4 h-4 text-brand-subtle flex-shrink-0" />
                                                    <p className="text-sm text-brand-text-muted group-hover:text-brand-cyan">{paper.title}</p>
                                                </div>
                                            </a>
                                        )) : <p className="text-sm text-brand-text-muted">No related papers found.</p>}
                                    </div>
                                    <p className="text-xs text-brand-subtle mt-4">Powered by Google Search</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <ChatInterface documentText={documentText} />
                </div>
            </main>
            {showFigureModal && (
                <FigureExplainerModal 
                    image={showFigureModal}
                    documentText={documentText}
                    onClose={() => setShowFigureModal(null)}
                />
            )}
             {showExportModal && (
                <ExportModal
                    result={{ ...result, overallSummary: summary }}
                    fileName={fileName}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
};

export default AnalysisDashboard;