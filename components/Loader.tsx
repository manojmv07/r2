import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../constants';

interface LoaderProps {
    progress: number;
}

const Loader: React.FC<LoaderProps> = ({ progress }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % LOADING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-brand-surface/80 backdrop-blur-sm border border-brand-muted rounded-lg">
            <div className="w-24 h-24 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
            <div className="w-full max-w-md">
                <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand-muted">
                        <div
                            style={{ width: `${progress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-cyan transition-all duration-500 ease-out"
                        ></div>
                    </div>
                </div>
                <p className="text-center text-lg text-brand-text font-medium">{`${Math.round(progress)}%`}</p>
            </div>
            <p className="text-center text-brand-text-muted text-sm transition-opacity duration-500">
                {LOADING_MESSAGES[messageIndex]}
            </p>
        </div>
    );
};

export default Loader;