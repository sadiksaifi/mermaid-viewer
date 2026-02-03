import { Code2 } from "lucide-react";

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MermaidEditor({ value, onChange }: MermaidEditorProps) {
  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden group">
      {/* Minimal Header */}
      <div className="h-9 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="size-3.5 text-muted-foreground/70" />
          <span className="text-xs font-medium text-muted-foreground/70">
            Source
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground/50 font-mono">
          {value.split('\n').length} lines
        </div>
      </div>

      <div className="flex-1 relative bg-muted/5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="graph TD..."
          className="absolute inset-0 w-full h-full resize-none border-0 outline-none p-4 md:p-6 font-mono text-[13px] leading-6 bg-transparent text-foreground placeholder:text-muted-foreground/30 focus:ring-0 selection:bg-zinc-200 dark:selection:bg-zinc-800 custom-scrollbar"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
    </div>
  );
}