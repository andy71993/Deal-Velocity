import OpenAI from 'openai';
import { PROMPTS } from './prompts';

export class ProposalGenerator {
    private openai: OpenAI;
    private vectorStoreUrl: string;
    private pineconeApiKey: string;

    constructor(apiKey: string, vectorStoreUrl: string = 'http://localhost:8001', pineconeApiKey: string) {
        this.openai = new OpenAI({ apiKey });
        this.vectorStoreUrl = vectorStoreUrl;
        this.pineconeApiKey = pineconeApiKey;
    }

    async generateDraft(requirement: string): Promise<string> {
        // 1. Retrieve context from Vector Store (RAG)
        const context = await this.retrieveContext(requirement);

        // 2. Generate content using GPT-4
        const prompt = PROMPTS.GENERATE_PROPOSAL
            .replace('{requirement}', requirement)
            .replace('{context}', context);

        const response = await this.openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ]
        });

        return response.choices[0].message.content || "Failed to generate content.";
    }

    private async retrieveContext(query: string): Promise<string> {
        try {
            const response = await fetch(`${this.vectorStoreUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.pineconeApiKey
                },
                body: JSON.stringify({
                    query: query,
                    top_k: 3,
                    include_metadata: true,
                    namespace: 'deal-velocity' // Default namespace for now
                })
            });

            if (!response.ok) {
                console.warn("Vector store search failed:", await response.text());
                return "";
            }

            const results = await response.json();
            // Format results into a context string
            return results.matches
                .map((m: { metadata: { filename: string; text: string } }) => `[Source: ${m.metadata.filename}]\n${m.metadata.text}`)
                .join("\n\n");

        } catch (error) {
            console.error("Error retrieving context:", error);
            return "";
        }
    }
}
