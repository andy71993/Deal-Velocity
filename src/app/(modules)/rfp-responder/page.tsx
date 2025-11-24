import { RFPResponder } from '@/components/rfp/RFPResponder';

export default function RFPResponderPage() {
    return (
        <div className="p-8 h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">RFP Responder</h1>
                <p className="text-gray-600">AI-powered proposal generation and evaluation simulation</p>
            </div>
            <RFPResponder />
        </div>
    )
}
