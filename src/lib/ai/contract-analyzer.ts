import OpenAI from 'openai';
import { PROMPTS } from './prompts';

export interface ClauseAnalysis {
    clause_text: string;
    clause_type: string;
    risk_score: number;
    risk_category: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    risk_description: string;
    impact_description: string;
    suggested_alternative: string;
    reasoning: string;
    redline_status?: 'pending' | 'accepted' | 'rejected';
}

export class ContractAnalyzer {
    private openai: OpenAI;
    private model: string;

    constructor(apiKey: string, model?: string) {
        this.openai = new OpenAI({ apiKey });
        // Default to gpt-4o-mini for cost savings during development
        // Set AI_MODEL=gpt-4-turbo-preview in production
        this.model = model || process.env.AI_MODEL || 'gpt-4o-mini';
    }

    async analyzeContract(contractText: string): Promise<{
        clauses: ClauseAnalysis[];
        overall_risk_score: number;
        processing_time: number;
    }> {
        const startTime = Date.now();

        // Step 1: Extract clauses using GPT-4
        const extractedClauses = await this.extractClauses(contractText);

        // Step 2: Quick risk pre-screening (single API call)
        const prescreenedClauses = await this.prescreenClauses(extractedClauses);

        // Step 3: Only analyze medium/high/critical risk clauses in detail
        const clausesToAnalyze = prescreenedClauses.filter(
            c => c.preliminaryRisk >= 40 // Skip low-risk clauses
        );

        // Step 4: Detailed analysis for flagged clauses
        const analyses: ClauseAnalysis[] = [];
        const batchSize = 5;

        for (let i = 0; i < clausesToAnalyze.length; i += batchSize) {
            const batch = clausesToAnalyze.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(clause => this.analyzeClause(clause.text, clause.type))
            );
            analyses.push(...batchResults);
        }

        // Step 5: Calculate overall risk score
        const overall_risk_score = this.calculateOverallRisk(analyses);

        return {
            clauses: analyses,
            overall_risk_score,
            processing_time: Date.now() - startTime
        };
    }

    private async extractClauses(text: string): Promise<{ text: string; type: string }[]> {
        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: PROMPTS.EXTRACT_CLAUSES },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" }
        });

        try {
            const content = response.choices[0].message.content;
            if (!content) return [];
            const result = JSON.parse(content);
            // Expecting { "clauses": [{ "text": "...", "type": "..." }] }
            return result.clauses || [];
        } catch (e) {
            console.error("Error parsing clauses:", e);
            return [];
        }
    }

    private async prescreenClauses(clauses: { text: string; type: string }[]): Promise<{ text: string; type: string; preliminaryRisk: number }[]> {
        // Single API call to quickly score all clauses for risk
        const prescreenPrompt = `You are a contract risk screener. For each clause below, provide a quick preliminary risk score from 0-100.
Focus on identifying: unlimited liability, broad indemnification, unfavorable payment terms, automatic renewals, non-compete clauses, and unusual termination rights.

Return ONLY a JSON array of objects with "index" (0-based) and "risk_score" (0-100).

Clauses:
${clauses.map((c, i) => `[${i}] Type: ${c.type}\nText: ${(c.text || '').substring(0, 200)}...`).join('\n\n')}`;

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: "You are a helpful assistant designed to output JSON." },
                { role: "user", content: prescreenPrompt }
            ],
            response_format: { type: "json_object" }
        });

        try {
            const content = response.choices[0].message.content;
            if (!content) return clauses.map(c => ({ ...c, preliminaryRisk: 50 }));

            const result = JSON.parse(content);
            const scores = result.scores || [];

            return clauses.map((clause, idx) => {
                const scoreObj = scores.find((s: any) => s.index === idx);
                return {
                    ...clause,
                    preliminaryRisk: scoreObj?.risk_score || 50
                };
            });
        } catch (e) {
            console.error("Error prescreening clauses:", e);
            // On error, analyze everything (fail-safe)
            return clauses.map(c => ({ ...c, preliminaryRisk: 50 }));
        }
    }

    private async analyzeClause(clauseText: string, clauseType: string): Promise<ClauseAnalysis> {
        const prompt = PROMPTS.ANALYZE_RISK
            .replace('{clause_type}', clauseType)
            .replace('{clause_text}', clauseText);

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: "You are a helpful assistant designed to output JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        try {
            const content = response.choices[0].message.content;
            if (!content) throw new Error("No content in response");

            const result = JSON.parse(content);

            return {
                clause_text: clauseText,
                clause_type: clauseType,
                risk_score: result.risk_score,
                risk_category: result.risk_category,
                risk_level: result.risk_level,
                risk_description: result.risk_description,
                impact_description: result.impact_description,
                suggested_alternative: result.suggested_alternative,
                reasoning: result.reasoning
            };
        } catch (e) {
            console.error("Error analyzing clause:", e);
            // Return a fallback analysis
            return {
                clause_text: clauseText,
                clause_type: clauseType,
                risk_score: 0,
                risk_category: "Unknown",
                risk_level: "low",
                risk_description: "Analysis failed",
                impact_description: "Unknown",
                suggested_alternative: clauseText,
                reasoning: "Error during analysis"
            };
        }
    }

    private calculateOverallRisk(analyses: ClauseAnalysis[]): number {
        if (analyses.length === 0) return 0;

        // Weighted average: Critical (4x), High (3x), Medium (2x), Low (1x)
        let totalScore = 0;
        let totalWeight = 0;

        analyses.forEach(analysis => {
            let weight = 1;
            if (analysis.risk_level === 'critical') weight = 4;
            else if (analysis.risk_level === 'high') weight = 3;
            else if (analysis.risk_level === 'medium') weight = 2;

            totalScore += analysis.risk_score * weight;
            totalWeight += weight;
        });

        return Math.round(totalScore / totalWeight);
    }
}
