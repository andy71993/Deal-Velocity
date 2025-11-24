import { ContractAnalyzer } from '@/components/contracts/ContractAnalyzer';

export default function ContractsPage() {
    return (
        <div className="p-8 h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Contract Risk Analysis</h1>
                <p className="text-gray-600">AI-powered contract review and risk assessment</p>
            </div>
            <ContractAnalyzer />
        </div>
    )
}
