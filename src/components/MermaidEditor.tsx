import { FileCode, Hash } from "lucide-react";

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MermaidEditor({ value, onChange }: MermaidEditorProps) {
  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Editor Toolbar */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-muted/10 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
            Editor
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded-sm">
          <Hash className="size-3 opacity-50" />
          <span>{value.split('\n').length} LINES</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="graph TD
    A[Start] --> B[End]"
          className="absolute inset-0 w-full h-full resize-none border-0 outline-none p-4 md:p-6 font-mono text-sm leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:ring-0 selection:bg-primary/20 selection:text-primary scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent"
          spellCheck={false}
        />
      </div>
    </div>
  );
}