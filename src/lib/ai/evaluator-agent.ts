import OpenAI from 'openai';
import { PROMPTS } from './prompts';
import { EvaluatorSimulation } from '@/types/rfp';

export class EvaluatorAgent {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    async simulateEvaluation(
        requirement: string,
        proposalText: string,
        persona: EvaluatorSimulation['evaluator_persona']
    ): Promise<Omit<EvaluatorSimulation, 'id' | 'proposal_section_id' | 'created_at'>> {

        const personaDesc = this.getPersonaDescription(persona);

        const prompt = PROMPTS.EVALUATOR_SIMULATION
            .replace('{persona}', personaDesc)
            .replace('{requirement}', requirement)
            .replace('{proposal_text}', proposalText);

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: "You are a helpful assistant designed to output JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error("No content");

            const result = JSON.parse(content);

            return {
                simulated_score: result.score,
                evaluator_persona: persona,
                feedback: result.feedback,
                improvement_suggestions: result.improvements
            };
        } catch (error) {
            console.error("Error in evaluator simulation:", error);
            throw error;
        }
    }

    private getPersonaDescription(persona: string): string {
        switch (persona) {
            case 'technical_lead':
                return "You are a skeptical Technical Lead. You care about feasibility, specifics, and proven experience. You hate marketing fluff.";
            case 'contract_officer':
                return "You are a Contracting Officer. You care about compliance, risk mitigation, and adherence to requirements. You are very literal.";
            case 'executive':
                return "You are a Senior Executive. You care about value, ROI, and high-level strategy. You have a short attention span.";
            default:
                return "You are a government evaluator.";
        }
    }
}
