

import React from 'react';
import FileUpload from './FileUpload';
import Loader from './Loader';
import Icon from './Icon';
// FIX: Import IconProps to use for typing FeatureCard icon prop
import type { IconProps } from './Icon';
import type { HistoryItem } from '../types';
// FIX: Import Variants type to correctly type animation variants
import { motion, type Variants } from 'framer-motion';

interface LandingPageProps {
    onFileParsed: (text: string, images: string[], name:string) => void;
    isLoading: boolean;
    progress: number;
    updateProgress: (value: number | ((prev: number) => number)) => void;
    loadingMessage: string;
    history: HistoryItem[];
    onLoadFromHistory: (item: HistoryItem) => void;
}

const FeatureCard: React.FC<{ icon: IconProps['name'], title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-brand-surface p-6 rounded-lg border border-brand-muted backdrop-blur-sm transition-all duration-300 hover:border-brand-cyan/50 hover:-translate-y-1">
        <div className="flex items-center gap-4">
            <div className="bg-brand-cyan/10 p-3 rounded-full">
                <Icon name={icon} className="w-6 h-6 text-brand-cyan" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-brand-text">{title}</h3>
                <p className="text-sm text-brand-text-muted">{description}</p>
            </div>
        </div>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onFileParsed, isLoading, progress, updateProgress, loadingMessage, history, onLoadFromHistory }) => {

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    // FIX: Add Variants type to fix framer-motion type inference issue
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    // FIX: Add Variants type to fix framer-motion type inference issue
    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };


    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="flex flex-col items-center text-center">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-magenta"
                >
                    Prism
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-3xl text-lg md:text-xl text-brand-text-muted mt-4 mb-12"
                >
                    Your personal AI research assistant for deep literature analysis. Go beyond summarization and engage in a dialogue with science.
                </motion.p>

                {isLoading ? (
                    <Loader progress={progress} message={loadingMessage} />
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="w-full"
                    >
                        <FileUpload onFileParsed={onFileParsed} updateProgress={updateProgress} />
                    </motion.div>
                )}
            </div>
            
            {history.length > 0 && !isLoading && (
                 <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="mt-24 md:mt-32 max-w-4xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3">
                        <Icon name="history" /> Recent Analyses
                    </h2>
                    <div className="space-y-3">
                        {history.map(item => (
                            <button key={item.id} onClick={() => onLoadFromHistory(item)} className="w-full text-left p-4 bg-brand-surface border border-brand-muted rounded-lg hover:border-brand-cyan transition-colors duration-200">
                                <p className="font-semibold text-brand-text truncate">{item.title}</p>
                                <p className="text-sm text-brand-text-muted">{item.fileName} - {formatDate(item.timestamp)}</p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

             <div className="mt-24 md:mt-32">
                <motion.h2 
                     initial={{ opacity: 0, y: 50 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-4xl font-bold text-center mb-4"
                >
                    A Complete Toolkit for Scientific Insight
                </motion.h2>
                <motion.p
                     initial={{ opacity: 0, y: 50 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-lg text-brand-text-muted text-center max-w-3xl mx-auto mb-12"
                >
                    Prism provides a suite of AI-powered features designed to accelerate your research workflow from every angle.
                </motion.p>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                >
                    <motion.div variants={itemVariants}><FeatureCard icon="summary" title="Multi-Aspect Summaries" description="Generate tailored summaries for methodology, findings, or problem statements." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="lightbulb" title="Adaptive Explanations" description="Understand complex concepts with explanations adapted to your expertise level." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="critique" title="AI-Powered Critique" description="Receive an automated analysis of the paper's strengths, weaknesses, and novelty." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="chat" title="Interactive Q&A" description="Chat directly with the document to clarify doubts and explore topics in-depth." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="brain-circuit" title="Concept Mapping" description="Visualize the core concepts and their relationships in an interactive graph." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="search" title="Related Paper Discovery" description="Find similar and relevant research papers powered by Google Search." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="quiz" title="Comprehension Quiz" description="Test your understanding with an auto-generated quiz on the paper's key points." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="presentation" title="Presentation Generator" description="Create a slide-by-slide presentation draft from the paper in seconds." /></motion.div>
                    <motion.div variants={itemVariants}><FeatureCard icon="export" title="Flexible Exporting" description="Export your complete analysis to PDF or Markdown for your records." /></motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default LandingPage;
