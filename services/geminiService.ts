
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { AnalysisResult, ChatMessage, Persona, SummaryLength, TechnicalDepth, QuizQuestion } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    // In a real app, you might want to throw an error or handle this more gracefully
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            return 'An invalid API key was provided. Please ensure your API_KEY is set correctly.';
        }
        if (error.message.includes('429')) {
             return 'API rate limit exceeded. Please try again in a moment.';
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

export const generateInitialAnalysis = async (
    documentText: string, 
    images: string[], 
    persona: Persona
): Promise<AnalysisResult> => {
    try {
        const prompt = `You are an expert AI research assistant. Your task is to perform a comprehensive analysis of the following scientific paper and generate a report in the specified JSON format. The analysis should be tailored for this audience: ${persona}.

        **Crucially, start by identifying the 3-5 most important "Key Takeaways" from the entire paper. These should be high-level, executive summary points.**

        Based on the full text of the paper provided below, generate a complete analysis. Ground all claims in evidence from the text.

        Scientific Paper Text:
        ---
        ${documentText.substring(0, 500000)} 
        ---

        Provide the final comprehensive analysis in the specified JSON format.`;

        const mainAnalysisResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
            },
        });
        
        const mainResult = JSON.parse(mainAnalysisResponse.text);

        // Save summary for chat
        chatSummary = mainResult.overallSummary;

        // --- Google Search Step ---
        const searchPrompt = `Based on the title "${mainResult.title}" and summary "${mainResult.overallSummary}", find 5 highly relevant and recent scientific papers.`;
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
