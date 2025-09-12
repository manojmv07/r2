import { GoogleGenAI, Type, Chat } from "@google/genai";
import { API_KEYS } from './apiKeys';
import type { AnalysisResult, ChatMessage, Persona, SummaryLength, TechnicalDepth, QuizQuestion } from '../types';

if (!API_KEYS || API_KEYS.length === 0 || API_KEYS[0] === "YOUR_API_KEY_HERE") {
    console.error("API_KEY environment variable not set.");
    // In a real app, you might want to throw an error or handle this more gracefully
}

// --- API Key Rotation Setup ---
const aiInstances = API_KEYS.map(apiKey => new GoogleGenAI({ apiKey }));
let currentApiIndex = 0;

const getAiInstance = () => {
    if (aiInstances.length === 0) {
        throw new Error("No API keys provided in apiKeys.ts");
    }
    const instance = aiInstances[currentApiIndex];
    currentApiIndex = (currentApiIndex + 1) % aiInstances.length;
    return instance;
};
// --- End of API Key Rotation Setup ---


let chatInstance: Chat | null = null;
let chatSummary: string | null = null;

const verifiablePointSchema = {
    type: Type.OBJECT,
    properties: {
        point: { type: Type.STRING, description: "The analytical point, finding, strength, or weakness." },
        evidence: { type: Type.STRING, description: "A direct, verbatim quote from the source text that supports the point." },
    },
    required: ['point', 'evidence'],
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The title of the research paper." },
        takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of the 3-5 most critical, high-level key takeaways from the paper. Each takeaway should be a single, concise sentence." },
        overallSummary: { type: Type.STRING, description: "A concise, one-paragraph overall summary of the paper." },
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

const formatApiError = (error: any): string => {
    if (error.message) {
        if (error.message.includes('API key not valid')) {
            return 'An invalid API key was provided. Please check your keys in apiKeys.ts.';
        }
        if (error.message.includes('429')) {
             return 'API rate limit exceeded, even with key rotation. Please try again in a moment or add more keys.';
        }
        return error.message;
    }
    return "An unknown error occurred with the AI service.";
}


export const generateQuiz = async (documentText: string): Promise<QuizQuestion[]> => {
    try {
        const prompt = `Based on the following scientific paper text, generate a 5-question multiple-choice quiz to test a reader's comprehension. Each question should have 4 options. Ensure the questions cover key concepts, methodologies, and findings from the paper.

        Document Text:
        ---
        ${documentText.substring(0, 10000)}
        ---
        
        Provide the quiz in the specified JSON format.`;

        const response = await getAiInstance().models.generateContent({
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

const chunkText = (text: string, chunkSize = 40000, overlap = 1000) => {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.substring(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    return chunks;
};

export const generateInitialAnalysis = async (
    documentText: string, 
    images: string[], 
    persona: Persona,
    onProgress: (progress: number) => void
): Promise<AnalysisResult> => {
    try {
        // --- MAP STEP ---
        const textChunks = chunkText(documentText);
        const mapPrompt = `You are part of a multi-stage analysis pipeline. Analyze this chunk of a larger scientific paper. Extract and list in plain text the key claims, methodology details (including descriptions of any figures or tables mentioned), results, and potential strengths or weaknesses mentioned ONLY within this text. Be concise.

        Text Chunk:
        ---
        `;
        
        const chunkPromises = textChunks.map((chunk, index) => {
             return getAiInstance().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `${mapPrompt}${chunk}`,
            }).then(response => {
                onProgress((index + 1) / textChunks.length * 50); // Progress for map step
                return `--- Analysis of Chunk ${index + 1} ---\n${response.text}\n\n`;
            });
        });

        const chunkAnalyses = await Promise.all(chunkPromises);
        onProgress(60); // Changed from 50 to 60 to show immediate progress into reduce step

        // --- REDUCE STEP ---
        const reducePrompt = `You are the final stage of an analysis pipeline. You have received preliminary analyses from different chunks of a scientific paper. Your task is to synthesize these fragmented analyses into a single, cohesive, and comprehensive report in the specified JSON format. Resolve redundancies, create a flowing narrative, and ground all claims in the provided evidence. The analysis is for a specific audience: ${persona}.

        **Crucially, start by identifying the 3-5 most important "Key Takeaways" from the entire paper. These should be high-level, executive summary points.**

        Fragmented Analyses from Chunks:
        ---
        ${chunkAnalyses.join('')}
        ---

        Based *only* on the combined textual information provided above, provide the final comprehensive analysis in the specified JSON format. Your analysis should incorporate details about figures and tables as they are described in the fragmented text.`;
        
        const mainAnalysisResponse = await getAiInstance().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: reducePrompt, // CRITICAL FIX: Removed images from this final, heavy request to prevent timeouts.
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
            },
        });
        onProgress(80);
        
        const mainResult = JSON.parse(mainAnalysisResponse.text);

        // Save summary for chat
        chatSummary = mainResult.overallSummary;

        // --- Google Search Step ---
        const searchPrompt = `Based on the title "${mainResult.title}" and summary "${mainResult.overallSummary}", find 5 highly relevant and recent scientific papers.`;
        const searchResponse = await getAiInstance().models.generateContent({
            model: "gemini-2.5-flash",
            contents: searchPrompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        onProgress(90);
        
        const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const relatedPapers = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri && web.title)
            .map(({ uri, title }: { uri: string; title: string }) => ({ uri, title }));

        return { ...mainResult, relatedPapers } as AnalysisResult;

    } catch (error) {
        console.error("Error generating initial analysis:", error);
        throw new Error(`Analysis failed: ${formatApiError(error)}`);
    }
};


export const regenerateSummary = async (
    documentText: string,
    persona: Persona,
    length: SummaryLength,
    depth: TechnicalDepth
): Promise<string> => {
     try {
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
        
        const response = await getAiInstance().models.generateContent({
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

        const response = await getAiInstance().models.generateContent({
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
    if (!chatInstance) {
        // One-time generation of a summary for chat context if not already done
        if (!chatSummary) {
             const summaryPrompt = `Create a concise, dense, fact-based summary of the following document. It will be used as a context for a Q&A chat, so include key terms, methodologies, and findings.
             
             Document Text:
             ---
             ${documentText.substring(0, 32000)}
             ---
             `;
             const summaryResponse = await getAiInstance().models.generateContent({ model: 'gemini-2.5-flash', contents: summaryPrompt });
             chatSummary = summaryResponse.text;
        }

        chatInstance = getAiInstance().chats.create({
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