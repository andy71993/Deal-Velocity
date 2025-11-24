'use client';

interface RiskMeterProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

export function RiskMeter({ score, size = 'md' }: RiskMeterProps) {
    const getColor = (score: number) => {
        if (score < 30) return 'text-green-600';
        if (score < 60) return 'text-yellow-600';
        if (score < 80) return 'text-orange-600';
        return 'text-red-600';
    };

    const getCircleSize = () => {
        switch (size) {
            case 'sm': return { w: 8, h: 8, r: 20, sw: 3, text: 'text-xs' };
            case 'lg': return { w: 24, h: 24, r: 48, sw: 6, text: 'text-xl' };
            default: return { w: 10, h: 10, r: 24, sw: 3, text: 'text-xs' };
        }
    };

    const { w, h, r, sw, text } = getCircleSize();
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className={`flex items-center justify-center relative w-${w} h-${h}`}>
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 64 64">
                {/* Background circle */}
                <circle
                    cx="32"
                    cy="32"
                    r={r}
                    stroke="currentColor"
                    strokeWidth={sw}
                    fill="transparent"
                    className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                    cx="32"
                    cy="32"
                    r={r}
                    stroke="currentColor"
                    strokeWidth={sw}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={`${getColor(score)} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                />
            </svg>
            <span className={`absolute font-bold ${getColor(score)} ${text}`}>
                {score}
            </span>
        </div>
    );
}
