
import { GoogleGenAI, Type, Chat, Part } from "@google/genai";
import type { AnalysisResult, ChatMessage, Persona, SummaryLength, TechnicalDepth, QuizQuestion, ConceptMapData, PresentationSlide, SynthesisResult, Hypothesis, Reference, GlossaryTerm } from '../types';

// Hardcoded API keys with a round-robin rotation to distribute requests.
const API_KEYS = [
    'AIzaSyAR2BgYjzwHRuzwmXSU_dFeekix9uhBBTA',
    'AIzaSyAR2BgYjzwHRuzwmXSU_dFeekix9uhBBTA',
    'AIzaSyDsE6eI6fDUo756_ADuRAm1wkUiWSGTupI',
    'AIzaSyDPCJ-ZQIFn88zsyDeIsR7nQGearUEY3z8',
    'AIzaSyBY4PXJnUOSSBxB0wJIYCYDcKJ9AhQsQrU',
    'AIzaSyDNK5X9mr8AB0wjy9D2gtvpCdQ0FUecj5Y',
    'AIzaSyBHFWFQDA0kkxobLvoqwV_fc7xHbuRvI00', // New key from different project
    'AIzaSyAGoeza5zsrOIdvp7aZ-7_FlpnUVYUpcwU'  // New key from different project
];
let currentKeyIndex = 0;

const getNextApiKey = (): string => {
    const apiKey = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`Using API Key index: ${currentKeyIndex}`);
    return apiKey;
};

let chatInstance: Chat | null = null;
let chatSummary: string | null = null;

const getAi = (): GoogleGenAI => {
    const apiKey = getNextApiKey();
    try {
        return new GoogleGenAI({ apiKey });
    } catch (e: any) {
        console.error("Error initializing GoogleGenAI:", e.message);
        throw new Error(`Failed to initialize AI service. Is the API Key format correct?`);
    }
};

const verifiablePointSchema = {
    type: Type.OBJECT,
    properties: {
        point: { type: Type.STRING, description: "The analytical point, finding, strength, or weakness." },
        evidence: { type: Type.STRING, description: "A direct, verbatim quote from the source text that supports the point." },
    },
    required: ['point', 'evidence'],
};

const glossaryTermSchema = {
    type: Type.OBJECT,
    properties: {
        term: { type: Type.STRING, description: "The specific technical term or acronym found in the text." },
        definition: { type: Type.STRING, description: "A concise, one-sentence definition of the term in the context of the paper." },
    },
    required: ["term", "definition"],
};

const hypothesisSchema = {
    type: Type.OBJECT,
    properties: {
        hypothesis: { type: Type.STRING, description: "A novel, testable research hypothesis that logically extends from the paper's findings or limitations." },
        experimentalDesign: { type: Type.STRING, description: "A brief, high-level outline of an experimental design to test this hypothesis, including methodology, key metrics, and control groups." },
    },
    required: ['hypothesis', 'experimentalDesign'],
};

const referenceSchema = {
    type: Type.OBJECT,
    properties: {
        apa: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of all extracted citations, formatted in APA 7th edition style." },
        bibtex: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of all extracted citations, formatted as BibTeX entries." },
    },
    required: ['apa', 'bibtex'],
};

const fullAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The title of the research paper." },
        takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of the 3-5 most critical, high-level key takeaways from the paper." },
        overallSummary: { type: Type.STRING, description: "A concise, one-paragraph overall summary of the paper." },
        aspects: {
            type: Type.OBJECT,
            properties: {
                problemStatement: { type: Type.STRING, description: "Summary of the research gap, motivation, and core problem." },
                methodology: { type: Type.STRING, description: "Description of the experimental setup, theoretical framework, or model architecture used." },
                keyFindings: { type: Type.ARRAY, items: verifiablePointSchema, description: "List of main results and conclusions, each supported by direct evidence." },
            },
        },
        critique: {
            type: Type.OBJECT,
            properties: {
                strengths: { type: Type.ARRAY, items: verifiablePointSchema, description: "List of potential strengths, each supported by direct evidence." },
                weaknesses: { type: Type.ARRAY, items: verifiablePointSchema, description: "List of potential weaknesses, each supported by direct evidence." },
            },
        },
        novelty: {
            type: Type.OBJECT,
            properties: {
                assessment: { type: Type.STRING, description: "A synthesized statement about the paper's apparent contribution." },
                comparison: { type: Type.STRING, description: "How the paper differs from established prior art." },
            },
        },
        futureWork: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of actionable research questions or experimental next steps." },
        glossary: { type: Type.ARRAY, items: glossaryTermSchema, description: "A list of 10-15 key technical terms and their definitions." },
        ideation: { type: Type.ARRAY, items: hypothesisSchema, description: "3-4 novel, testable research hypotheses with experimental designs." },
        references: { ...referenceSchema, description: "All extracted citations formatted in APA and BibTeX." },
        conceptMap: {
            type: Type.OBJECT,
            properties: {
                nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING } } } },
                links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, target: { type: Type.STRING }, relationship: { type: Type.STRING } } } },
            },
            description: "A concept map of the 10-15 most important core concepts in the paper."
        }
    },
};

const quizSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING, description: "The correct option text from the 'options' array." },
                },
                 required: ['question', 'options', 'answer'],
            },
        },
    },
};

const validationSchema = {
    type: Type.OBJECT,
    properties: {
        isPaper: { type: Type.BOOLEAN },
        reason: { type: Type.STRING, description: "A brief explanation for your decision." }
    },
    required: ['isPaper', 'reason']
};

const presentationSchema = {
    type: Type.OBJECT,
    properties: {
        slides: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the presentation slide (e.g., 'Introduction', 'Methodology')." },
                    content: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3-5 concise bullet points for the slide content." },
                },
                required: ['title', 'content'],
            },
        },
    },
    required: ['slides'],
};

const synthesisSchema = {
    type: Type.OBJECT,
    properties: {
        overallSynthesis: { type: Type.STRING, description: "A high-level summary that synthesizes the core ideas and findings from all provided papers into a coherent narrative." },
        commonThemes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    theme: { type: Type.STRING, description: "A key theme, concept, or methodology shared across multiple papers." },
                    papers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of document indices (e.g., 'Document 1', 'Document 3') that discuss this theme." },
                },
                required: ['theme', 'papers'],
            },
        },
        conflictingFindings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    finding: { type: Type.STRING, description: "A specific point of disagreement, contradiction, or differing results between papers." },
                    papers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of document indices (e.g., 'Document 1', 'Document 2') that present this conflicting finding." },
                },
                required: ['finding', 'papers'],
            },
        },
        conceptEvolution: { type: Type.STRING, description: "An analysis of how a key concept or methodology evolves or is treated differently across the papers, if applicable." },
    },
    required: ['overallSynthesis', 'commonThemes', 'conflictingFindings', 'conceptEvolution'],
};


const formatApiError = (error: any): string => {
    if (error.message) {
        if (error.message.includes('API key not valid')) {
            return 'An invalid API key was used. The system will rotate to the next key. If the error persists, please check all provided API keys.';
        }
        if (error.message.includes('429')) {
             return 'API rate limit exceeded. The system will rotate to the next key. Please try again in a moment.';
        }
        return error.message;
    }
    return "An unknown error occurred with the AI service.";
}

export const validateDocument = async (documentText: string): Promise<{ isPaper: boolean; reason: string }> => {
    try {
        const ai = getAi();
        const prompt = `You are a document classifier. Analyze the provided text and determine if it is a scientific or academic research paper. Consider the structure (abstract, introduction, methods, results, conclusion), language, and presence of citations. Respond ONLY with a JSON object following the specified schema.

        Document Text:
        ---
        ${documentText.substring(0, 15000)}
        ---`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: validationSchema,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error validating document:", error);
        throw new Error(`Failed to validate document: ${formatApiError(error)}`);
    }
};

export const generateQuiz = async (documentText: string): Promise<QuizQuestion[]> => {
    try {
        const ai = getAi();
        const prompt = `Based on the following scientific paper text, generate a 5-question multiple-choice quiz to test a reader's comprehension. Each question should have 4 options. Ensure the questions cover key concepts, methodologies, and findings from the paper.

        Document Text:
        ---
        ${documentText.substring(0, 32000)}
        ---
        
        Provide the quiz in the specified JSON format.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: quizSchema,
            },
        });
        const result = JSON.parse(response.text);
        return result.questions;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error(`Failed to generate quiz: ${formatApiError(error)}`);
    }
};

export const generateFullAnalysis = async (
    documentText: string,
    persona: Persona
): Promise<Omit<AnalysisResult, 'images' | 'relatedPapers'>> => {
     try {
        const ai = getAi();
        const prompt = `You are an expert AI research assistant. Based on the scientific paper below, provide a complete and comprehensive, multi-faceted analysis for this audience: ${persona}.
        
        **Tasks:**
        1.  **Essential Info:** Extract the paper's title, 3-5 key takeaways, and a one-paragraph overall summary.
        2.  **Detailed Analysis:** Analyze the problem statement, methodology, and key findings (with evidence).
        3.  **Critique & Novelty:** Identify strengths, weaknesses, assess its contribution, and compare to prior art.
        4.  **Future Work:** Suggest next steps.
        5.  **Knowledge Tools:**
            a. **Glossary:** Identify 10-15 key technical terms and provide context-specific definitions.
            b. **Ideation Lab:** Generate 3 novel, testable research hypotheses with experimental designs.
            c. **References:** Extract all citations and format them in both APA 7th and BibTeX.
            d. **Concept Map:** Generate a concept map of the 10-15 most important core concepts and their relationships.

        Scientific Paper Text:
        ---
        ${documentText}
        ---

        Provide the complete analysis in the specified JSON format.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: fullAnalysisSchema,
            },
        });
        
        const result = JSON.parse(response.text);
        chatSummary = result.overallSummary; // Set the chat summary context
        return result;

    } catch (error) {
        console.error("Error generating full analysis:", error);
        throw new Error(`Full analysis failed: ${formatApiError(error)}`);
    }
}

export const findRelatedPapers = async (
    title: string,
    summary: string
): Promise<AnalysisResult['relatedPapers']> => {
    try {
        const ai = getAi();
        const searchPrompt = `Based on the title "${title}" and summary "${summary}", find 5 highly relevant and recent scientific papers.`;
        
        const searchResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: searchPrompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const relatedPapers = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri && web.title)
            .map(({ uri, title }: { uri: string; title: string }) => ({ uri, title }));
            
        return relatedPapers;

    } catch (error) {
        console.error("Error finding related papers:", error);
        return [];
    }
};

export const regenerateSummary = async (
    documentText: string,
    persona: Persona,
    length: SummaryLength,
    depth: TechnicalDepth
): Promise<string> => {
     try {
        const ai = getAi();
        const prompt = `Based on the provided scientific paper text, generate a new summary.
        
        **Instructions:**
        1.  **Target Audience:** Write for ${persona}.
        2.  **Length:** The summary should be ${length}.
        3.  **Technical Depth:** Use ${depth}.
        
        **Document Text:**
        ---
        ${documentText.substring(0, 32000)}
        ---
        
        Now, provide only the regenerated summary as a single string.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;

    } catch (error) {
        console.error("Error regenerating summary:", error);
        throw new Error(`Failed to regenerate summary: ${formatApiError(error)}`);
    }
}

export const explainFigure = async (documentText: string, image: string): Promise<string> => {
    try {
        const ai = getAi();
        const prompt = `The user has selected a specific figure from a scientific paper. Based on the overall document context and the provided image, explain what this figure represents. Describe its components, what the data shows, and its significance to the paper's main arguments.

        Document Context (abbreviated):
        ---
        ${documentText.substring(0, 20000)}
        ---
        `;

        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: image.split(',')[1],
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt}, imagePart] },
        });

        return response.text;

    } catch (error) {
        console.error("Error explaining figure:", error);
        throw new Error(`Failed to explain figure: ${formatApiError(error)}`);
    }
};


export const getChatStream = async (history: ChatMessage[], newMessage: ChatMessage, documentText: string) => {
    const ai = getAi();
    if (!chatInstance) {
        if (!chatSummary) {
             const summaryPrompt = `Create a concise, dense, fact-based summary of the following document. It will be used as a context for a Q&A chat, so include key terms, methodologies, and findings.
             
             Document Text:
             ---
             ${documentText.substring(0, 32000)}
             ---
             `;
             const summaryResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: summaryPrompt });
             chatSummary = summaryResponse.text;
        }

        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are Prism, an AI research assistant. Your task is to answer questions about a scientific paper based on the provided summary. All your answers must be grounded in the context. Be concise, accurate, and helpful. Do not mention that you are an AI.
                
                Document Summary:
                ---
                ${chatSummary}
                ---
                `,
            }
        });
    }

    const messageParts: Part[] = [{ text: newMessage.text }];
    if (newMessage.image) {
        messageParts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: newMessage.image.split(',')[1],
            },
        });
    }

    const stream = await chatInstance.sendMessageStream({ message: messageParts });
    return stream;
};

export const resetChat = () => {
    chatInstance = null;
    chatSummary = null;
};

export const generatePresentation = async (documentText: string): Promise<PresentationSlide[]> => {
    try {
        const ai = getAi();
        const prompt = `You are an AI assistant that creates presentation drafts from scientific papers. Analyze the provided text and generate a structured, slide-by-slide presentation with a logical flow.
        
        **Instructions:**
        1.  Create slides for the following sections: Title, Introduction/Problem Statement, Methodology, Key Results (1-3 slides), Critique/Limitations, and Conclusion/Future Work.
        2.  For each slide, provide a clear title and 3-5 concise bullet points summarizing the key information.
        3.  The content should be a synthesis of the paper's information, not direct quotes.
        
        **Document Text:**
        ---
        ${documentText.substring(0, 100000)}
        ---
        
        Provide the response in the specified JSON format.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: presentationSchema,
            },
        });
        
        const result = JSON.parse(response.text);
        return result.slides;

    } catch (error) {
        console.error("Error generating presentation:", error);
        throw new Error(`Failed to generate presentation: ${formatApiError(error)}`);
    }
};

export const generateSynthesisReport = async (documentTexts: string[]): Promise<SynthesisResult> => {
    try {
        const ai = getAi();
        let prompt = `You are a meta-analysis AI expert. You have been given several research papers. Your task is to perform a comparative synthesis.

        **Instructions:**
        1.  **Overall Synthesis:** Write a cohesive summary that integrates the main ideas and findings from all documents.
        2.  **Common Themes:** Identify key themes, concepts, or methodologies that appear in multiple papers. For each theme, list which documents discuss it.
        3.  **Conflicting Findings:** Pinpoint specific areas where the papers disagree, contradict each other, or present different results. List which documents are involved in each conflict.
        4.  **Concept Evolution:** Briefly describe how a central idea is developed, refined, or challenged across the papers.

        Here are the documents:\n`;

        documentTexts.forEach((text, index) => {
            prompt += `--- Document ${index + 1} ---\n${text.substring(0, 30000)}\n\n`;
        });
        
        prompt += "Now, provide the complete synthesis report in the specified JSON format.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: synthesisSchema,
            },
        });
        
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Error generating synthesis report:", error);
        throw new Error(`Failed to generate synthesis report: ${formatApiError(error)}`);
    }
};
