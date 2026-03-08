# Review Models Configuration

Configure the AI models used for multi-model code review. Update this file when newer or better models become available — all review references point here.

## Models

| Model | Review Command Name | Model ID | Strengths |
|-------|-------------------|----------|-----------|
| **GPT-5.3-Codex** | `codex 5.3` | `gpt-5.3-codex` | Code-focused reasoning, implementation detail |
| **Claude Opus 4.6** | `opus 4.6` | `claude-opus-4.6` | Broad analysis, architectural thinking |
| **Gemini 3 Pro** | `gemini 3 pro` | `gemini-3-pro-preview` | Alternative perspective, pattern recognition |

## Review Command

```
/review using codex 5.3, opus 4.6, gemini 3 pro
```

Update the model names in the table above **and** the review command when changing models. The "Review Command Name" column shows the exact string used in the `/review using ...` command.

## Choosing Models

Pick **3 models from different providers** for maximum coverage — different architectures catch different issues. Use benchmarks to inform your selection:

**General coding benchmarks:**
- [SWE-bench](https://www.swebench.com/) — Real-world software engineering tasks
- [Aider LLM Leaderboard](https://aider.chat/docs/leaderboards/) — Code editing performance
- [LiveBench](https://livebench.ai/) — Continuously updated reasoning benchmarks
- [Chatbot Arena](https://lmarena.ai/) — Community-driven model comparisons

**Domain-specific benchmarks:**
- For specialized domains (e.g., Business Central/AL, embedded systems, specific frameworks), look for domain-specific benchmarks that test models against real tasks in your stack
- Example: [AL Code Benchmark](https://ai.sshadows.dk/) for Microsoft Dynamics 365 Business Central

**Selection principles:**
1. **Diversity over raw ranking** — Three models from different providers catch more than three from the same provider
2. **Benchmark relevance** — A model ranked #1 on general reasoning may underperform on your specific stack
3. **Cost vs. value** — Premium models for critical reviews, faster models for routine checks
4. **Re-evaluate periodically** — Model rankings shift frequently; check benchmarks when updating
