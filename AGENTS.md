# Agent Operational Guidelines

This repository contains a Mermaid.js viewer application built with React 19, Vite, TypeScript, and Tailwind CSS v4.

## 1. Environment & Build System

**CRITICAL: Use Bun only.**
- This project strictly uses **Bun** as the package manager and runtime.
- Do NOT use `npm`, `yarn`, or `pnpm`.

### Core Commands
| Action | Command | Description |
|--------|---------|-------------|
| **Install** | `bun install` | Install dependencies |
| **Dev Server** | `bun run dev` | Start local development server |
| **Build** | `bun run build` | Type-check (`tsc -b`) and build for production |
| **Lint** | `bun run lint` | Run ESLint |
| **Test** | N/A | *No tests are currently configured.* If adding tests, use `bun test`. |

## 2. Code Style & Conventions

### File Structure & Imports
- **Path Alias:** ALWAYS use the `@/` alias for imports from `src/`.
  - ✅ `import { Button } from "@/components/ui/button"`
  - ❌ `import { Button } from "../../components/ui/button"`
- **Component Location:**
  - Feature components: `src/components/` (e.g., `Header.tsx`, `MermaidEditor.tsx`)
  - UI Primitives (shadcn): `src/components/ui/`
  - Logic/Utilities: `src/lib/`

### React & TypeScript
- **Component Style:**
  - Use Functional Components with explicit return types if complex.
  - Use Named Exports for new components (`export function MyComponent() {}`).
  - Use `interface` for Props definitions.
- **Hooks:**
  - Use standard React hooks (`useState`, `useRef`, `useCallback`).
  - Ensure dependency arrays in `useEffect` and `useCallback` are exhaustive.
- **Types:**
  - Strict TypeScript is enabled. Avoid `any`.
  - Use strict null checks.

### Styling (Tailwind CSS v4)
- Use standard utility classes.
- Use `shadcn/ui` components for common UI elements.
- Use `lucide-react` for icons.
- Ensure responsive design using standard Tailwind breakpoints (`md:`, `lg:`).

### Error Handling & User Feedback
- Use `try/catch` blocks for async operations.
- **Feedback:** Use `sonner` for user-facing notifications.
  ```tsx
  import { toast } from "sonner";
  
  try {
    // operations
  } catch (error) {
    console.error("Contextual error log:", error);
    toast.error("User friendly error message", {
      description: "Optional detailed description"
    });
  }
  ```

## 3. Development Workflow
1.  **Verify:** Before submitting changes, run `bun run build` to ensure type safety.
2.  **Lint:** Run `bun run lint` to catch potential issues.
3.  **Cleanup:** Remove unused imports and variables.

## 4. Documentation
- Update `README.md` if adding major features or changing build steps.
- Do not add comments unless the logic is complex and requires explanation ("Why", not "What").
