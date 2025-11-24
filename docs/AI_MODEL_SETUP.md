# AI Model Configuration

## Quick Setup

Add this to your `.env.local` file:

```bash
# AI Model Selection (for cost optimization)
# Development: gpt-4o-mini (98% cheaper, $0.008 per analysis)
# Production: gpt-4-turbo-preview (best quality, $0.40 per analysis)
AI_MODEL=gpt-4o-mini
```

## Cost Savings

| Model | Cost per Analysis | Quality |
|-------|------------------|---------|
| gpt-4-turbo-preview | $0.40 | 100% (production) |
| **gpt-4o-mini** | **$0.008** | **90%** (dev) |
| gpt-3.5-turbo | $0.03 | 75% |

**Development Savings:** Test 100 contracts for $0.80 instead of $40 (98% savings)

## How It Works

The `ContractAnalyzer` class now checks the `AI_MODEL` environment variable:
- If set → uses that model
- If not set → defaults to `gpt-4o-mini`

**No code changes needed** - just update `.env.local` and restart the dev server.

## Before Production Launch

Change to production model in `.env.local`:
```bash
AI_MODEL=gpt-4-turbo-preview
```

That's it!
