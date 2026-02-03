import { Button } from "@/components/ui/button";
import { Download, Copy, FileText, Check } from "lucide-react";
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
      className="gap-2 min-w-[120px]"
    >
      {isCopied ? <Check className="size-4" /> : <Icon className="size-4" />}
      {isCopied ? "Copied!" : label}
    </Button>
  );
}

export function Header({
  onDownloadImage,
  onCopyImage,
  onCopyAscii,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
      <div className="flex items-center">
        <ModeToggle />
        <h1 className="text-xl font-semibold text-foreground">
          Mermaid Viewer
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <CopyButton
          onClick={onCopyAscii}
          icon={FileText}
          label="Copy ASCII"
        />
        <CopyButton
          onClick={onCopyImage}
          icon={Copy}
          label="Copy Image"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadImage}
          className="gap-2"
        >
          <Download className="size-4" />
          Download Image
        </Button>
      </div>
    </header>
  );
}
