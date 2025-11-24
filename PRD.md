# Deal Velocity Platform - Complete Product Requirements Document

## 🎯 Core Mission
Transform Deal Velocity from a "deal process tool" into an **"AI-First Deal Intelligence Brain"** that learns from every RFP, contract, negotiation, and outcome to continuously improve win rates.

## 💡 Primary Value Proposition
"Your deals deserve a brain that remembers everything, learns from wins/losses, and gets smarter with every deal."

---

## 🎪 Target Market

### Primary: Government Contractors (GovCon)
- High volume, complex RFPs
- Public data available (SAM.gov)
- Strict compliance requirements (FAR/DFAR)
- High pain point with manual processes

### Secondary: Enterprise B2B Sales Teams
- SaaS companies
- Professional services firms

### Future: Healthcare
- After compliance framework is proven

---

## 🧠 Key Innovation: Deal Memory Graph (DMG)

A hybrid **Vector + Knowledge Graph** system that creates relationships between actions and outcomes:

### Example Patterns:
```
"Liability clause rejected" → "Lost to competitor X" → "Next time offer limited liability"
"Technical approach emphasized cloud" → "Won against incumbent" → "Cloud modernization wins"
"Price 20% above average" → "Still won" → "Customer values quality over price"
```

### DMG Structure:
```python
{
    "nodes": [
        {"id": "clause_1", "type": "contract_clause", "text": "unlimited liability"},
        {"id": "outcome_1", "type": "deal_outcome", "result": "lost"},
        {"id": "pattern_1", "type": "pattern", "name": "liability_correlation"}
    ],
    "edges": [
        {"from": "clause_1", "to": "outcome_1", "relationship": "caused", "weight": 0.8}
    ]
}
```

---

## 🤖 Multi-Agent AI System

Six specialized agents working in concert:

1. **Proposal Agent** - Generates RFP responses
2. **Contract Agent** - Analyzes contracts and risks
3. **Negotiation Agent** - Suggests tactics and concessions
4. **Legal Compliance Agent** - Ensures FAR/DFAR compliance
5. **Deal Desk Agent** - Optimizes pricing and terms
6. **Evaluator Simulation Agent** - Predicts how buyers will score proposals ⭐ **SECRET SAUCE**

### Agent Communication Pattern:
```python
# Agents communicate through shared context
context = {
    "task": "Generate RFP response",
    "rfp_requirements": [...],
    "company_capabilities": [...],
    "winning_patterns": [...],
    "compliance_rules": [...]
}

# Each agent adds to context
proposal_agent.process(context)  # Adds draft
compliance_agent.process(context)  # Adds compliance check
evaluator_agent.process(context)  # Adds predicted score
```

---

## 📋 Use Cases

### For VENDORS (Primary Focus):
- Upload RFP → Get win probability score → Generate compliant response → Simulate evaluation
- Upload contract → Get risk analysis → Generate redlines → Track negotiations
- View intelligence → See win/loss patterns → Improve strategy

### For BUYERS:
- Create RFP from templates → Ensure clarity → Predict vendor response quality
- Evaluate responses → Score consistently → Select best vendor
- Generate contracts → Negotiate efficiently → Close faster

---

## 🚀 Priority Build Order

### Phase 1: Contract Analyzer (CURRENT) ✅
**Status**: In Progress
- Immediate ROI, low trust barrier
- Builds the DMG with contract patterns
- Components:
  - GPT-4 risk identification
  - Risk scoring (0-100)
  - Alternative language suggestions
  - Clause variation tracking
  - User feedback loop

### Phase 2: RFP Responder (NEXT)
- Highest value for vendors
- Builds on DMG patterns
- **Includes Evaluator Simulation Agent** (key differentiator)

### Phase 3: Deal Intelligence
- Surfaces insights from DMG
- Win/loss analysis
- Competitive intelligence
- Strategic recommendations

### Phase 4: RFP Writer
- Completes the platform
- Creates network effects (buyers + vendors)

### Phase 5: Contract Writer
- Natural extension
- Leverages all learned patterns

---

## 🔄 Core Workflows

### Workflow 1: "RFP to Win" (Vendor)
1. Upload RFP → Extract requirements
2. Analyze against past wins → Calculate win probability
3. Generate response using winning patterns
4. Simulate evaluator scoring
5. Iterate until score > 85%
6. Export submission-ready document
7. Track outcome → Feed back to DMG

### Workflow 2: "Contract Risk to Close" (Both)
1. Upload contract → Extract clauses
2. Identify risks using pattern matching
3. Generate redlines with reasoning
4. Track negotiation rounds
5. Analyze concessions vs. outcomes
6. Feed patterns back to DMG

### Workflow 3: "Intelligence Dashboard" (Strategic)
1. View all deals in pipeline
2. See win probability trends
3. Identify why deals are won/lost
4. Get recommendations for improvement
5. Compare against market benchmarks

---

## 🎨 Frontend UI Concept

### Unified AI Workspace Layout:
- **LEFT PANEL**: Document canvas (RFP/Contract/Proposal)
- **RIGHT PANEL**: AI Co-pilot (always visible, proactive suggestions)
- **TOP BAR**: Dynamic metrics (Win %, Risk Score, Compliance %)
- **BOTTOM**: Insight stream (real-time AI observations)

### Key UI Principles:
- **AI-first**: AI suggests, human approves
- **Real-time**: Scores update as you work
- **Proactive**: AI suggests improvements before you ask
- **Transparent**: Show AI reasoning

---

## 🏗️ Technical Architecture

### Current Stack:
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Vector Store**: Pinecone with `llama-text-embed-v2`
- **AI Models**: GPT-4 for analysis
- **Document Processing**: Python FastAPI service
- **Agent Orchestration**: LangChain (planned)

### Services Built:
1. ✅ Document Processor - Extract text, identify types, chunk intelligently
2. ✅ Vector Store - Semantic search with reranking
3. 🚧 Contract Risk Analyzer - GPT-4 powered risk analysis
4. 📅 RFP Responder - Next priority
5. 📅 Deal Intelligence - Surfaces DMG insights
6. 📅 Evaluator Simulation - Secret sauce agent

### Deal Memory Graph Evolution:
- **Phase 1**: JSON-based patterns (immediate)
- **Phase 2**: Graph database (Neo4j) when scale requires

---

## 🎯 Unique Differentiators

1. **Evaluator Simulation Agent** - Only platform that shows how evaluators will score before submission
2. **Deal Memory Graph** - Remembers relationships between actions and outcomes
3. **Multi-Agent Architecture** - Specialized AI agents vs. single general AI
4. **Continuous Learning** - Every deal makes the system smarter
5. **Unified Workspace** - Not separate tools but one intelligent platform

---

## 💰 Business Model

### Pricing Tiers:
- **Contract Analyzer Only**: $1,500/month
- **RFP Responder + Analyzer**: $5,000/month  
- **Full Suite**: $10,000-15,000/month
- **Enterprise** (Custom DMG training): $79,000-200,000/year

### Success Metrics:
- **Target**: 700 customers at $150K average = **$105M ARR**
- Focus on high-value enterprise deals vs. volume

---

## 📊 Data Strategy

### Initial Knowledge Base:
1. Scrape public GovCon RFPs from SAM.gov
2. Use GPT-4 to generate synthetic win/loss labels
3. Create initial patterns and relationships
4. Continuously improve with real customer data

### Privacy & Security:
- Multi-tenant isolation in vector store
- Organization-specific namespaces
- No data sharing between customers
- SOC 2 compliance roadmap

---

## 🔗 Integration Priorities

1. ✅ Document processing → Vector store
2. 🚧 Vector store → GPT-4 analysis (Contract Analyzer)
3. 📅 Analysis → Frontend display
4. 📅 Frontend → Export (Word/PDF)
5. 📅 All modules → Deal Intelligence
6. 📅 Deal Intelligence → DMG
7. 📅 DMG → All modules (feedback loop)

---

## ✅ Success Criteria

### Contract Analyzer (Current Sprint):
- Upload contract → Get risk score in **< 30 seconds**
- Identify **top 5 risks** with explanations
- Generate **redlines** for each risk
- Export **redlined document**
- **95% accuracy** on known risky clauses

### RFP Responder (Next Sprint):
- Upload RFP → Extract **95% of requirements**
- Generate compliant first draft in **< 5 minutes**
- Achieve **80%+ evaluator simulation score**
- Include company-specific content
- Export to Word with formatting

---

## 📝 Database Schema

### Existing Tables:
- `organizations` - Buyer/vendor entities
- `profiles` - User management with RLS
- `projects` - RFPs and opportunities
- `contracts` - Contract lifecycle management
- `documents` - Document storage with vector embeddings
- `outcomes` - Deal results tracking

### Contract Risk Analysis Tables (To Add):
- `contract_clauses` - Identified clauses with risk scores
- `risk_analysis` - Individual risk assessments
- `clause_variations` - Track clause changes over time
- `user_feedback` - Capture feedback on AI suggestions

### Future DMG Tables:
- `dmg_nodes` - Graph nodes (clauses, outcomes, patterns)
- `dmg_edges` - Graph relationships with weights
- `dmg_patterns` - Identified winning/losing patterns

---

## 🎯 Immediate Next Steps

Since Document Processor and Vector Store are complete:

1. ✅ FINISH Contract Risk Analysis API endpoints
2. 📅 BUILD the Evaluator Simulation Agent (differentiator)
3. 📅 CREATE the frontend UI for Contract Analyzer
4. 📅 INTEGRATE all services with the frontend
5. 📅 ADD the AI Co-pilot interface
6. 📅 TEST with real contracts
7. 📅 DEPLOY MVP for beta users

---

## 🚀 The "Secret Sauce"

**The Evaluator Simulation Agent** - This is the key differentiator.

It lets users see how their proposal will score **BEFORE submission**. No competitor has this.

### How it Works:
1. Analyze RFP evaluation criteria
2. Score proposal against each criterion (using GPT-4)
3. Simulate typical evaluator biases and preferences
4. Provide specific suggestions to improve score
5. Re-score iteratively until > 85%

---

## 💭 Core Philosophy

> "You're not building a tool, you're building an Intelligence System that learns and improves with every deal."

Every interaction feeds the Deal Memory Graph. Every win teaches the system what works. Every loss teaches what doesn't. Over time, the system becomes an irreplaceable strategic asset.
