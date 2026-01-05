interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MermaidEditor({ value, onChange }: MermaidEditorProps) {
  return (
    <div className="h-full flex flex-col border-r border-border overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter Mermaid diagram syntax here..."
        className="w-full h-full resize-none border-0 outline-none p-4 font-mono text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-0 overflow-y-auto"
      />
    </div>
  );
}

