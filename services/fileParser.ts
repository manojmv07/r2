// This assumes pdf.js and mammoth.js are loaded from a CDN in index.html
declare const pdfjsLib: any;
declare const mammoth: any;

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const parseFile = async (file: File): Promise<{ text: string; images: string[] }> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return parsePdf(file);
        case 'docx':
            const docxText = await parseDocx(file);
            return { text: docxText, images: [] };
        case 'txt':
            const txtText = await parseTxt(file);
            return { text: txtText, images: [] };
        default:
            throw new Error(`Unsupported file type: .${extension}`);
    }
};

const parsePdf = (file: File): Promise<{ text: string; images: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error('Failed to read PDF file.'));
            }
            try {
                const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
                let textContent = '';
                const images: string[] = [];
                const MAX_IMAGES = 5; // Limit to avoid performance issues

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    textContent += text.items.map((item: any) => item.str).join(' ') + '\n';
                
                    if (images.length < MAX_IMAGES) {
                        const viewport = page.getViewport({ scale: 1.0 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        if (context) {
                            await page.render({ canvasContext: context, viewport: viewport }).promise;
                            images.push(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG for smaller size
                        }
                    }
                }
                resolve({ text: textContent, images });
            } catch (error) {
                console.error('Error parsing PDF:', error);
                reject(new Error('Could not parse the PDF file. It might be corrupted or protected.'));
            }
        };
        reader.onerror = () => reject(new Error('Error reading the file.'));
        reader.readAsArrayBuffer(file);
    });
};

const parseDocx = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error('Failed to read DOCX file.'));
            }
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: event.target.result as ArrayBuffer });
                resolve(result.value);
            } catch (error) {
                 console.error('Error parsing DOCX:', error);
                reject(new Error('Could not parse the DOCX file.'));
            }
        };
        reader.onerror = () => reject(new Error('Error reading the file.'));
        reader.readAsArrayBuffer(file);
    });
};

const parseTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                resolve(event.target.result);
            } else {
                reject(new Error('Failed to read text file.'));
            }
        };
        reader.onerror = () => reject(new Error('Error reading the file.'));
        reader.readAsText(file);
    });
};