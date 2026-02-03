import { Button } from "@/components/ui/button";
import { Download, Copy, FileText, Check, Command } from "lucide-react";
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
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
    >
      {isCopied ? <Check className="size-4" /> : <Icon className="size-4" />}
      <span className="hidden md:inline text-sm font-medium">{isCopied ? "Copied" : label}</span>
    </Button>
  );
}

export function Header({
  onDownloadImage,
  onCopyImage,
  onCopyAscii,
}: HeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-background/60 backdrop-blur-xl sticky top-0 z-50 border-b border-border/40">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
          <Command className="size-4" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          Mermaid Viewer
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <CopyButton
          onClick={onCopyAscii}
          icon={FileText}
          label="ASCII"
        />
        <CopyButton
          onClick={onCopyImage}
          icon={Copy}
          label="Copy Image"
        />
        <Button
          variant="default"
          size="sm"
          onClick={onDownloadImage}
          className="gap-2 ml-2 rounded-full px-4 h-8"
        >
          <Download className="size-3.5" />
          <span className="hidden md:inline text-xs font-medium">Export</span>
        </Button>
        
        <div className="ml-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}