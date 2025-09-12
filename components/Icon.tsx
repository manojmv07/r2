
import React from 'react';

// FIX: Export IconProps to be used in other components
export interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: 'upload' | 'arrow-right' | 'summary' | 'chat' | 'critique' | 'lightbulb' | 'reset' | 'send' | 'strength' | 'weakness' | 'future' | 'novelty' | 'link' | 'export' | 'regenerate' | 'takeaways' | 'concept-map' | 'history' | 'presentation' | 'copy' | 'check-circle' | 'quiz' | 'brain-circuit' | 'search' | 'synthesis' | 'flask' | 'bibliography' | 'academic-cap' | 'beaker' | 'briefcase' | 'chevron-down' | 'attach-image' | 'close';
    className?: string;
}

const ICONS: Record<IconProps['name'], JSX.Element> = {
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />,
    'arrow-right': <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />,
    summary: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />,
    chat: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.423l-4.503 1.213a.75.75 0 01-.92-.921l1.213-4.503A9.76 9.76 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />,
    critique: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    lightbulb: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.649.75.75 0 00-1.5 0A4.502 4.502 0 0112 12.75v-2.25M12 12.75a4.5 4.5 0 00-4.5 4.5v1.5a4.5 4.5 0 009 0v-1.5a4.5 4.5 0 00-4.5-4.5z" />,
    reset: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.18-3.182l-3.182-3.182a8.25 8.25 0 00-11.664 0l-3.18 3.185" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
    strength: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    weakness: <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    future: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    novelty: <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.797zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    link: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />,
    export: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />,
    regenerate: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.18-3.182l-3.182-3.182a8.25 8.25 0 00-11.664 0l-3.18 3.185" />,
    takeaways: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
    'concept-map': <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15M9 9l6 6m-6 0l6-6" />,
    history: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    presentation: <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125V6.375m1.125 13.125A1.125 1.125 0 004.5 18.375h15A1.125 1.125 0 0020.625 19.5m-17.25 0h17.25m-14.25-9l-3-3m0 0l3-3m-3 3h12.75" />,
    copy: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V9.375a2.25 2.25 0 00-2.25-2.25H9.375m0 0a2.25 2.25 0 00-2.25 2.25v7.5" />,
    'check-circle': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    quiz: <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25c-.621 0-1.125.504-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125v-3.375c0-.621-.504-1.125-1.125-1.125h-1.5z" />,
    'brain-circuit': <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75h-.375a3.375 3.375 0 00-3.375 3.375v.375m3.75 0V6.75m3.75 0v-1.875a3.375 3.375 0 00-3.375-3.375h-.375m-1.5 3.75h.375a3.375 3.375 0 013.375 3.375v.375m0 0V12m0 6v-1.875a3.375 3.375 0 00-3.375-3.375h-.375m-1.5 3.75h.375a3.375 3.375 0 013.375 3.375v.375m-3.75 0V18m-3.75 0v1.875a3.375 3.375 0 003.375 3.375h.375m1.5-3.75h-.375a3.375 3.375 0 01-3.375-3.375v-.375m0 0V12m0-6v1.875a3.375 3.375 0 003.375 3.375h.375m1.5-3.75h-.375a3.375 3.375 0 01-3.375-3.375v-.375m3.75 0V6" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
    synthesis: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 1.5L1.5 3.75m0 0L3.75 6m-2.25-2.25h15m5.25 16.5l2.25-2.25m0 0L20.25 18m2.25 2.25h-15M3.75 10.5l1.5 1.5 1.5-1.5m-3 0h3.75m10.5 0l-1.5 1.5-1.5-1.5m3 0h-3.75" />,
    flask: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />,
    bibliography: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
    'academic-cap': <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-3.232-1.78a59.902 59.902 0 011.723-3.234l3.232 1.78A50.57 50.57 0 0012 5.253a50.57 50.57 0 00-6.268-1.135z" />,
    beaker: <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.597.484-1.087 1.088-1.087h.003a1.087 1.087 0 011.087 1.087v2.025M16.5 6.087c0-.597.484-1.087 1.088-1.087h.003a1.087 1.087 0 011.087 1.087v2.025M5.625 9.375v3.75c0 .597.484 1.088 1.088 1.088h8.574c.604 0 1.088-.49 1.088-1.088v-3.75M3.375 9.375h17.25M3.375 9.375c0-1.036.84-1.875 1.875-1.875h13.5c1.036 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875h-13.5c-1.036 0-1.875-.84-1.875-1.875v-9.75z" />,
    briefcase: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25L12 18.75 3.75 14.25A3 3 0 012.25 12v-7.5A3 3 0 015.25 2.25h13.5A3 3 0 0121.75 4.5v7.5a3 3 0 01-1.5 2.625zM12 18.75V21.75M8.25 15L12 16.5l3.75-1.5M12 12v3.75" />,
    'chevron-down': <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />,
    'attach-image': <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
};

const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6', ...props }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
            {...props}
        >
            {ICONS[name]}
        </svg>
    );
};

export default Icon;
