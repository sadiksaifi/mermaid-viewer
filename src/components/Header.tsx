import { Button } from "@/components/ui/button";
import { Download, Copy, FileText, Check, Terminal } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { useState } from "react";

interface HeaderProps {
  onDownloadImage: () => void;
  onCopyImage: () => Promise<boolean>;
  onCopyText: () => void;
  onCopyAscii: () => Promise<boolean>;
}

interface CopyButtonProps {
  onClick: () => Promise<boolean>;
  icon: React.ElementType;
  label: string;
}

function CopyButton({ onClick, icon: Icon, label }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = async () => {
    const success = await onClick();
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="gap-2 min-w-[40px] md:min-w-[120px] font-mono text-xs uppercase tracking-wider"
    >
      {isCopied ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
      <span className="hidden md:inline">{isCopied ? "Copied" : label}</span>
    </Button>
  );
}

export function Header({
  onDownloadImage,
  onCopyImage,
  onCopyAscii,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20">
            <Terminal className="size-5 text-primary" />
          </div>
          <h1 className="text-lg md:text-xl font-display font-bold tracking-tight text-foreground">
            MERMAID <span className="text-muted-foreground font-normal opacity-50">// VIEWER</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <CopyButton
          onClick={onCopyAscii}
          icon={FileText}
          label="ASCII"
        />
        <CopyButton
          onClick={onCopyImage}
          icon={Copy}
          label="Copy IMG"
        />
        <Button
          variant="default"
          size="sm"
          onClick={onDownloadImage}
          className="gap-2 font-mono text-xs uppercase tracking-wider shadow-[0_0_10px_-3px_var(--color-primary)]"
        >
          <Download className="size-3.5" />
          <span className="hidden md:inline">Export</span>
        </Button>
        
        <div className="w-px h-6 bg-border mx-1 hidden md:block" />
        
        <ModeToggle />
      </div>
    </header>
  );
}