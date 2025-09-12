
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { regenerateSummary } from '../services/geminiService';
import type { AnalysisResult, VerifiablePoint, Reference } from '../types';
import { Persona, SummaryLength, TechnicalDepth } from '../types';
import Icon from './Icon';
import ChatInterface from './ChatInterface';
import FigureExplainerModal from './FigureExplainerModal';
import ExportModal from './ExportModal';
import HighlightableText from './HighlightableText';
import useCopyToClipboard from '../hooks/useCopyToClipboard';

interface AnalysisDashboardProps {
    result: Partial<AnalysisResult>;
    documentText: string;
    fileName: string;
    onReset: () => void;
    onGeneratePresentation: () => void;
    isGeneratingPresentation: boolean;
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

const VerifiablePointDisplay: React.FC<{ item: VerifiablePoint, glossary: AnalysisResult['glossary'] }> = ({ item, glossary }) => (
    <li>
        <HighlightableText text={item.point} glossary={glossary} />
        <blockquote className="mt-1 pl-3 border-l-2 border-brand-subtle text-xs text-brand-text-muted/80 italic">
            <HighlightableText text={`"${item.evidence}"`} glossary={glossary} />
        </blockquote>
    </li>
);

const SkeletonParagraph: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div className="space-y-2 animate-pulse">
        {Array.from({ length: lines }).map((_, i) => (
             <div key={i} className="h-4 bg-brand-muted rounded" style={{ width: `${100 - i*10}%`}}></div>
        ))}
    </div>
);

const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <ul className="space-y-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
            <li key={i} className="space-y-2">
                <div className="h-4 bg-brand-muted rounded w-full"></div>
                <div className="h-3 bg-brand-subtle rounded w-5/6 ml-3"></div>
            </li>
        ))}
    </ul>
);

const ReferencesDisplay: React.FC<{ references: Reference }> = ({ references }) => {
    const [format, setFormat] = useState<'apa' | 'bibtex'>('apa');
    const [isCopied, copy] = useCopyToClipboard();
    const content = format === 'apa' ? references.apa.join('\n\n') : references.bibtex.join('\n\n');

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 p-1 bg-brand-bg rounded-lg border border-brand-muted">
                    <button onClick={() => setFormat('apa')} className={`px-3 py-1 text-sm rounded-md ${format === 'apa' ? 'bg-brand-muted text-brand-text' : 'text-brand-text-muted'}`}>APA</button>
                    <button onClick={() => setFormat('bibtex')} className={`px-3 py-1 text-sm rounded-md ${format === 'bibtex' ? 'bg-brand-muted text-brand-text' : 'text-brand-text-muted'}`}>BibTeX</button>
                </div>
                <button onClick={() => copy(content)} className="flex items-center gap-2 text-sm bg-brand-muted hover:bg-brand-subtle px-3 py-2 rounded-lg transition-colors">
                    {isCopied ? <Icon name="check-circle" className="w-4 h-4 text-green-400" /> : <Icon name="copy" className="w-4 h-4" />}
                    {isCopied ? 'Copied!' : 'Copy All'}
                </button>
            </div>
            <pre className="text-xs bg-brand-bg p-4 rounded-lg whitespace-pre-wrap max-h-[400px] overflow-y-auto font-mono">{content}</pre>
        </div>
    );
};


const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result, documentText, fileName, onReset, onGeneratePresentation, isGeneratingPresentation }) => {
    const [activeTab, setActiveTab] = useState('takeaways');
    const [summary, setSummary] = useState(result.overallSummary || '');
    const [isRegenerating, setIsRegenerating] = useState(false);
    
    useEffect(() => {
        if (result.overallSummary) {
            setSummary(result.overallSummary);
        }
    }, [result.overallSummary]);

    const [persona, setPersona] = useState<Persona>(Persona.ENGINEER);
    const [length, setLength] = useState<SummaryLength>(SummaryLength.DETAILED);
    const [depth, setDepth] = useState<TechnicalDepth>(TechnicalDepth.MEDIUM);
    
    const [showFigureModal, setShowFigureModal] = useState<string | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const newSummary = await regenerateSummary(documentText, persona, length, depth);
            setSummary(newSummary);
            toast.success("Summary regenerated!");
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Failed to regenerate summary.');
        }
        setIsRegenerating(false);
    };
    
    const isExportDisabled = !result.title || !result.takeaways || !result.critique;

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8 animate-fade-in">
                <div className="mb-4 sm:mb-0 text-center sm:text-left max-w-3xl">
                    <h1 className="text-3xl font-bold text-brand-text break-words">
                        {result.title || <div className="h-9 w-96 bg-brand-muted rounded animate-pulse"></div>}
                    </h1>
                    <p className="text-brand-text-muted truncate">{fileName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                     <button
                        onClick={onGeneratePresentation}
                        disabled={isGeneratingPresentation || isExportDisabled}
                        className="flex items-center space-x-2 bg-brand-magenta/80 hover:bg-brand-magenta text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isExportDisabled ? "Please wait for full analysis to complete" : "Generate Presentation"}
                    >
                        <Icon name="presentation" className={`w-5 h-5 ${isGeneratingPresentation ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingPresentation ? "Generating..." : "Presentation"}</span>
                    </button>
                     <button
                        onClick={() => setShowExportModal(true)}
                        disabled={isExportDisabled}
                        className="flex items-center space-x-2 bg-brand-muted hover:bg-brand-cyan hover:text-brand-bg text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isExportDisabled ? "Please wait for full analysis to complete" : "Export Analysis"}
                    >
                         <Icon name="export" className="w-5 h-5" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={onReset}
                        className="flex items-center space-x-2 bg-brand-muted hover:bg-brand-cyan hover:text-brand-bg text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        title="Analyze a New Paper"
                    >
                         <Icon name="reset" className="w-5 h-5" />
                        <span>New Paper</span>
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
                            <TabButton active={activeTab === 'ideation'} onClick={() => setActiveTab('ideation')}><Icon name="flask" className="w-4 h-4" />Ideation Lab</TabButton>
                             {result.images && result.images.length > 0 && (
                                <TabButton active={activeTab === 'figures'} onClick={() => setActiveTab('figures')}>Figures</TabButton>
                            )}
                            <TabButton active={activeTab === 'references'} onClick={() => setActiveTab('references')}><Icon name="bibliography" className="w-4 h-4" />References</TabButton>
                            <TabButton active={activeTab === 'related'} onClick={() => setActiveTab('related')}>Related</TabButton>
                        </div>
                        <div className="p-6 min-h-[400px]">
                             {activeTab === 'takeaways' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="font-semibold text-brand-text mb-4">Key Takeaways</h3>
                                    {result.takeaways ? (
                                        <ul className="list-none space-y-4">
                                            {result.takeaways.map((takeaway, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <Icon name="takeaways" className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-1" />
                                                    <p className="text-brand-text-muted"><HighlightableText text={takeaway} glossary={result.glossary} /></p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <SkeletonList count={4} />}
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
                                         <button onClick={handleRegenerate} disabled={isRegenerating || !summary} className="mt-4 w-full flex justify-center items-center gap-2 bg-brand-cyan/90 hover:bg-brand-cyan text-brand-bg font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isRegenerating ? 'Regenerating...' : 'Regenerate Summary'}
                                            <Icon name="regenerate" className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-brand-text mb-2">Overall Summary:</h3>
                                        {summary ? <p><HighlightableText text={summary} glossary={result.glossary} /></p> : <SkeletonParagraph />}
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-brand-cyan mb-2">Problem Statement</h4>
                                        {result.aspects ? <p className="text-sm"><HighlightableText text={result.aspects.problemStatement} glossary={result.glossary} /></p> : <SkeletonParagraph />}
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-brand-cyan mb-2">Methodology</h4>
                                        {result.aspects ? <p className="text-sm"><HighlightableText text={result.aspects.methodology} glossary={result.glossary} /></p> : <SkeletonParagraph />}
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-brand-cyan mb-2">Key Findings</h4>
                                        {result.aspects ? (
                                            <ul className="list-none space-y-3 text-sm">
                                                {result.aspects.keyFindings.map((kf, i) => <VerifiablePointDisplay key={i} item={kf} glossary={result.glossary}/>)}
                                            </ul>
                                        ) : <SkeletonList />}
                                    </div>
                                </div>
                            )}
                             {activeTab === 'critique' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2"><Icon name="strength" />Strengths</h4>
                                        {result.critique ? (
                                            <ul className="list-none space-y-3 text-sm">
                                                {result.critique.strengths.map((s, i) => <VerifiablePointDisplay key={i} item={s} glossary={result.glossary}/>)}
                                            </ul>
                                        ) : <SkeletonList />}
                                    </div>
                                    <div className="pt-4 border-t border-brand-muted/50">
                                        <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2"><Icon name="weakness" />Weaknesses</h4>
                                        {result.critique ? (
                                            <ul className="list-none space-y-3 text-sm">
                                                {result.critique.weaknesses.map((w, i) => <VerifiablePointDisplay key={i} item={w} glossary={result.glossary} />)}
                                            </ul>
                                        ) : <SkeletonList />}
                                    </div>
                                </div>
                            )}
                            {activeTab === 'ideation' && (
                                <div className="animate-fade-in space-y-6">
                                    <h3 className="font-semibold text-brand-text mb-4">AI Ideation Lab</h3>
                                    {result.ideation ? (
                                        result.ideation.length > 0 ? (
                                             <div className="space-y-4">
                                                {result.ideation.map((idea, i) => (
                                                    <div key={i} className="p-4 bg-brand-bg rounded-lg border border-brand-muted/50">
                                                        <h4 className="font-semibold text-brand-cyan mb-2">Hypothesis {i+1}</h4>
                                                        <p className="text-sm mb-3"><HighlightableText text={idea.hypothesis} glossary={result.glossary} /></p>
                                                        <h5 className="font-semibold text-brand-text-muted text-xs mb-1">Proposed Experiment</h5>
                                                        <p className="text-xs text-brand-text-muted/80"><HighlightableText text={idea.experimentalDesign} glossary={result.glossary} /></p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-brand-text-muted text-sm">No new research hypotheses were generated.</p>
                                    ) : <SkeletonList count={2} />}
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
                             {activeTab === 'references' && (
                                <div className="animate-fade-in">
                                    <h3 className="font-semibold text-brand-text mb-4">Extracted References</h3>
                                    {result.references ? (
                                        <ReferencesDisplay references={result.references} />
                                    ) : <SkeletonParagraph lines={5} />}
                                </div>
                            )}
                             {activeTab === 'related' && (
                                <div className="animate-fade-in">
                                    <h3 className="font-semibold text-brand-text mb-4">Similar Research Papers</h3>
                                    {result.relatedPapers ? (
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
                                    ) : <SkeletonList />}
                                    <p className="text-xs text-brand-subtle mt-4">Powered by Google Search</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <ChatInterface 
                        documentText={documentText} 
                        figures={result.images || []}
                        overallSummary={result.overallSummary || ''}
                    />
                </div>
            </main>
            {showFigureModal && (
                <FigureExplainerModal 
                    image={showFigureModal}
                    documentText={documentText}
                    onClose={() => setShowFigureModal(null)}
                />
            )}
             {showExportModal && result.title && (
                <ExportModal
                    result={{ ...result, overallSummary: summary } as AnalysisResult}
                    fileName={fileName}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
};

export default AnalysisDashboard;
