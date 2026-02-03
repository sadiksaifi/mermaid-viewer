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
          const { first_line, last_line, first_column, last_column } =
            error.hash.loc;
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

    // Add Cmd/Ctrl + Shift + P for Command Palette
    // Note: The context menu will still show "F1" as the shortcut due to Monaco limitations
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => {
        editor.trigger("keyboard", "editor.action.quickCommand", null);
      },
    );
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
            [
              /[a-zA-Z][\w$]*/,
              {
                cases: {
                  "@keywords": "keyword",
                  "@default": "identifier",
                },
              },
            ],
          ],
          string: [
            [/[^\\"]+/, "string"],
            [/"/, "string", "@pop"],
          ],
        },
        keywords: [
          "graph",
          "flowchart",
          "TD",
          "DT",
          "TB",
          "BT",
          "RL",
          "LR",
          "subgraph",
          "end",
          "classDiagram",
          "stateDiagram",
          "stateDiagram-v2",
          "sequenceDiagram",
          "gantt",
          "pie",
          "erDiagram",
          "journey",
          "gitGraph",
          "mindmap",
          "timeline",
          "zenuml",
          "sankey-beta",
          "quadrantChart",
          "xyChart",
          "block-beta",
          "class",
          "participant",
          "actor",
          "loop",
          "alt",
          "opt",
          "rect",
          "note",
          "over",
          "right",
          "left",
          "of",
          "box",
          "title",
          "accTitle",
          "accDescr",
          "section",
          "click",
          "callback",
          "linkStyle",
          "classDef",
          "style",
          "fill",
          "stroke",
          "stroke-width",
          "color",
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
            "graph",
            "flowchart",
            "TD",
            "TB",
            "BT",
            "RL",
            "LR",
            "subgraph",
            "end",
            "classDiagram",
            "stateDiagram-v2",
            "sequenceDiagram",
            "gantt",
            "pie",
            "erDiagram",
            "journey",
            "participant",
            "actor",
            "loop",
            "alt",
            "opt",
            "rect",
            "note",
            "classDef",
            "style",
            "click",
          ];

          const suggestions: any[] = keywords.map((k) => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            range: range,
          }));

          const SNIPPETS = [
            {
              label: "Flowchart (TD)",
              insertText:
                "graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]",
              detail: "Top-Down Flowchart",
            },
            {
              label: "Flowchart (LR)",
              insertText:
                "graph LR\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]",
              detail: "Left-Right Flowchart",
            },
            {
              label: "Sequence Diagram",
              insertText:
                "sequenceDiagram\n    participant Alice\n    participant Bob\n    Alice->>John: Hello John, how are you?\n    loop Healthcheck\n        John->>John: Fight against hypochondria\n    end\n    Note right of John: Rational thoughts <br/>prevail!\n    John-->>Alice: Great!\n    John->>Bob: How about you?\n    Bob-->>John: Jolly good!",
              detail: "Interaction Diagram",
            },
            {
              label: "Class Diagram",
              insertText:
                "classDiagram\n    Animal <|-- Duck\n    Animal <|-- Fish\n    Animal <|-- Zebra\n    class Animal{\n        +int age\n        +String gender\n        +isMammal()\n        +mate()\n    }\n    class Duck{\n        +String beakColor\n        +swim()\n        +quack()\n    }",
              detail: "OO Structure",
            },
            {
              label: "State Diagram",
              insertText:
                "stateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n    Still --> Moving\n    Moving --> Still\n    Moving --> Crash\n    Crash --> [*]",
              detail: "State Machine",
            },
            {
              label: "ER Diagram",
              insertText:
                "erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses",
              detail: "Entity Relationship",
            },
            {
              label: "Gantt Chart",
              insertText:
                "gantt\n    title A Gantt Diagram\n    dateFormat  YYYY-MM-DD\n    section Section\n    A task           :a1, 2014-01-01, 30d\n    Another task     :after a1  , 20d\n    section Another\n    Task in sec      :2014-01-12  , 12d\n    another task      : 24d",
              detail: "Project Schedule",
            },
            {
              label: "Pie Chart",
              insertText:
                'pie title Pets adopted by volunteers\n    "Dogs" : 386\n    "Cats" : 85\n    "Rats" : 15',
              detail: "Circular Statistics",
            },
            {
              label: "Mindmap",
              insertText:
                "mindmap\n  root((mindmap))\n    Origins\n      Long history\n      ::icon(fa fa-book)\n      Popularisation\n        British popular psychology author Tony Buzan\n    Research\n      On effectiveness<br/>and features\n      On Automatic creation\n        Uses\n            Creative techniques\n            Strategic planning\n            Argument mapping",
              detail: "Brainstorming",
            },
            {
              label: "GitGraph",
              insertText:
                "gitGraph\n    commit\n    commit\n    branch develop\n    checkout develop\n    commit\n    commit\n    checkout main\n    merge develop\n    commit",
              detail: "Git History",
            },
            {
              label: "User Journey",
              insertText:
                "journey\n    title My working day\n    section Go to work\n      Make tea: 5: Me\n      Go upstairs: 3: Me\n      Do work: 1: Me, Cat\n    section Go home\n      Go downstairs: 5: Me\n      Sit down: 5: Me",
              detail: "User Experience",
            },
          ];

          SNIPPETS.forEach((snippet) => {
            suggestions.push({
              label: snippet.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: snippet.insertText,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
              detail: snippet.detail,
            });
          });

          return { suggestions };
        },
      });

      // Hover Provider
      const HOVER_CONTENTS: Record<string, string> = {
        graph:
          "**Flowchart**\n\nDeclares a new graph. Directions: `TD` (Top-Down), `LR` (Left-Right), etc.",
        flowchart: "**Flowchart**\n\nDeclares a new flowchart (newer syntax).",
        sequenceDiagram:
          "**Sequence Diagram**\n\nAn interaction diagram that shows how processes operate with one another and in what order.",
        classDiagram:
          "**Class Diagram**\n\nDescribes the structure of a system by showing the system's classes, their attributes, operations (or methods), and the relationships among objects.",
        stateDiagram:
          "**State Diagram**\n\nDescribes the behavior of a system.",
        "stateDiagram-v2":
          "**State Diagram**\n\nDescribes the behavior of a system (Version 2).",
        erDiagram:
          "**Entity Relationship Diagram**\n\nDescribes the structure of a database.",
        gantt:
          "**Gantt Chart**\n\nA type of bar chart that illustrates a project schedule.",
        pie: "**Pie Chart**\n\nCircular statistical graphic.",
        subgraph: "**Subgraph**\n\nPartition the graph into a subgraph.",
        end: "**End**\n\nCloses a block (like `subgraph`).",
        participant:
          "**Participant**\n\nDefine a participant in a sequence diagram.",
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
            contents: [{ value: content }],
          };
        },
      });

      // Formatting Provider (Basic Indenter)
      monaco.languages.registerDocumentFormattingEditProvider("mermaid", {
        provideDocumentFormattingEdits: (model: any) => {
          const text = model.getValue();
          const lines = text.split("\n");
          const formattedLines = [];
          let indentLevel = 0;
          const indentSize = 4; // 4 spaces

          const blockOpeners =
            /^(graph|flowchart|subgraph|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gantt|pie|journey|mindmap|timeline|block-beta)\b/;
          const blockClosers = /^end\b/;

          for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            if (line.length === 0) {
              formattedLines.push("");
              continue;
            }

            // Decrease indent before checking openers (for 'end')
            if (blockClosers.test(line)) {
              indentLevel = Math.max(0, indentLevel - 1);
            }

            const indent = " ".repeat(indentLevel * indentSize);
            formattedLines.push(indent + line);

            // Increase indent for next line
            if (blockOpeners.test(line)) {
              indentLevel++;
            }
          }

          return [
            {
              range: model.getFullModelRange(),
              text: formattedLines.join("\n"),
            },
          ];
        },
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-secondary relative overflow-hidden group">
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
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
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
