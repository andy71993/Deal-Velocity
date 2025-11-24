import OpenAI from 'openai';
import { PROMPTS } from './prompts';
import { RFPRequirement } from '@/types/rfp';

export class RFPParser {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    async parseRFP(rfpText: string, projectId: string): Promise<Omit<RFPRequirement, 'id' | 'created_at'>[]> {
        // Split text if too long (basic implementation for now)
        // In production, we'd use a more sophisticated chunking strategy
        const chunks = this.chunkText(rfpText, 15000); // ~4k tokens
        const allRequirements: Omit<RFPRequirement, 'id' | 'created_at'>[] = [];

        for (const chunk of chunks) {
            const requirements = await this.extractFromChunk(chunk, projectId);
            allRequirements.push(...requirements);
        }

        return allRequirements;
    }

    private async extractFromChunk(text: string, projectId: string): Promise<Omit<RFPRequirement, 'id' | 'created_at'>[]> {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: PROMPTS.EXTRACT_REQUIREMENTS },
                    { role: "user", content: text }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) return [];

            const result = JSON.parse(content);
            // Expecting { "requirements": [...] } or just [...]
            const rawReqs = result.requirements || result;

            if (!Array.isArray(rawReqs)) return [];

            return rawReqs.map((req: { req_text: string; req_type: string; priority: string; page_ref?: number }) => ({
                project_id: projectId,
                req_text: req.req_text,
                req_type: this.normalizeType(req.req_type),
                priority: this.normalizePriority(req.priority),
                page_ref: req.page_ref || undefined
            }));
        } catch (error) {
            console.error("Error parsing RFP chunk:", error);
            return [];
        }
    }

    private chunkText(text: string, maxLength: number): string[] {
        const chunks: string[] = [];
        let currentChunk = "";

        const sentences = text.split(/(?<=[.!?])\s+/);

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxLength) {
                chunks.push(currentChunk);
                currentChunk = sentence;
            } else {
                currentChunk += (currentChunk ? " " : "") + sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }

    private normalizeType(type: string): RFPRequirement['req_type'] {
        const t = type.toLowerCase();
        if (t.includes('technical')) return 'technical';
        if (t.includes('management')) return 'management';
        if (t.includes('past')) return 'past_performance';
        return 'compliance';
    }

    private normalizePriority(priority: string): RFPRequirement['priority'] {
        const p = priority.toLowerCase();
        if (p.includes('mandatory') || p.includes('shall') || p.includes('must')) return 'mandatory';
        if (p.includes('desirable') || p.includes('should')) return 'desirable';
        return 'optional';
    }
}
