
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import AnalysisDashboard from './components/AnalysisDashboard';
import SynthesisDashboard from './components/SynthesisDashboard';
import Footer from './components/Footer';
import QuizModal from './components/QuizModal';
import PresentationModal from './components/PresentationModal';
import { 
    findRelatedPapers, generatePresentation, resetChat,
    generateSynthesisReport, validateAndGenerateQuiz, 
    generateCoreAnalysis, generateAdvancedAnalysis, generateReferences
} from './services/geminiService';
import { getHistory, saveAnalysis } from './services/historyService';
import { Persona } from './types';
import type { AnalysisResult, QuizQuestion, HistoryItem, PresentationSlide, SynthesisResult, ParsedFile } from './types';

const App: React.FC = () => {
    const [analysisMode, setAnalysisMode] = useState<'none' | 'single' | 'synthesis'>('none');
    const [analysisResult, setAnalysisResult] = useState<Partial<AnalysisResult> | null>(null);
    const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);
    
    const [documentText, setDocumentText] = useState<string>('');
    const [documentImages, setDocumentImages] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');

    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [showQuizModal, setShowQuizModal] = useState(false);
    
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [presentationSlides, setPresentationSlides] = useState<PresentationSlide[]>([]);
    const [showPresentationModal, setShowPresentationModal] = useState(false);
    const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

    useEffect(() => {
        setHistory(getHistory());
    }, []);
    
    useEffect(() => {
        // Use a late-arriving piece of data (like critique) to trigger the save.
        if (analysisMode === 'single' && analysisResult?.title && analysisResult?.overallSummary && analysisResult?.critique) {
            const currentItem: HistoryItem = {
                id: Date.now().toString(),
                title: analysisResult.title,
                fileName,
                timestamp: Date.now(),
                result: analysisResult as AnalysisResult,
                documentText,
            };
            saveAnalysis(currentItem);
            setHistory(getHistory());
        }
    }, [analysisResult?.critique]); 

    const handleGenericError = (error: any) => {
        console.error("Operation failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast.error(errorMessage, { duration: 6000 });
        handleReset();
    };
    
    const runSingleAnalysis = async (persona: Persona) => {
        setShowQuizModal(false);
        setIsLoading(true);
        setAnalysisMode('single');

        try {
            // STEP 1: Core Analysis (blocking)
            setProgress(70);
            setLoadingMessage('Generating key takeaways & summary...');
            const coreAnalysis = await generateCoreAnalysis(documentText, persona);
            
            const initialResult: Partial<AnalysisResult> = {
                ...coreAnalysis,
                images: documentImages,
            };

            setAnalysisResult(initialResult);
            setProgress(80);
            setLoadingMessage('Analysis complete! Fetching details...');
            setIsLoading(false); // Hide main loader, skeletons will show in dashboard

            // STEP 2: Advanced Analysis (background)
            generateAdvancedAnalysis(documentText, persona).then(advancedAnalysis => {
                setAnalysisResult(prev => ({ ...prev, ...advancedAnalysis }));
            }).catch(err => {
                console.error("Failed to fetch advanced analysis", err);
                toast.error("Could not load critique and ideation details.");
            });
            
            // STEP 3: References & Related Papers (background)
            generateReferences(documentText).then(referencesResult => {
                 setAnalysisResult(prev => ({ ...prev, ...referencesResult }));
            }).catch(err => {
                console.error("Failed to fetch references", err);
                toast.error("Could not load references.");
            });

            if (initialResult.title && initialResult.overallSummary) {
                findRelatedPapers(initialResult.title, initialResult.overallSummary).then(relatedPapers => {
                    setAnalysisResult(prev => ({ ...prev, relatedPapers }));
                });
            }

        } catch (error) {
            handleGenericError(error);
        }
    };
    
    const runSynthesisAnalysis = async (files: ParsedFile[]) => {
        setIsLoading(true);
        setProgress(25);
        setLoadingMessage('Synthesizing multiple documents...');
        setAnalysisMode('synthesis');
        const fileNames = files.map(f => f.name).join(', ');
        setFileName(fileNames);

        try {
            const result = await generateSynthesisReport(files.map(f => f.text));
            setSynthesisResult(result);
            setProgress(100);
            setLoadingMessage('Synthesis complete!');
        } catch (e: any) {
            handleGenericError(e);
        } finally {
            setIsLoading(false);
        }
    }

    const handleGeneratePresentation = async () => {
        if (!documentText) {
            toast.error("Document content is not available to generate a presentation.");
            return;
        }
        setIsGeneratingPresentation(true);
        const generatingToast = toast.loading("Generating presentation slides...");
        try {
            const slides = await generatePresentation(documentText);
            setPresentationSlides(slides);
            setShowPresentationModal(true);
            toast.success("Presentation generated!", { id: generatingToast });
        } catch (error) {
            console.error("Failed to generate presentation:", error);
            toast.error(error instanceof Error ? error.message : "An unknown error occurred.", { id: generatingToast });
        } finally {
            setIsGeneratingPresentation(false);
        }
    };


    const handleFilesParsed = async (files: ParsedFile[]) => {
        setIsLoading(true);
        
        if (files.length === 0) {
            setIsLoading(false);
            return;
        }

        if (files.length > 1) {
            runSynthesisAnalysis(files);
            return;
        }
        
        setProgress(10);
        setLoadingMessage('Validating document & preparing quiz...');
        const { text, images, name } = files[0];
        setDocumentText(text);
        setDocumentImages(images);
        setFileName(name);

        try {
            const { validation, quiz } = await validateAndGenerateQuiz(text);
            
            if (!validation.isPaper) {
                toast.error(`This document doesn't appear to be a research paper. Reason: ${validation.reason}`, { duration: 8000 });
                handleReset();
                return;
            }

            setProgress(60);
            setLoadingMessage('Awaiting quiz completion...');
            
            if (quiz.questions && quiz.questions.length > 0) {
                setQuizQuestions(quiz.questions);
                setShowQuizModal(true);
                // The main loader will be hidden by the quiz modal, but we keep the state.
            } else {
                toast.success("No quiz needed, proceeding with analysis.");
                runSingleAnalysis(Persona.ENGINEER);
            }

        } catch (error) {
             console.error("Failed to validate or generate quiz:", error);
             toast.error(`Could not process the document: ${error instanceof Error ? error.message : 'Unknown error'}.`);
             handleReset();
        }
    };

    const handleLoadFromHistory = (item: HistoryItem) => {
        setDocumentText(item.documentText);
        setFileName(item.fileName);
        setAnalysisResult(item.result);
        setDocumentImages(item.result.images);
        setAnalysisMode('single');
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setSynthesisResult(null);
        setDocumentText('');
        setDocumentImages([]);
        setFileName('');
        setIsLoading(false);
        setProgress(0);
        setLoadingMessage('');
        setQuizQuestions([]);
        setShowQuizModal(false);
        resetChat();
        setHistory(getHistory());
        setAnalysisMode('none');
    };
    
    const renderContent = () => {
        if (analysisMode === 'single' && analysisResult?.title) {
            return (
                <AnalysisDashboard
                    result={analysisResult}
                    documentText={documentText}
                    fileName={fileName}
                    onReset={handleReset}
                    onGeneratePresentation={handleGeneratePresentation}
                    isGeneratingPresentation={isGeneratingPresentation}
                />
            );
        }
        if (analysisMode === 'synthesis' && synthesisResult) {
            return (
                <SynthesisDashboard 
                    result={synthesisResult}
                    fileNames={fileName}
                    onReset={handleReset}
                />
            );
        }
        return (
            <LandingPage
                onFilesParsed={handleFilesParsed}
                isLoading={isLoading || showQuizModal}
                progress={progress}
                updateProgress={setProgress}
                loadingMessage={loadingMessage}
                history={history}
                onLoadFromHistory={handleLoadFromHistory}
            />
        );
    }

    return (
        <div className="min-h-screen font-sans">
            <Toaster position="top-center" toastOptions={{
                className: 'bg-brand-muted text-brand-text border border-brand-subtle',
                success: { iconTheme: { primary: '#00F5D4', secondary: '#0A0A0F' } },
                error: { iconTheme: { primary: '#FF00E5', secondary: '#0A0A0F' } },
            }} />
            <main className="relative z-10">
                {renderContent()}
                {showQuizModal && (
                    <QuizModal
                        questions={quizQuestions}
                        onComplete={runSingleAnalysis}
                    />
                )}
                {showPresentationModal && (
                    <PresentationModal
                        slides={presentationSlides}
                        onClose={() => setShowPresentationModal(false)}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
};

export default App;
