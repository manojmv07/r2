
export interface VerifiablePoint {
    point: string;
    evidence: string; // Direct quote from the source text
}

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string; // The correct option text
}

export interface ConceptMapData {
    nodes: { id: string; label: string }[];
    links: { source: string; target: string; relationship: string }[];
}

export interface PresentationSlide {
    title: string;
    content: string[]; // Array of bullet points
}

export interface GlossaryTerm {
    term: string;
    definition: string;
}

export interface Hypothesis {
    hypothesis: string;
    experimentalDesign: string;
}

export interface Reference {
    apa: string[];
    bibtex: string[];
}

export interface AnalysisResult {
    title?: string;
    takeaways?: string[];
    overallSummary?: string;
    aspects?: {
        problemStatement: string;
        methodology: string;
        keyFindings: VerifiablePoint[];
    };
    critique?: {
        strengths: VerifiablePoint[];
        weaknesses: VerifiablePoint[];
    };
    novelty?: {
        assessment: string;
        comparison: string;
    };
    futureWork?: string[];
    relatedPapers?: {
        title: string;
        uri: string;
    }[];
    images: string[];
    glossary?: GlossaryTerm[];
    ideation?: Hypothesis[];
    references?: Reference;
}

export interface SynthesisResult {
    overallSynthesis: string;
    commonThemes: {
        theme: string;
        papers: string[]; // list of file names or indices
    }[];
    conflictingFindings: {
        finding: string;
        papers: string[];
    }[];
    conceptEvolution: string;
}

export interface HistoryItem {
    id: string;
    title: string;
    fileName: string;
    timestamp: number;
    result: AnalysisResult;
    documentText: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    image?: string; // base64 data URL
}

export interface ParsedFile {
    name: string;
    text: string;
    images: string[];
}

export enum Persona {
    EXPERT = "a domain expert in the field",
    ENGINEER = "a software engineer with no expertise in this specific domain",
    STUDENT = "a curious high school student",
    MANAGER = "a product manager looking for business implications"
}

export enum SummaryLength {
    BRIEF = "a brief, one-sentence gist",
    DETAILED = "a detailed, single paragraph summary",
    COMPREHENSIVE = "a comprehensive, multi-paragraph summary"
}

export enum TechnicalDepth {
    LOW = "in simple, easy-to-understand language, avoiding jargon",
    MEDIUM = "with moderate technical detail",
    HIGH = "with full technical depth and terminology"
}
