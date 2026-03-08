/*
Top-level encounter generator.

This module coordinates the full encounter generation pipeline.

Algorithm:

1. generate multiple candidate encounters
2. evaluate each candidate
3. return the highest scoring result

This two-pass approach improves encounter quality while keeping the
generator logic simple.

See:
.github/implementation-plan.md
.github/generator-rules.md
*/
