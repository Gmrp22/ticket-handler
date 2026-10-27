---
description: Generate an implementation plan using `$ARGUMENTS`
argument-hint: Specific info about what the user wants to do
---

# User Input
`$ARGUMENTS` is the feature the user wants to build

Example:
- "I want to build a basic backend architecture for a todo"

# Context
Generate a new plan for implementing based on the user input, the output must be a markdown file under `docs/learn/<plan>.md`. The user will provide more input and the plan will be refined, so make sure to start with just a simple structure, the user will provide the details.

# Rules
- Keep the plan short. List only what the user decides, no extra explanations or extra data.
- Only create the plan markdown file. Do not create any source files, the user will ask for them later with more instructions.
