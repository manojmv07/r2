
import { toast } from 'react-hot-toast';

export const getApiKey = (): string | null => {
    try {
        return sessionStorage.getItem('gemini-api-key');
    } catch (e) {
        console.error("Could not access session storage:", e);
        return null;
    }
};

export const setApiKey = (key: string): void => {
    try {
        sessionStorage.setItem('gemini-api-key', key);
    } catch (e) {
        console.error("Could not access session storage:", e);
        toast.error("Could not save API key. Your browser might be in private mode or has storage disabled.")
    }
};