
import React from 'react';
import FileUpload from './FileUpload';
import Loader from './Loader';
import Icon from './Icon';
import type { IconProps } from './Icon';
import type { HistoryItem, ParsedFile } from '../types';
import { motion, type Variants } from 'framer-motion';

interface LandingPageProps {
    onFilesParsed: (files: ParsedFile[]) => void;
    isLoading: boolean;
    progress: number;
    updateProgress: (value: number | ((prev: number) => number)) => void;
    loadingMessage: string;
    history: HistoryItem[];
    onLoadFromHistory: (item: HistoryItem) => void;
}

const Feature: React.FC<{ icon: IconProps['name']; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 bg-brand-muted p-3 rounded-full">
      <Icon name={icon} className="w-6 h-6 text-brand-cyan" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-brand-text">{title}</h3>
      <p className="text-sm text-brand-text-muted">{description}</p>
    </div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onFilesParsed, isLoading, progress, updateProgress, loadingMessage, history, onLoadFromHistory }) => {

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
            {/* Hero Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-24 md:mb-32">
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-magenta leading-tight">
                        Prism
                    </h1>
                    <h2 className="text-xl sm:text-2xl font-semibold text-brand-text mt-2">The All-in-One AI Platform for Scientific Research.</h2>
                    <p className="text-md md:text-lg text-brand-text-muted mt-4 max-w-xl">
                        Go beyond summarization. Prism is a comprehensive suite of tools designed to accelerate your entire discovery workflow—from deep analysis to brilliant presentation.
                    </p>
                     <motion.div className="mt-6 space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                        <motion.div variants={itemVariants} className="flex items-center gap-3 text-brand-text-muted"><Icon name="check-circle" className="w-5 h-5 text-brand-cyan" /> Synthesize knowledge across multiple documents.</motion.div>
                        <motion.div variants={itemVariants} className="flex items-center gap-3 text-brand-text-muted"><Icon name="check-circle" className="w-5 h-5 text-brand-cyan" /> Generate novel hypotheses and outline experiments.</motion.div>
                        <motion.div variants={itemVariants} className="flex items-center gap-3 text-brand-text-muted"><Icon name="check-circle" className="w-5 h-5 text-brand-cyan" /> Chat directly with your data, figures, and tables.</motion.div>
                    </motion.div>

                    <div className="mt-10">
                        {isLoading ? (
                            <div className="mt-8"><Loader progress={progress} message={loadingMessage} /></div>
                        ) : (
                            <div className="w-full">
                                <FileUpload onFilesParsed={onFilesParsed} updateProgress={updateProgress} />
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="hidden lg:block bg-brand-surface border border-brand-muted rounded-xl p-4"
                >
                    <div className="aspect-video bg-brand-bg rounded-lg p-6 flex flex-col gap-4 overflow-hidden">
                         <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-brand-text">Analysis Dashboard</h2>
                            <div className="flex gap-2"><span className="w-3 h-3 bg-red-500 rounded-full"></span><span className="w-3 h-3 bg-yellow-500 rounded-full"></span><span className="w-3 h-3 bg-green-500 rounded-full"></span></div>
                         </div>
                         <motion.div initial={{ y: 50 }} animate={{ y: 0 }} transition={{ duration: 0.5, delay: 0.8 }} className="flex-grow bg-brand-muted/50 rounded-md p-4 space-y-3">
                            <div className="h-4 bg-brand-cyan/50 rounded w-3/4"></div>
                            <div className="h-3 bg-brand-subtle rounded w-full"></div>
                            <div className="h-3 bg-brand-subtle rounded w-5/6"></div>
                         </motion.div>
                         <motion.div initial={{ y: 50 }} animate={{ y: 0 }} transition={{ duration: 0.5, delay: 1.0 }} className="flex-grow bg-brand-muted/50 rounded-md p-4 space-y-3">
                            <div className="h-4 bg-brand-magenta/50 rounded w-1/2"></div>
                            <div className="h-3 bg-brand-subtle rounded w-full"></div>
                         </motion.div>
                    </div>
                </motion.div>
            </div>
            
            {/* Features Section */}
            <div className="text-center mb-16">
                 <h2 className="text-4xl font-bold text-brand-text mb-4">The Ultimate Research Toolkit</h2>
                 <p className="text-lg text-brand-text-muted max-w-3xl mx-auto">Prism is engineered with a comprehensive suite of AI tools to tackle every stage of your research process, from initial understanding to final presentation.</p>
            </div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 max-w-7xl mx-auto">
                <motion.div variants={itemVariants}><Feature icon="synthesis" title="Cross-Document Synthesis" description="Upload multiple papers to uncover shared themes, conflicting findings, and the evolution of ideas across literature." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="chat" title="Multimodal Q&A" description="Chat with your documents and figures. Ask the AI to analyze graphs, diagrams, and tables directly." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="flask" title="AI Ideation Lab" description="Generate novel research hypotheses and potential experimental designs based on a paper's findings and limitations." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="bibliography" title="Automated Bibliography" description="Extract all citations from a paper and export them in APA or BibTeX format with a single click." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="summary" title="Interactive Glossary" description="Hover over any key technical term in the analysis to get an instant, context-aware definition." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="brain-circuit" title="Concept Mapping" description="Visualize the core concepts and their relationships in an interactive, force-directed graph." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="critique" title="AI-Powered Critique" description="Receive an automated analysis of the paper's strengths, weaknesses, and novelty." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="presentation" title="Presentation Generator" description="Create a slide-by-slide presentation draft from the paper in seconds." /></motion.div>
                <motion.div variants={itemVariants}><Feature icon="search" title="Related Paper Discovery" description="Find similar and relevant research papers powered by Google Search." /></motion.div>
            </motion.div>
            
            {/* History Section */}
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
        </div>
    );
};

export default LandingPage;
