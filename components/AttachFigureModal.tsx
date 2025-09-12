
import React from 'react';
import Icon from './Icon';

interface AttachFigureModalProps {
    figures: string[]; // array of base64 data URLs
    onClose: () => void;
    onFigureSelect: (imageBase64: string) => void;
}

const AttachFigureModal: React.FC<AttachFigureModalProps> = ({ figures, onClose, onFigureSelect }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-brand-surface border border-brand-muted rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col gap-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <Icon name="attach-image" className="w-6 h-6 text-brand-cyan" />
                        <h2 className="text-xl font-bold text-brand-text">Attach a Figure to Your Question</h2>
                    </div>
                    <button onClick={onClose} className="text-2xl text-brand-subtle hover:text-brand-text">&times;</button>
                </div>
                <div className="overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {figures.map((imgSrc, i) => (
                            <div 
                                key={i} 
                                className="group relative cursor-pointer aspect-square" 
                                onClick={() => onFigureSelect(imgSrc)}
                            >
                                <img src={imgSrc} alt={`Figure ${i + 1}`} className="rounded-md border-2 border-brand-muted group-hover:border-brand-cyan transition-colors w-full h-full object-contain bg-brand-bg" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white font-bold text-center">Select Figure {i+1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttachFigureModal;
