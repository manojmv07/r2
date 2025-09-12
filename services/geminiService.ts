
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { AnalysisResult, ChatMessage, Persona, SummaryLength, TechnicalDepth, QuizQuestion } from '../types';

// Hardcoded API keys with a round-robin rotation to distribute requests.
const API_KEYS = [
    'AIzaSyAR2BgYjzwHRuzwmXSU_dFeekix9uhBBTA',
    'AIzaSyAR2BgYjzwHRuzwmXSU_dFeekix9uhBBTA'
];
let currentKeyIndex = 0;

const getNextApiKey = (): string => {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
};

let chatInstance: Chat | null = null;
let chatSummary: string | null = null;

// The getAi function will now create a new instance with the next key in rotation.
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

const initialContentSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The title of the research paper." },
        takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of the 3-5 most critical, high-level key takeaways from the paper. Each takeaway should be a single, concise sentence." },
        overallSummary: { type: Type.STRING, description: "A concise, one-paragraph overall summary of the paper." },
    },
};

const detailedContentSchema = {
    type: Type.OBJECT,
    properties: {
        aspects: {
            type: Type.OBJECT,
            properties: {
                problemStatement: { type: Type.STRING, description: "Summary of the research gap, motivation, and core problem." },
                methodology: { type: Type.STRING, description: "Description of the experimental setup, theoretical framework, or model architecture used, referencing figures if applicable." },
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
        futureWork: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of actionable research questions or experimental next steps based on the paper's limitations." },
    },
}

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


const formatApiError = (error: any): string => {
    if (error.message) {
        if (error.message.includes('API key not valid')) {
            return 'The provided API key is invalid. Please check the hardcoded keys.';
        }
        if (error.message.includes('429')) {
             return 'API rate limit exceeded. Please try again in a moment.';
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

export const generateInitialContent = async (
    documentText: string,
    persona: Persona
): Promise<Pick<AnalysisResult, 'title' | 'takeaways' | 'overallSummary'>> => {
    try {
        const ai = getAi();
        const prompt = `You are an expert AI research assistant. Your task is to quickly analyze the following scientific paper and extract the most essential information for this audience: ${persona}.
        
        **Tasks:**
        1. Identify the paper's full **title**.
        2. Extract the 3-5 most critical, high-level **key takeaways**.
        3. Write a concise, one-paragraph **overall summary**.

        Scientific Paper Text:
        ---
        ${documentText.substring(0, 100000)}
        ---

        Provide the response in the specified JSON format.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: initialContentSchema,
            },
        });
        const result = JSON.parse(response.text);
        chatSummary = result.overallSummary; // Save summary for chat
        return result;

    } catch (error) {
        console.error("Error generating initial content:", error);
        throw new Error(`Initial analysis failed: ${formatApiError(error)}`);
    }
};

export const generateDetailedContent = async (
    documentText: string,
    persona: Persona
): Promise<Omit<AnalysisResult, 'title'|'takeaways'|'overallSummary'|'images'|'relatedPapers'>> => {
     try {
        const ai = getAi();
        const prompt = `You are an expert AI research assistant continuing an analysis. Based on the scientific paper below, provide a detailed breakdown for this audience: ${persona}.
        
        **Tasks:**
        1.  **Aspects:** Analyze the problem statement, methodology, and key findings (with evidence).
        2.  **Critique:** Identify the paper's strengths and weaknesses (with evidence).
        3.  **Novelty:** Assess its contribution and compare it to prior art.
        4.  **Future Work:** Suggest next steps.

        Scientific Paper Text:
        ---
        ${documentText.substring(0, 500000)}
        ---

        Provide the detailed analysis in the specified JSON format.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: detailedContentSchema,
            },
        });
        
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Error generating detailed content:", error);
        throw new Error(`Detailed analysis failed: ${formatApiError(error)}`);
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
        // This is a non-critical enhancement, so we don't throw.
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
            contents: [ {text: prompt}, imagePart ],
        });

        return response.text;

    } catch (error) {
        console.error("Error explaining figure:", error);
        throw new Error(`Failed to explain figure: ${formatApiError(error)}`);
    }
};


export const getChatStream = async (history: ChatMessage[], newMessage: string, documentText: string) => {
    const ai = getAi();
    if (!chatInstance) {
        // One-time generation of a summary for chat context if not already done
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

    const stream = await chatInstance.sendMessageStream({ message: newMessage });
    return stream;
};

export const resetChat = () => {
    chatInstance = null;
    chatSummary = null;
};
