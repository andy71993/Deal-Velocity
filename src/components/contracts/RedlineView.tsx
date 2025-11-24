import React from 'react';

interface RedlineViewProps {
    /** Original contract text */
    original: string;
    /** Redlined version (HTML or plain text) */
    redlined: string;
}

export const RedlineView: React.FC<RedlineViewProps> = ({ original, redlined }) => {
    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            <div className="bg-white p-4 rounded-lg shadow overflow-auto">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Original Contract</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{original}</pre>
            </div>
            <div className="bg-white p-4 rounded-lg shadow overflow-auto">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Redlined Contract</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{redlined}</pre>
            </div>
        </div>
    );
};
