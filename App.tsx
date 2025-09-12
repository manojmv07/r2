
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AnalysisDashboard from './components/AnalysisDashboard';
import Footer from './components/Footer';
import QuizModal from './components/QuizModal';
import { generateQuiz, generateInitialAnalysis, resetChat } from './services/geminiService';
import { Persona } from './types';
import type { AnalysisResult, QuizQuestion } from './types';

const App: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [documentText, setDocumentText] = useState<string>('');
    const [documentImages, setDocumentImages] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [showQuizModal, setShowQuizModal] = useState(false);

    const handleError = (error: any) => {
        console.error("Operation failed:", error);
        // Provide a user-friendly message for the most common issue.
        const errorMessage = (error instanceof Error && error.message.includes("API key"))
            ? "The Gemini API key is either missing or invalid. Please ensure it is set correctly as an environment variable in your deployment settings (e.g., Vercel)."
            : (error instanceof Error ? error.message : 'An unknown error occurred.');
        alert(errorMessage);
        setIsLoading(false);
        setProgress(0);
    };
    
    const runAnalysis = async (persona: Persona) => {
        setShowQuizModal(false);
        setIsLoading(true);
        setProgress(50);
        try {
            const result = await generateInitialAnalysis(documentText, documentImages, persona);
            setProgress(100);
            setAnalysisResult({ ...result, images: documentImages });
            setIsLoading(false);
        } catch (e: any) {
            handleError(e);
        }
    };

    const handleFileParsed = async (text: string, images: string[], name: string) => {
        setIsLoading(true);
        setProgress(10);
        setDocumentText(text);
        setDocumentImages(images);
        setFileName(name);

        try {
            setProgress(20);
            const questions = await generateQuiz(text);
            setQuizQuestions(questions);
            setShowQuizModal(true);
            setProgress(30);
        } catch (error) {
             console.error("Failed to generate quiz, proceeding with default analysis.", error);
             // If quiz fails for any reason (including API key), show an alert and proceed.
             alert(`Could not generate the interactive quiz: ${error instanceof Error ? error.message : 'Unknown error'}. Proceeding with default analysis.`);
             await runAnalysis(Persona.ENGINEER);
        }
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setDocumentText('');
        setDocumentImages([]);
        setFileName('');
        setIsLoading(false);
        setProgress(0);
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
                    />
                )}
                {showQuizModal && (
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
