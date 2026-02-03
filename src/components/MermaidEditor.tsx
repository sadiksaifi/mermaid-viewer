import { Code2 } from "lucide-react";
import { useMemo, useRef, useEffect } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useTheme } from "@/components/theme-provider";
import mermaid from "mermaid";

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MermaidEditor({ value, onChange }: MermaidEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const monacoTheme = useMemo(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "vs-dark"
        : "light";
    }
    return theme === "dark" ? "vs-dark" : "light";
  }, [theme]);

  // Validation Logic
  useEffect(() => {
    const validate = async () => {
      if (!monacoRef.current || !editorRef.current) return;
      
      const model = editorRef.current.getModel();
      if (!model) return;

      try {
        await mermaid.parse(value);
        monacoRef.current.editor.setModelMarkers(model, "mermaid", []);
      } catch (error: any) {
        if (error.hash && error.hash.loc) {
          const { first_line, last_line, first_column, last_column } = error.hash.loc;
          monacoRef.current.editor.setModelMarkers(model, "mermaid", [
            {
              startLineNumber: first_line,
              startColumn: first_column,
              endLineNumber: last_line,
              endColumn: last_column,
              message: error.message || "Syntax Error",
              severity: monacoRef.current.MarkerSeverity.Error,
            },
          ]);
        } else {
            // Fallback if no location info
             monacoRef.current.editor.setModelMarkers(model, "mermaid", [
            {
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 1,
              message: error.message || "Syntax Error",
              severity: monacoRef.current.MarkerSeverity.Error,
            },
          ]);
        }
      }
    };

    const timer = setTimeout(validate, 500);
    return () => clearTimeout(timer);
  }, [value]);


  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Override Command Palette shortcut and update UI label
    editor.addAction({
      id: "editor.action.quickCommand",
      label: "Command Palette",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      ],
      run: (ed) => {
        ed.trigger("keyboard", "editor.action.quickCommand", null);
      },
    });
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    if (!monaco.languages.getLanguages().some((l: any) => l.id === "mermaid")) {
      monaco.languages.register({ id: "mermaid" });
      
      // Tokenizer (Syntax Highlighting)
      monaco.languages.setMonarchTokensProvider("mermaid", {
        tokenizer: {
          root: [
            [/%%.*$/, "comment"],
            [/\[|\]|\(|\)|\{|\}|>|--|==|:/, "delimiter"],
            [/"/, "string", "@string"],
            [/[a-zA-Z][\w$]*/, {
              cases: {
                "@keywords": "keyword",
                "@default": "identifier",
              },
            }],
          ],
          string: [
            [/[^\\"]+/, "string"],
            [/"/, "string", "@pop"],
          ],
        },
        keywords: [
          "graph", "flowchart", "TD", "DT", "TB", "BT", "RL", "LR",
          "subgraph", "end", "classDiagram", "stateDiagram", "stateDiagram-v2",
          "sequenceDiagram", "gantt", "pie", "erDiagram", "journey", "gitGraph",
          "mindmap", "timeline", "zenuml", "sankey-beta", "quadrantChart",
          "xyChart", "block-beta", "class", "participant", "actor", "loop",
          "alt", "opt", "rect", "note", "over", "right", "left", "of", "box",
          "title", "accTitle", "accDescr", "section", "click", "callback", "linkStyle",
          "classDef", "style", "fill", "stroke", "stroke-width", "color",
        ],
      });

      // Language Configuration
      monaco.languages.setLanguageConfiguration("mermaid", {
        comments: {
          lineComment: "%%",
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
        ],
      });

      // Autocompletion Provider
      monaco.languages.registerCompletionItemProvider("mermaid", {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const keywords = [
            "graph", "flowchart", "TD", "TB", "BT", "RL", "LR",
            "subgraph", "end", "classDiagram", "stateDiagram-v2",
            "sequenceDiagram", "gantt", "pie", "erDiagram", "journey",
            "participant", "actor", "loop", "alt", "opt", "rect", "note",
            "classDef", "style", "click"
          ];

          const suggestions: any[] = keywords.map((k) => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            range: range,
          }));
          
          // Add some snippets
          suggestions.push({
            label: "graph TD (Snippet)",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[End]\n    B -->|No| D[Retry]",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
             detail: "Basic Flowchart"
          });

          return { suggestions };
        },
      });

      // Hover Provider
      const HOVER_CONTENTS: Record<string, string> = {
        graph: "**Flowchart**\n\nDeclares a new graph. Directions: `TD` (Top-Down), `LR` (Left-Right), etc.",
        flowchart: "**Flowchart**\n\nDeclares a new flowchart (newer syntax).",
        sequenceDiagram: "**Sequence Diagram**\n\nAn interaction diagram that shows how processes operate with one another and in what order.",
        classDiagram: "**Class Diagram**\n\nDescribes the structure of a system by showing the system's classes, their attributes, operations (or methods), and the relationships among objects.",
        stateDiagram: "**State Diagram**\n\nDescribes the behavior of a system.",
        "stateDiagram-v2": "**State Diagram**\n\nDescribes the behavior of a system (Version 2).",
        erDiagram: "**Entity Relationship Diagram**\n\nDescribes the structure of a database.",
        gantt: "**Gantt Chart**\n\nA type of bar chart that illustrates a project schedule.",
        pie: "**Pie Chart**\n\nCircular statistical graphic.",
        subgraph: "**Subgraph**\n\nPartition the graph into a subgraph.",
        end: "**End**\n\nCloses a block (like `subgraph`).",
        participant: "**Participant**\n\nDefine a participant in a sequence diagram.",
        actor: "**Actor**\n\nDefine an actor in a sequence diagram.",
        note: "**Note**\n\nAdd a note to the diagram.",
        click: "**Click**\n\nBind a click event to a node.",
        style: "**Style**\n\nApply specific styles to a node.",
        classDef: "**Class Definition**\n\nDefine a style class.",
        "-->": "**Arrow**\n\nStandard link.",
        "---": "**Link**\n\nOpen link.",
      };

      monaco.languages.registerHoverProvider("mermaid", {
        provideHover: (model: any, position: any) => {
          const word = model.getWordAtPosition(position);
          if (!word) return null;
          
          const content = HOVER_CONTENTS[word.word];
          if (!content) return null;

          return {
            contents: [
              { value: content }
            ]
          };
        }
      });

      // Formatting Provider (Basic Indenter)
      monaco.languages.registerDocumentFormattingEditProvider("mermaid", {
        provideDocumentFormattingEdits: (model: any) => {
          const text = model.getValue();
          const lines = text.split('\n');
          const formattedLines = [];
          let indentLevel = 0;
          const indentSize = 4; // 4 spaces

          const blockOpeners = /^(graph|flowchart|subgraph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gantt|pie|journey|mindmap|timeline|block-beta)\b/;
          const blockClosers = /^end\b/;

          for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            if (line.length === 0) {
              formattedLines.push('');
              continue;
            }

            // Decrease indent before checking openers (for 'end')
            if (blockClosers.test(line)) {
              indentLevel = Math.max(0, indentLevel - 1);
            }

            const indent = ' '.repeat(indentLevel * indentSize);
            formattedLines.push(indent + line);

            // Increase indent for next line
            if (blockOpeners.test(line)) {
              indentLevel++;
            }
          }

          return [
            {
              range: model.getFullModelRange(),
              text: formattedLines.join('\n'),
            }
          ];
        }
      });

    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden group">
      {/* Minimal Header */}
      <div className="h-9 flex items-center justify-between px-4 border-b border-border/40 shrink-0 bg-muted/5">
        <div className="flex items-center gap-2">
          <Code2 className="size-3.5 text-muted-foreground/70" />
          <span className="text-xs font-medium text-muted-foreground/70">
            Source
          </span>
        </div>
      </div>

      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="mermaid"
          language="mermaid"
          value={value}
          theme={monacoTheme}
          onChange={(val) => onChange(val || "")}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            wordWrap: "on",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 13,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "none",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            lineDecorationsWidth: 16, // minimal line number padding
            lineNumbersMinChars: 3,
            scrollbar: {
              vertical: "visible",
              horizontal: "hidden",
              useShadows: false,
              verticalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}