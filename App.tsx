
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AnalysisDashboard from './components/AnalysisDashboard';
import Footer from './components/Footer';
import QuizModal from './components/QuizModal';
import { generateQuiz, validateDocument, generateInitialContent, generateDetailedContent, findRelatedPapers, resetChat } from './services/geminiService';
import { Persona } from './types';
import type { AnalysisResult, QuizQuestion } from './types';

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

    const handleGenericError = (error: any) => {
        console.error("Operation failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        alert(errorMessage);
        handleReset();
    };
    
    const runAnalysis = async (persona: Persona) => {
        setShowQuizModal(false);
        setIsLoading(true);
        setProgress(50);
        setLoadingMessage('Performing initial analysis...');
        
        try {
            // First, get the essential content quickly.
            const initialContent = await generateInitialContent(documentText, persona);
            setProgress(75);
            setLoadingMessage('Fetching detailed analysis...');

            // Set initial results to render the dashboard immediately.
            const partialResult: Partial<AnalysisResult> = { ...initialContent, images: documentImages };
            setAnalysisResult(partialResult);
            setIsLoading(false); // Switch to dashboard view

            // Concurrently fetch the rest of the data in the background.
            generateDetailedContent(documentText, persona).then(detailedContent => {
                setAnalysisResult(prev => ({ ...prev, ...detailedContent }));
            });

            if (initialContent.title && initialContent.overallSummary) {
                findRelatedPapers(initialContent.title, initialContent.overallSummary).then(relatedPapers => {
                    setAnalysisResult(prev => ({ ...prev, relatedPapers }));
                });
            }

        } catch (e: any) {
            handleGenericError(e);
        }
    };

    const handleFileParsed = async (text: string, images: string[], name: string) => {
        setIsLoading(true);
        setProgress(10);
        setLoadingMessage('Validating document...');
        
        try {
            const validation = await validateDocument(text);
            if (!validation.isPaper) {
                alert(`This file does not appear to be a research paper. Reason: ${validation.reason}`);
                setIsLoading(false);
                setProgress(0);
                return;
            }
            
            setProgress(20);
            setLoadingMessage('Generating comprehension quiz...');
            setDocumentText(text);
            setDocumentImages(images);
            setFileName(name);

            const questions = await generateQuiz(text);
            setQuizQuestions(questions);
            setShowQuizModal(true);
            setProgress(30);

        } catch (error) {
             console.error("Failed to process document:", error);
             alert(`Could not process the document: ${error instanceof Error ? error.message : 'Unknown error'}.`);
             setIsLoading(false);
             setProgress(0);
        }
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
    };
    
    return (
        <div className="min-h-screen font-sans">
            <main className="relative z-10">
                {analysisResult ? (
                    <AnalysisDashboard
                        result={analysisResult}
                        documentText={documentText}
                        fileName={fileName}
                        onReset={handleReset}
                    />
                ) : (
                    <LandingPage
                        onFileParsed={handleFileParsed}
                        isLoading={isLoading}
                        progress={progress}
                        updateProgress={setProgress}
                        loadingMessage={loadingMessage}
                    />
                )}
                {showQuizModal && !isLoading && (
                    <QuizModal
                        questions={quizQuestions}
                        onComplete={runAnalysis}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
};

export default App;
