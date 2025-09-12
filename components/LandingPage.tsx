import React from 'react';
import FileUpload from './FileUpload';
import Loader from './Loader';
import Icon from './Icon';

interface LandingPageProps {
    onFileParsed: (text: string, images: string[], name: string) => void;
    isLoading: boolean;
    progress: number;
    updateProgress: (value: number | ((prev: number) => number)) => void;
}

const FeatureCard: React.FC<{ icon: 'summary' | 'lightbulb' | 'critique' | 'chat', title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-brand-surface p-6 rounded-lg border border-brand-muted text-center animate-slide-up backdrop-blur-sm" style={{ animationDelay: '500ms', opacity: 0, animationFillMode: 'forwards' }}>
        <div className="flex justify-center mb-4">
            <div className="bg-brand-cyan/10 p-3 rounded-full">
                <Icon name={icon} className="w-8 h-8 text-brand-cyan" />
            </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-brand-text">{title}</h3>
        <p className="text-brand-text-muted">{description}</p>
    </div>
);

const HowItWorksStep: React.FC<{ number: string, title: string, description: string, delay: string }> = ({ number, title, description, delay }) => (
     <div className="flex items-start space-x-4 animate-slide-up" style={{ animationDelay: delay, opacity: 0, animationFillMode: 'forwards' }}>
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center border-2 border-brand-cyan rounded-full text-brand-cyan font-bold text-xl">
            {number}
        </div>
        <div>
            <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
            <p className="text-brand-text-muted">{description}</p>
        </div>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onFileParsed, isLoading, progress, updateProgress }) => {

    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="flex flex-col items-center text-center">
                <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-magenta animate-fade-in">
                    Prism
                </h1>
                <p className="max-w-3xl text-lg md:text-xl text-brand-text-muted mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    Your personal AI research assistant for deep literature analysis. Go beyond summarization and engage in a dialogue with science.
                </p>

                {isLoading ? (
                    <Loader progress={progress} />
                ) : (
                    <div className="w-full animate-fade-in" style={{ animationDelay: '400ms' }}>
                        <FileUpload onFileParsed={onFileParsed} updateProgress={updateProgress} />
                    </div>
                )}
            </div>
            
            <div className="mt-24 md:mt-32 max-w-4xl mx-auto">
                 <h2 className="text-3xl font-bold text-center mb-12 animate-slide-up" style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>How It Works</h2>
                 <div className="space-y-10">
                    <HowItWorksStep number="1" title="Upload Your Document" description="Drag and drop any scientific paper in PDF, DOCX, or TXT format. Our engine parses everything—text, tables, and even figures." delay="400ms" />
                    <HowItWorksStep number="2" title="Dynamic Analysis" description="Prism performs a multi-layered analysis, assessing the paper's arguments, novelty, and quality, tailored to your expertise level." delay="500ms" />
                    <HowItWorksStep number="3" title="Interact and Explore" description="Dive deep with an interactive dashboard. Chat with the paper, get explanations for complex figures, and export your findings." delay="600ms" />
                 </div>
            </div>

            <div className="mt-24 md:mt-32">
                <h2 className="text-3xl font-bold text-center mb-12 animate-slide-up" style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>Beyond Summarization to Scientific Discourse</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard icon="summary" title="Multi-Aspect Summary" description="Get summaries tailored to specific sections like methodology, findings, or problem statements." />
                    <FeatureCard icon="lightbulb" title="Audience-Adaptive Explanation" description="Understand complex concepts with explanations adapted to your level of expertise." />
                    <FeatureCard icon="critique" title="Automated Critique" description="Receive an AI-generated analysis of the paper's strengths, weaknesses, and novelty." />
                    <FeatureCard icon="chat" title="Interactive Q&A" description="Chat with the document to clarify doubts and explore topics in-depth." />
                </div>
            </div>
        </div>
    );
};

export default LandingPage;