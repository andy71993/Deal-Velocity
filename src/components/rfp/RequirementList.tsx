'use client';

import { RFPRequirement } from '@/types/rfp';

interface RequirementListProps {
    requirements: RFPRequirement[];
    onSelect: (req: RFPRequirement) => void;
    selectedId?: string;
}

export function RequirementList({ requirements, onSelect, selectedId }: RequirementListProps) {
    return (
        <div className="space-y-2">
            {requirements.map((req) => (
                <div
                    key={req.id}
                    onClick={() => onSelect(req)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedId === req.id
                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${req.priority === 'mandatory' ? 'bg-red-100 text-red-700' :
                                req.priority === 'desirable' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                            }`}>
                            {req.priority}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">{req.req_type}</span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-3">{req.req_text}</p>
                    {req.page_ref && (
                        <p className="text-xs text-gray-400 mt-1">Page {req.page_ref}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
