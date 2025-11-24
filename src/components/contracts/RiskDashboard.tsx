'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ClauseAnalysis } from '@/lib/ai/contract-analyzer';
import { RiskMeter } from './RiskMeter';

interface RiskDashboardProps {
    analysis: {
        clauses: ClauseAnalysis[];
        overall_risk_score: number;
    };
}

export function RiskDashboard({ analysis }: RiskDashboardProps) {
    const riskCounts = {
        critical: analysis.clauses.filter(c => c.risk_level === 'critical').length,
        high: analysis.clauses.filter(c => c.risk_level === 'high').length,
        medium: analysis.clauses.filter(c => c.risk_level === 'medium').length,
        low: analysis.clauses.filter(c => c.risk_level === 'low').length,
    };

    const chartData = [
        { name: 'Critical', count: riskCounts.critical, color: '#ef4444' },
        { name: 'High', count: riskCounts.high, color: '#f97316' },
        { name: 'Medium', count: riskCounts.medium, color: '#eab308' },
        { name: 'Low', count: riskCounts.low, color: '#22c55e' },
    ];

    const topRisks = [...analysis.clauses]
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Overall Score Card with Donut Chart */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Risk Profile</h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {/* Donut Chart */}
                        <div className="relative w-32 h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={2}
                                        dataKey="count"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Score */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-gray-900">{analysis.overall_risk_score}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Overall Risk Level</p>
                            <p className={`text-2xl font-bold ${analysis.overall_risk_score >= 80 ? 'text-red-600' :
                                    analysis.overall_risk_score >= 60 ? 'text-orange-600' :
                                        analysis.overall_risk_score >= 30 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                {analysis.overall_risk_score >= 80 ? 'Critical' :
                                    analysis.overall_risk_score >= 60 ? 'High' :
                                        analysis.overall_risk_score >= 30 ? 'Medium' : 'Low'}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-right">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Clauses</p>
                            <p className="text-xl font-bold text-gray-900">{analysis.clauses.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Issues</p>
                            <p className="text-xl font-bold text-gray-900">
                                {riskCounts.critical + riskCounts.high + riskCounts.medium}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Distribution Chart */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h2>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Risks List */}
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Risks Identified</h2>
                <div className="space-y-3">
                    {topRisks.map((clause, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                                <div>
                                    <p className="font-medium text-gray-900">{clause.clause_type}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{clause.clause_text}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${clause.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                                    clause.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                                        clause.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>
                                    {clause.risk_level.toUpperCase()}
                                </span>
                                <span className="text-sm font-bold text-gray-700">{clause.risk_score}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
