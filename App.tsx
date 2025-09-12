
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import AnalysisDashboard from './components/AnalysisDashboard';
import Footer from './components/Footer';
import QuizModal from './components/QuizModal';
import PresentationModal from './components/PresentationModal';
import { generateQuiz, validateDocument, generateInitialContent, generateDetailedContent, findRelatedPapers, generateConceptMapData, generatePresentation, resetChat } from './services/geminiService';
import { getHistory, saveAnalysis } from './services/historyService';
import { Persona } from './types';
import type { AnalysisResult, QuizQuestion, HistoryItem, PresentationSlide } from './types';

const App: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<Partial<AnalysisResult> | null>(null);
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
    
    // Save analysis to history whenever a complete result is generated
    useEffect(() => {
        if (analysisResult?.title && analysisResult?.overallSummary && analysisResult?.critique) {
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
    }, [analysisResult?.critique]); // Using a late-arriving piece of data to trigger save

    const handleGenericError = (error: any) => {
        console.error("Operation failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast.error(errorMessage, { duration: 6000 });
        handleReset();
    };

    const proceedWithAnalysis = (text: string, images: string[], name: string) => {
        setProgress(20);
        setLoadingMessage('Generating comprehension quiz...');
        setDocumentText(text);
        setDocumentImages(images);
        setFileName(name);

        generateQuiz(text)
            .then(questions => {
                setQuizQuestions(questions);
                setShowQuizModal(true);
                setProgress(30);
            })
            .catch(error => {
                console.error("Failed to generate quiz:", error);
                toast.error(`Could not generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}. Starting analysis directly.`);
                // If quiz fails, skip to analysis
                runAnalysis(Persona.ENGINEER);
            });
    };
    
    const runAnalysis = async (persona: Persona) => {
        setShowQuizModal(false);
        setIsLoading(true);
        setProgress(50);
        setLoadingMessage('Performing initial analysis...');
        
        try {
            const initialContent = await generateInitialContent(documentText, persona);
            setProgress(75);
            setLoadingMessage('Fetching detailed analysis...');

            const partialResult: Partial<AnalysisResult> = { ...initialContent, images: documentImages };
            setAnalysisResult(partialResult);
            setIsLoading(false);

            generateDetailedContent(documentText, persona).then(detailedContent => {
                setAnalysisResult(prev => ({ ...prev, ...detailedContent }));
            });

            if (initialContent.title && initialContent.overallSummary) {
                findRelatedPapers(initialContent.title, initialContent.overallSummary).then(relatedPapers => {
                    setAnalysisResult(prev => ({ ...prev, relatedPapers }));
                });
            }

            generateConceptMapData(documentText).then(conceptMap => {
                setAnalysisResult(prev => ({ ...prev, conceptMap }));
            });

        } catch (e: any) {
            handleGenericError(e);
        }
    };

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


    const handleFileParsed = async (text: string, images: string[], name: string) => {
        setIsLoading(true);
        setProgress(10);
        setLoadingMessage('Validating document...');
        
        try {
            const validation = await validateDocument(text);
            if (!validation.isPaper) {
                toast((t) => (
                    <div className="flex flex-col gap-3">
                        <p><b>Warning:</b> This file may not be a research paper. ({validation.reason})</p>
                        <div className="flex gap-2">
                            <button onClick={() => { toast.dismiss(t.id); proceedWithAnalysis(text, images, name); }} className="w-full bg-green-500 text-white text-sm font-bold p-2 rounded-md">Proceed Anyway</button>
                            <button onClick={() => { toast.dismiss(t.id); handleReset(); }} className="w-full bg-gray-500 text-white text-sm font-bold p-2 rounded-md">Cancel</button>
                        </div>
                    </div>
                ), { duration: Infinity });
                setIsLoading(false);
                setProgress(0);
                return;
            }
            proceedWithAnalysis(text, images, name);
        } catch (error) {
             console.error("Failed to process document:", error);
             toast.error(`Could not process the document: ${error instanceof Error ? error.message : 'Unknown error'}.`);
             setIsLoading(false);
             setProgress(0);
        }
    };

    const handleLoadFromHistory = (item: HistoryItem) => {
        setDocumentText(item.documentText);
        setFileName(item.fileName);
        setAnalysisResult(item.result);
        setDocumentImages(item.result.images);
    };

    const handleReset = () => {
        setAnalysisResult(null);
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
    };
    
    return (
        <div className="min-h-screen font-sans">
            <Toaster position="top-center" toastOptions={{
                className: 'bg-brand-muted text-brand-text border border-brand-subtle',
                success: { iconTheme: { primary: '#00F5D4', secondary: '#0A0A0F' } },
                error: { iconTheme: { primary: '#FF00E5', secondary: '#0A0A0F' } },
            }} />
            <main className="relative z-10">
                {analysisResult ? (
                    <AnalysisDashboard
                        result={analysisResult}
                        documentText={documentText}
                        fileName={fileName}
                        onReset={handleReset}
                        onGeneratePresentation={handleGeneratePresentation}
                        isGeneratingPresentation={isGeneratingPresentation}
                    />
                ) : (
                    <LandingPage
                        onFileParsed={handleFileParsed}
                        isLoading={isLoading}
                        progress={progress}
                        updateProgress={setProgress}
                        loadingMessage={loadingMessage}
                        history={history}
                        onLoadFromHistory={handleLoadFromHistory}
                    />
                )}
                {showQuizModal && !isLoading && (
                    <QuizModal
                        questions={quizQuestions}
                        onComplete={runAnalysis}
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
