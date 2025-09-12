
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
    conceptMap?: ConceptMapData;
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