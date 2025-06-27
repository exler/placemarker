# AGENTS.md Placemarker  

> **purpose** – This file is the onboarding manual for every AI assistant (Claude, Cursor, GPT, etc.) and every human who edits this repository.

---

## 0. Project overview

Placemarker is a SPA application to manage the countries you've traveled to on a world map. It uses React for the front-end application and has an optional Pocketbase backend used for authentication and data storage. Key components:

- **src/WorldMap.tsx**: Component for displaying the world map with countries
- **src/lib/**: Authentication, data fetching and storage utilities

**Golden rule**: When unsure about implementation details or requirements, ALWAYS consult the developer rather than making assumptions.

---

## 1. Build, test & utility commands

`bun` is the all-in-one runtime acting as a package manager, task runner and a bundler. It should be always preferred over any other tool.

```bash
bun run dev     # Start the development server on port 8080
bun run lint    # Lint using Biome
```

---

## 2. Coding standards

*   **TypeScript**: Use strict and accurate types. 
*   **Formatting**: `biome` enforces 120 line width, double quotes and 4 spaces for indentation.

---

## 3. Project layout & Core Components

| Directory         | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `src/components/` | React components                                                    |
| `src/lib/`        | Utilities, classes and logic that can be re-used between components |
| `src/routes/`     | React router routes                                                 |

---

## 4. Anchor comments

Add specially formatted comments throughout the codebase, where appropriate, for yourself as inline knowledge that we can easily `grep` for.

### Guidelines:

- Use `AIDEV-NOTE:`, `AIDEV-TODO:`, or `AIDEV-QUESTION:` (all-caps prefix) for comments aimed at AI and developers.
- Keep them concise (≤ 120 chars).
- **Important:** Before scanning files, always first try to **locate existing anchors** `AIDEV-*` in relevant subdirectories.
- **Update relevant anchors** when modifying associated code.
- **Do not remove `AIDEV-NOTE`s** without explicit human instruction.
- Make sure to add relevant anchor comments, whenever a file or piece of code is:
  * too long, or
  * too complex, or
  * very important, or
  * confusing, or
  * could have a bug unrelated to the task you are currently working on.
```

---

## 5. Common pitfalls

---

## 6. Domain-Specific Terminology

---

## AI Assistant Workflow: Step-by-Step Methodology

When responding to user instructions, the AI assistant (Claude, Cursor, GPT, etc.) should follow this process to ensure clarity, correctness, and maintainability:

1. **Consult Relevant Guidance**: When the user gives an instruction, consult the relevant instructions from `AGENTS.md` file.
2. **Clarify Ambiguities**: Based on what you could gather, see if there's any need for clarifications. If so, ask the user targeted questions before proceeding.
3. **Break Down & Plan**: Break down the task at hand and chalk out a rough plan for carrying it out, referencing project conventions and best practices.
4. **Trivial Tasks**: If the plan/request is trivial, go ahead and get started immediately.
5. **Non-Trivial Tasks**: Otherwise, present the plan to the user for review and iterate based on their feedback.
6. **Track Progress**: Use a to-do list (internally, or optionally in a `TODOS.md` file) to keep track of your progress on multi-step or complex tasks.
7. **If Stuck, Re-plan**: If you get stuck or blocked, return to step 3 to re-evaluate and adjust your plan.
8. **Update Documentation**: Once the user's request is fulfilled, update relevant anchor comments (`AIDEV-NOTE`, etc.) and `AGENTS.md` files in the files and directories you touched.
9. **User Review**: After completing the task, ask the user to review what you've done, and repeat the process as needed.
10. **Session Boundaries**: If the user's request isn't directly related to the current context and can be safely started in a fresh session, suggest starting from scratch to avoid context confusion.
