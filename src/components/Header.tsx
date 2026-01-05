import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

interface HeaderProps {
  onDownloadImage: () => void;
  onCopyImage: () => void;
  onCopyText: () => void;
}

export function Header({
  onDownloadImage,
  onCopyImage,
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
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadImage}
          className="gap-2"
        >
          <Download className="size-4" />
          Download Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyImage}
          className="gap-2"
        >
          <Copy className="size-4" />
          Copy Image
        </Button>
      </div>
    </header>
  );
}
