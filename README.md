# Mermaid Viewer

A modern, high-performance **Mermaid.js** editor and viewer built with **React 19**, **Vite**, and **Tailwind CSS v4**.

<img width="1624" height="1059" alt="Screenshot 2026-02-04 at 22 49 00" src="https://github.com/user-attachments/assets/3796cf10-ccd0-4e43-af76-914326cb949d" />

## ✨ Features

- **Live Preview:** Instant rendering of Mermaid diagrams as you type.
- **Smart Editor:** Powered by **Monaco Editor** (VS Code engine).
  - **Syntax Highlighting:** Real-time coloring for Mermaid keywords.
  - **Live Linting:** Inline error detection with red squiggles and hover details.
  - **IntelliSense:** Autocomplete for keywords and complex snippets.
  - **Command Palette:** Access commands via `Cmd+Shift+P`.
  - **Code Formatting:** Automatic indentation cleanup.
- **Interactive Viewer:**
  - **Pan & Zoom:** Smooth controls to navigate large diagrams.
  - **Dark Mode:** Fully responsive theme switching (Light/Dark/System).
- **Export Tools:**
  - Download as **PNG** (High Resolution).
  - Copy to Clipboard (Image or Code).
  - Copy as **ASCII** art (for easy sharing in text).

## 🚀 Tech Stack

- **Runtime:** [Bun](https://bun.sh) (Strictly required)
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Editor:** `@monaco-editor/react`
- **Diagrams:** `mermaid`, `beautiful-mermaid`
- **UI Components:** `shadcn/ui`, `lucide-react`

## 🛠️ Getting Started

### Prerequisites

- **Bun** (v1.0.0 or later)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/mermaid-viewer.git
    cd mermaid-viewer
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

### Development

Start the local development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

Create a production-ready build:

```bash
bun run build
```

To preview the production build:

```bash
bun run preview
```

## ⌨️ Keybindings

- **Cmd/Ctrl + Shift + P**: Open Command Palette
- **Alt + Shift + F**: Format Document
- **Cmd/Ctrl + S**: Save (Auto-saves to local state - *Implementation pending*)

## 🧩 Supported Diagrams

- Flowchart
- Sequence Diagram
- Class Diagram
- State Diagram (v2)
- Entity Relationship (ER) Diagram
- Gantt Chart
- Pie Chart
- Mindmap
- GitGraph
- User Journey
- C4 Architecture

## 📄 License

This project is licensed under the MIT License.
