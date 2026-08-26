# Contributing to LookAI

Thank you for your interest in contributing to LookAI! We welcome contributions from the community to help make this the best personal AI stylist app available.

## Getting Started

1. **Fork the repository** and clone it locally.
2. **Install dependencies:** `npm install`
3. **Set up environment variables:** Copy `.env.example` to `.env` and fill in the required Supabase and Clerk API keys.
4. **Run the app:**
   - For iOS: `npm run ios`
   - For Android: `npm run android`

## Branching Strategy

- `main`: The stable release branch.
- Feature branches should be branched off `main` and named descriptively (e.g., `feature/ai-outfit-generator`, `fix/camera-crash`).

## Code Style & Standards

- **TypeScript:** We use strict TypeScript. Please ensure your code passes `npm run typecheck`.
- **Linting:** We use ESLint. Run `npm run lint` before committing to ensure no warnings or errors.
- **Architecture:** We follow a feature-based folder structure inside `src/`.
  - `src/app/` - Routing (Expo Router)
  - `src/features/` - Domain logic, components, APIs, and stores separated by business feature.
  - `src/shared/` - Generic UI components, hooks, and utilities.

## Pull Requests

1. Commit your changes using descriptive commit messages.
2. Push your feature branch to your fork.
3. Open a Pull Request against the `main` branch.
4. Fill out the Pull Request template completely.
5. Ensure the GitHub Actions CI pipeline passes.

Once again, thank you for your contributions!
