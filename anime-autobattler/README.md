# Anime Wave-Roguelite Autobattler

A deterministic, web-based anime-style wave roguelite autobattler.

## Project Structure

This is a monorepo managed by `pnpm`.

- `apps/web`: The React + PixiJS frontend.
- `packages/sim`: The pure TypeScript deterministic simulation engine.
- `packages/content`: Data-driven content (JSON) and Zod schemas.
- `packages/tools`: CLI tools for benchmarking and testing.

## Getting Started

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Run the Web App**:
    ```bash
    pnpm dev
    ```
    Open `http://localhost:5173` in your browser.

3.  **Run Simulation Benchmark**:
    ```bash
    pnpm sim:benchmark --seed 123
    ```

4.  **Run Tests**:
    ```bash
    pnpm test
    ```

## Development

- **Content**: Edit JSON files in `packages/content/data/`.
- **Simulation**: Core logic is in `packages/sim/src/`. Ensure no DOM dependencies are introduced here.
- **Visuals**: `apps/web` handles all rendering.

## Architecture Constraints

- **Determinism**: The simulation must produce identical results for the same seed.
- **Decoupling**: `packages/sim` knows nothing about React or PixiJS.
- **Data-Driven**: Game balance and entities are defined in `packages/content`.
