# Agent Guidelines

These rules apply to every change in this repository, including code, tests, documentation, configuration, and UI. The goal is understandable, reliable software that fits the project—not code that merely looks impressive in a demo.

## 1. Working principles

- Understand the project and the user's actual goal before changing files.
- Prefer clear, boring, maintainable solutions over cleverness, novelty, or unnecessary flexibility.
- Make the smallest complete change that solves the problem. Do not rewrite unrelated code or expand the scope without a reason.
- Follow the repository's established conventions when they are sound. Do not introduce a second pattern or system just because it is familiar to you.
- Do not claim that something works, is tested, is secure, or is complete unless you have verified it. State any verification you could not perform.
- If a requirement is ambiguous in a way that could change the architecture, security, or user-visible behavior, ask a focused question. Otherwise, make a conservative assumption and state it.

## 2. Plan before coding

Before implementing a task:

1. Inspect the relevant files, project structure, package scripts, dependencies, documentation, tests, and existing conventions.
2. Identify the expected behavior, constraints, likely edge cases, and files that need to change.
3. Write a short plan with the intended approach and verification steps. For a small, obvious change, keep the plan brief.
4. Make focused changes. Avoid unrelated cleanup unless it is necessary for the task.
5. Run the most relevant checks, inspect the diff, and fix issues introduced by the change.
6. Commit each independently complete, logical change with a descriptive message. Keep commits focused; stage only intended files. Do not rewrite existing history. If commits are unavailable or inappropriate in the environment, explain why instead of pretending a commit was made.

## 3. JavaScript style: readability first

Write JavaScript that a semi-beginner can follow without deciphering tricks. Prefer standard language features and documented platform APIs over clever code or helper packages.

- Use ordinary, descriptive names. Prefer `loadUserSettings` to `loadData` or `doThing`.
- Use ES modules (`import` and `export`) when supported by the project. Follow the project's actual runtime and module configuration.
- Do not use arrow functions. Prefer named function declarations or ordinary `function` expressions. If an existing API appears to require an arrow function, check whether a normal function works before introducing one.
- Classes are allowed when they model a real concept or improve the code. Do not create classes simply to wrap a few unrelated functions.
- Prefer small functions that each do one clear job. Keep control flow straightforward and avoid deeply nested branches.
- Avoid clever one-liners, nested ternaries, dense chaining, obscure regular expressions, unnecessary recursion, implicit type coercion, and metaprogramming that makes behavior harder to trace.
- Use early returns when they make the main path easier to understand. Do not flatten code at the cost of clarity.
- Prefer `const` by default and `let` when reassignment is needed. Do not use `var` in new code.
- Handle asynchronous work explicitly. Use `async`/`await` where it makes the sequence easy to follow, and handle failures intentionally.
- Use the standard library and established project utilities before proposing third-party helpers.
- Do not add runtime dependencies, development dependencies, frameworks, libraries, or services without first explaining the need, alternatives, trade-offs, and maintenance cost, then getting the user's approval.
- Do not add types, build tools, transpilers, or framework-specific syntax unless the project already uses them or the user approves them.
- Aim to keep each source file around 150 lines or fewer. Split growing files by meaningful responsibility, not into tiny files that only add navigation overhead. Generated files, lockfiles, schemas, and files whose formats require more length are exceptions.
- Add a short header comment to each hand-written source file explaining what the file is responsible for. Comments should explain **why** a decision or non-obvious operation exists, not narrate what each line already says.
- Do not add redundant comments, fake documentation, decorative banners, or generic AI-sounding explanations.
- Do not reformat or rename unrelated code merely to match your personal preferences.

## 4. Architecture and backend behavior

- Keep architecture proportional to the actual size and needs of the application. Start with the simplest design that meets the requirements.
- Do not add layers, interfaces, factories, managers, providers, adapters, dependency-injection containers, or base classes unless they create a concrete benefit such as a real boundary, reusable behavior, or meaningful testability.
- Avoid functions and modules that only forward arguments to another function without adding a useful responsibility.
- Do not duplicate existing infrastructure. Reuse established logging, configuration, validation, HTTP, data-access, and error-handling patterns where appropriate.
- Keep business rules, transport concerns, and data access clear enough that a beginner can tell where behavior belongs. Do not force every project into the same architecture template.
- Treat external input as untrusted. Validate it at the appropriate boundary and enforce authorization on the server, including ownership or access to individual resources.
- Use parameterized database queries or the database library's safe query API. Do not build executable queries by concatenating untrusted input.
- Do not swallow errors, return success after a failed operation, or expose secrets, stack traces, or private internal details to users.
- Error handling should preserve useful context, give callers a consistent and actionable result, and avoid catching errors that cannot be handled meaningfully.
- Consider relevant timeouts, cancellation, retries with limits, duplicate requests, concurrent updates, transaction boundaries, resource cleanup, and partial failure. Implement what the system actually needs; do not add defensive checks for impossible states without a reason.
- Do not create fake security, health checks, caching, retries, persistence, or validation. A feature's name must match what it really does.
- Keep configuration and secrets out of source code. Validate required configuration at startup and fail clearly when the application cannot operate safely.
- Do not change API shapes, storage formats, authentication behavior, or compatibility guarantees without checking the effects on existing callers and data.

## 5. Frontend behavior and implementation

- Follow the frontend framework, component model, routing, state management, and styling system already used by the project. Do not add a competing system without approval.
- Keep components focused on meaningful UI or behavior. Avoid both giant components that own everything and tiny components that add no useful reuse or clarity.
- Do not store values in state when they can be derived simply from existing state or props. Avoid effects that only synchronize values that can be computed directly.
- Avoid duplicate requests, stale updates, race conditions, uncontrolled event flows, and unnecessary rerenders. Match async behavior to the framework's conventions.
- Connect controls to real behavior and the real API contract. Do not ship dead buttons, fake success messages, nonfunctional filters, or hard-coded fallback data that looks like real user data.
- If demo or placeholder data is needed, keep it clearly identified as demo data and do not silently use it in production behavior.
- Handle loading, empty, no-results, error, disabled, pending, success, and permission-restricted states wherever they are relevant.
- Reuse existing shared components and tokens. Do not make one-off variants when the existing component already supports the required behavior.
- Use semantic HTML and accessible controls. Provide labels, sensible keyboard behavior, visible focus, appropriate dialog focus handling, accessible status updates, and sufficient contrast.
- Do not hide errors just to keep the UI looking clean. Explain failures in useful language and provide a reasonable next step when possible.

## 6. Visual design: avoid generic AI-generated UI

Design for the actual product and its users. Do not automatically apply a generic SaaS-dashboard or landing-page template.

- Do not add gradients, glow effects, glassmorphism, floating decorations, oversized headings, pill-shaped controls, large rounded cards, or soft shadows by default. Use them only when they fit a deliberate design direction.
- Do not put every piece of content in a card. Use headings, whitespace, lists, tables, dividers, and direct page layout when they create clearer hierarchy.
- Avoid arbitrary colors, inconsistent radii, too many font sizes, excessive whitespace, cramped content, and decorative elements that compete with the task.
- Choose layout and information density based on the product. Developer tools, editors, settings panels, and admin interfaces should make frequent tasks and important information efficient to reach.
- Establish or follow consistent design tokens for spacing, typography, color roles, borders, radii, focus states, and component sizes. Reuse them instead of inventing near-duplicate values in every component.
- Use one coherent icon set already present in the project. Do not substitute emoji for interface icons or mix unrelated icon styles. Align icons with the accompanying text and controls; use consistent sizing, stroke weight, spacing, and optical alignment.
- Align labels, icons, fields, buttons, baselines, and adjacent controls deliberately. Use consistent heights and padding for components that serve the same purpose.
- Use animation only when it communicates state or improves an interaction. Respect reduced-motion preferences and avoid motion added only for decoration.
- Use realistic content lengths when checking layouts. Long names, empty values, dense data, and error messages should not break the page.
- Ensure the UI remains usable at the project's relevant viewport sizes. Do not assume a single desktop screenshot represents a complete responsive implementation.
- Do not invent decorative statistics, fake charts, fictional user activity, or meaningless badges just to fill empty space.
- Make the product's visual identity specific to its purpose. Do not copy a fashionable design trend merely because it makes a screenshot look polished.

## 7. Safeguards for completely new projects

A blank repository is not permission to invent a large architecture, a generic design, or a pile of dependencies. Establish a small, coherent foundation before generating many files.

1. **Clarify the product.** Identify the primary user, main task, essential features, target environment, and explicit constraints. Ask only about missing decisions that would materially affect the implementation.
2. **Respect stack choices.** Use the language, framework, platform, and tools the user specified. If a major choice is unspecified, recommend the simplest suitable option and explain the trade-off before introducing a dependency or service.
3. **Propose the shape first.** Give a short implementation plan and an initial file/directory layout. Explain each major dependency and architectural boundary. Do not silently scaffold a full enterprise architecture.
4. **Start with the smallest useful version.** Implement the core end-to-end workflow before adding secondary features, settings, abstractions, animations, or extensibility systems.
5. **Choose a visual direction intentionally.** Base it on the product's purpose and user needs. Define a small set of reusable design tokens and components instead of generating disconnected screens with arbitrary styling.
6. **Keep generated files purposeful.** Every file, package, abstraction, endpoint, component, and configuration option must serve an identified requirement. Remove unused scaffolding and example content.
7. **Make the core workflow real.** Connect the UI, API, persistence, and validation that the requested feature actually needs. Clearly label any part that remains a stub; never imply it is implemented.
8. **Include basic quality checks.** Add or use proportionate tests and verification scripts. Cover the core behavior and important failure paths instead of generating large numbers of shallow tests.
9. **Verify from a clean start when practical.** Follow the documented setup steps, run the build and tests, and inspect the actual UI. Record any step that could not be verified.
10. **Avoid premature extensibility.** Do not add plugin systems, generic registries, multi-provider abstractions, elaborate configuration frameworks, or speculative features unless the requirements call for them.

For a new project, document important assumptions in the README. Do not manufacture product requirements to make the implementation look more complete.

## 8. Testing and verification

- Inspect available scripts and project documentation before choosing commands. Do not assume a package manager, test framework, or build system that the repository does not use.
- Run relevant tests, linting, formatting checks, type checks, and builds available in the project. Do not claim a check passed if it was not run or did not finish successfully.
- Test behavior, not just implementation details. Include meaningful boundary cases and failure cases for the changed functionality.
- For UI changes, run the app and inspect the rendered result when the environment supports it. Check alignment, spacing, text overflow, responsiveness, focus behavior, and important UI states. Correct visible problems rather than stopping when the page first renders.
- Review the final diff for unrelated edits, accidental secrets, generated artifacts, dead code, TODOs that conceal unfinished requirements, and regressions.
- If a check cannot run because of missing access, dependencies, hardware, or environment support, state the exact limitation and what remains unverified.

## 9. Completion report

When finishing a task, summarize:

- What changed and why.
- Important implementation or design decisions.
- Tests and checks actually run, including failures.
- Any known limitations or unfinished work.
- The commit hash or hashes created, or why no commit was made.

Do not use vague claims such as "production-ready," "fully secure," or "everything works" without evidence. Be direct about what has and has not been verified.
