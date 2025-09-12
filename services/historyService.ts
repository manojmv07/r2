import type { HistoryItem } from '../types';

const HISTORY_KEY = 'prism-analysis-history';
const MAX_HISTORY_ITEMS = 10;

export const getHistory = (): HistoryItem[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        if (historyJson) {
            return JSON.parse(historyJson);
        }
    } catch (error) {
        console.error("Failed to read history from localStorage:", error);
        localStorage.removeItem(HISTORY_KEY); // Clear corrupted data
    }
    return [];
};

export const saveAnalysis = (newItem: HistoryItem): void => {
    try {
        let history = getHistory();
        // Remove any existing item with the same title to avoid duplicates
        history = history.filter(item => item.title !== newItem.title);
        // Add the new item to the beginning
        history.unshift(newItem);
        // Trim the history to the maximum allowed length
        const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
        console.error("Failed to save analysis to localStorage:", error);
    }
};