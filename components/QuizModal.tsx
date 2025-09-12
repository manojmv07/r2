
import React, { useState } from 'react';
// FIX: 'Persona' is an enum used as a value, so it must be imported without 'type'.
import { Persona } from '../types';
import type { QuizQuestion } from '../types';

interface QuizModalProps {
    questions: QuizQuestion[];
    onComplete: (persona: Persona) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ questions, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    const handleAnswerSelect = (option: string) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = option;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (selectedAnswers[currentQuestionIndex] === questions[currentQuestionIndex].answer) {
            setScore(prev => prev + 1);
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setShowResults(true);
        }
    };
    
    const finishQuiz = () => {
        let finalScore = score;
        if (selectedAnswers[currentQuestionIndex] === questions[currentQuestionIndex].answer) {
             finalScore += 1;
        }

        let persona: Persona;
        if (finalScore >= 4) persona = Persona.EXPERT;
        else if (finalScore >= 2) persona = Persona.ENGINEER;
        else persona = Persona.STUDENT;
        
        onComplete(persona);
    };

    if (showResults) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-brand-surface border border-brand-muted rounded-lg p-8 max-w-lg w-full text-center">
                    <h2 className="text-2xl font-bold text-brand-text mb-4">Quiz Complete!</h2>
                    <p className="text-brand-text-muted mb-2">You scored:</p>
                    <p className="text-5xl font-bold text-brand-cyan mb-6">{score} / {questions.length}</p>
                    <p className="text-brand-text-muted mb-6">Based on your score, we'll tailor the analysis for a <span className="text-brand-cyan font-semibold">{ (score >= 4) ? 'Domain Expert' : (score >= 2) ? 'Software Engineer' : 'Curious Student' }</span>.</p>
                    <button onClick={finishQuiz} className="bg-brand-cyan text-brand-bg font-bold py-2 px-6 rounded-lg transition-transform hover:scale-105">
                        Start Analysis
                    </button>
                </div>
            </div>
        );
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-brand-surface border border-brand-muted rounded-lg p-8 max-w-2xl w-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text">Expertise Check (Optional)</h2>
                        <p className="text-sm text-brand-text-muted">Answer a few questions to tailor the analysis to your expertise.</p>
                    </div>
                     <button onClick={() => onComplete(Persona.ENGINEER)} className="text-sm text-brand-subtle hover:text-brand-text">&times; Skip</button>
                </div>
                
                <div className="my-6">
                    <p className="text-brand-text-muted mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <h3 className="text-lg font-semibold text-brand-text">{currentQuestion.question}</h3>
                </div>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            className={`block w-full text-left p-3 rounded-md border-2 transition-colors ${
                                selectedAnswers[currentQuestionIndex] === option
                                    ? 'border-brand-cyan bg-brand-cyan/10'
                                    : 'border-brand-muted hover:border-brand-subtle bg-brand-bg'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentQuestionIndex]}
                        className="bg-brand-cyan text-brand-bg font-bold py-2 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizModal;