import React from 'react';
import type { AnalysisResult } from '../types';
import { jsPDF } from 'jspdf';

// This assumes jsPDF is loaded from a CDN
declare const jspdf: any;

interface ExportModalProps {
    result: AnalysisResult;
    fileName: string;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ result, fileName, onClose }) => {

    const generateMarkdown = (): string => {
        let markdown = `# Analysis of: ${result.title}\n\n`;
        markdown += `## Key Takeaways\n`;
        result.takeaways.forEach(t => markdown += `- ${t}\n`);
        markdown += `\n## Overall Summary\n${result.overallSummary}\n\n`;
        markdown += `## Aspects\n`;
        markdown += `### Problem Statement\n${result.aspects.problemStatement}\n\n`;
        markdown += `### Methodology\n${result.aspects.methodology}\n\n`;
        markdown += `### Key Findings\n`;
        result.aspects.keyFindings.forEach(kf => {
            markdown += `- **${kf.point}**\n`;
            markdown += `  > *Evidence: "${kf.evidence}"*\n`;
        });
        markdown += `\n## Critique\n`;
        markdown += `### Strengths\n`;
        result.critique.strengths.forEach(s => {
            markdown += `- **${s.point}**\n`;
            markdown += `  > *Evidence: "${s.evidence}"*\n`;
        });
        markdown += `\n### Weaknesses\n`;
        result.critique.weaknesses.forEach(w => {
            markdown += `- **${w.point}**\n`;
            markdown += `  > *Evidence: "${w.evidence}"*\n`;
        });
        markdown += `\n## Novelty & Future Work\n`;
        markdown += `### Novelty Assessment\n${result.novelty.assessment}\n\n`;
        markdown += `*Comparison:* ${result.novelty.comparison}\n\n`;
        markdown += `### Future Work\n`;
        result.futureWork.forEach(fw => markdown += `- ${fw}\n`);
        if (result.relatedPapers.length > 0) {
             markdown += `\n## Related Papers\n`;
             result.relatedPapers.forEach(p => markdown += `- [${p.title}](${p.uri})\n`);
        }
        return markdown;
    };

    const handleExportTxt = () => {
        const markdown = generateMarkdown();
        const blob = new Blob([markdown], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName.replace(/.[^/.]+$/, "")}-analysis.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose();
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        const checkPageBreak = () => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        };

        const addWrappedText = (text: string, options: { x?: number, size?: number, style?: 'normal' | 'bold' | 'italic', isListItem?: boolean, isQuote?: boolean, isLink?: boolean }) => {
            const { x = margin, size = 10, style = 'normal', isListItem = false, isQuote = false, isLink = false } = options;
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            if(isLink) doc.setTextColor(60, 130, 220);

            const prefix = isListItem ? '- ' : '';
            const indent = isListItem ? 5 : 0;
            const quoteIndent = isQuote ? 5 : 0;
            
            const splitText = doc.splitTextToSize(prefix + text, pageWidth - margin * 2 - indent - quoteIndent);
            
            splitText.forEach((line: string) => {
                checkPageBreak();
                doc.text(line, x + indent + quoteIndent, y);
                y += 6;
            });
            if(isLink) doc.setTextColor(0, 0, 0); // Reset color
        };
        
        addWrappedText(result.title, { size: 18, style: 'bold' });
        y += 5;
        
        addWrappedText("Key Takeaways", { size: 14, style: 'bold' });
        y += 2;
        result.takeaways.forEach(t => addWrappedText(t, { isListItem: true }));
        y += 5;

        addWrappedText("Overall Summary", { size: 14, style: 'bold' });
        y += 2;
        addWrappedText(result.overallSummary, {});
        y+=5;
        
        addWrappedText("Aspects", { size: 14, style: 'bold' });
        y += 2;
        addWrappedText("Problem Statement", { size: 12, style: 'bold' });
        y += 2;
        addWrappedText(result.aspects.problemStatement, {});
        y+=5;
        addWrappedText("Methodology", { size: 12, style: 'bold' });
        y += 2;
        addWrappedText(result.aspects.methodology, {});
        y+=5;
        addWrappedText("Key Findings", { size: 12, style: 'bold' });
        y += 2;
        result.aspects.keyFindings.forEach(kf => {
             addWrappedText(kf.point, { isListItem: true, style: 'bold' });
             addWrappedText(`Evidence: "${kf.evidence}"`, { isQuote: true, style: 'italic', size: 9 });
             y+=2;
        });
        y+=5;

        addWrappedText("Critique", { size: 14, style: 'bold' });
        y += 2;
        addWrappedText("Strengths", { size: 12, style: 'bold' });
        y += 2;
        result.critique.strengths.forEach(s => {
             addWrappedText(s.point, { isListItem: true, style: 'bold' });
             addWrappedText(`Evidence: "${s.evidence}"`, { isQuote: true, style: 'italic', size: 9 });
             y+=2;
        });
        y+=5;
        addWrappedText("Weaknesses", { size: 12, style: 'bold' });
        y += 2;
        result.critique.weaknesses.forEach(w => {
             addWrappedText(w.point, { isListItem: true, style: 'bold' });
             addWrappedText(`Evidence: "${w.evidence}"`, { isQuote: true, style: 'italic', size: 9 });
             y+=2;
        });
        y+=5;

        checkPageBreak();
        addWrappedText("Novelty & Future Work", { size: 14, style: 'bold' });
        y += 2;
        addWrappedText("Novelty Assessment", { size: 12, style: 'bold' });
        y += 2;
        addWrappedText(result.novelty.assessment, {});
        addWrappedText(`Comparison: ${result.novelty.comparison}`, { style: 'italic', size: 9 });
        y+=5;

        checkPageBreak();
        addWrappedText("Future Work", { size: 12, style: 'bold' });
        y += 2;
        result.futureWork.forEach(fw => addWrappedText(fw, { isListItem: true }));
        y+=5;

        if (result.relatedPapers.length > 0) {
            checkPageBreak();
            addWrappedText("Related Papers", { size: 14, style: 'bold' });
            y += 2;
            result.relatedPapers.forEach(p => {
                addWrappedText(`${p.title} (${p.uri})`, { isListItem: true, isLink: true, size: 9 });
                y+=2;
            });
        }
        
        doc.save(`${fileName.replace(/.[^/.]+$/, "")}-analysis.pdf`);
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-surface border border-brand-muted rounded-lg p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-brand-text mb-6">Choose Export Format</h2>
                <div className="flex flex-col space-y-4">
                    <button onClick={handleExportPdf} className="bg-brand-cyan text-brand-bg font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105">
                        Export as PDF
                    </button>
                    <button onClick={handleExportTxt} className="bg-brand-muted text-brand-text font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 hover:bg-brand-subtle">
                        Export as Markdown / TXT
                    </button>
                </div>
                 <button onClick={onClose} className="mt-6 text-sm text-brand-subtle hover:text-brand-text">Cancel</button>
            </div>
        </div>
    );
};

export default ExportModal;