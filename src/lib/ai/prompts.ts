export const PROMPTS = {
  EXTRACT_CLAUSES: `You are a contract analysis expert. Your task is to extract distinct clauses from the provided contract text.
  
  For each clause, identify:
  1. The full text of the clause
  2. The type of clause (e.g., "Liability", "Termination", "Indemnification", "Payment", "Confidentiality", "Warranty", "Governing Law", "Dispute Resolution", "Force Majeure", "Assignment", "Amendment", "Severability", "Notices", "Entire Agreement", "Waiver", "Survival", "Counterparts", "Definitions", "Interpretation", "Other")
  
  Return the result as a JSON array of objects.`,

  ANALYZE_RISK: `You are a senior legal risk analyst specializing in vendor contract protection.

Clause Type: {clause_type}
Clause Text: "{clause_text}"

Analyze this clause for risks to the vendor (us). Focus on:
- Unlimited/uncapped liability exposure
- Broad indemnification obligations  
- Unfavorable payment/billing terms
- Automatic renewals without opt-out
- Overly restrictive non-compete/exclusivity
- One-sided termination rights favoring client
- IP ownership concerns

Provide JSON with:
1. risk_score (0-100): How damaging is this clause?
2. risk_category: Financial, Legal, Operational, Reputational, or Compliance
3. risk_level: low, medium, high, or critical
4. risk_description: What's the specific problem? (1 sentence)
5. impact_description: What could go wrong? (1 sentence)
6. suggested_alternative: Better language that protects us while being fair
7. reasoning: Why is this risky? (2-3 sentences max)

Be strict on unlimited liability, automatic renewals, and broad indemnification. Be lenient on standard boilerplate.`,

  // Structured output schema for consistent responses
  RISK_ANALYSIS_SCHEMA: {
    type: "object",
    properties: {
      clause_type: { type: "string" },
      risk_score: { type: "integer", minimum: 0, maximum: 100 },
      risk_category: { type: "string" },
      risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
      risk_description: { type: "string" },
      impact_description: { type: "string" },
      suggested_alternative: { type: "string" },
      reasoning: { type: "string" }
    },
    required: [
      "clause_type",
      "risk_score",
      "risk_category",
      "risk_level",
      "risk_description",
      "impact_description",
      "suggested_alternative",
      "reasoning"
    ]
  },

  EXTRACT_REQUIREMENTS: `You are an expert Proposal Manager. Your task is to extract all requirements from the provided RFP text.
  
  For each requirement, identify:
  1. The exact text of the requirement.
  2. The type (Technical, Management, Past Performance, Compliance).
  3. The priority (Mandatory - must do, Desirable - good to have, Optional).
  4. The page number reference (if available in context, otherwise null).
  
  Return the result as a JSON array of objects with keys: req_text, req_type, priority, page_ref.`,

  EVALUATOR_SIMULATION: `You are a strict government contract evaluator. Your job is to score a proposal section against a specific requirement.
  
  Persona: {persona}
  
  Requirement: "{requirement}"
  
  Proposal Section: "{proposal_text}"
  
  Evaluate this rigorously. 
  1. Score it from 0-100 based on how well it meets the requirement.
  2. Provide specific feedback on strengths and weaknesses.
  3. Suggest concrete improvements to increase the score.
  
  Return JSON: { "score": number, "feedback": string, "improvements": string }`,

  GENERATE_PROPOSAL: `You are a Proposal Writer for a government contractor. Write a response to the following requirement.
  
  Requirement: "{requirement}"
  
  Context/Winning Patterns:
  {context}
  
  Instructions:
  1. Address the requirement directly and completely.
  2. Use the "Context" provided to incorporate proven winning language and capabilities.
  3. Be persuasive but factual.
  4. Structure the response clearly.
  
  Return the response text.`
};
