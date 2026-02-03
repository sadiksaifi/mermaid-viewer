import { Button } from "@/components/ui/button";
import { Download, Copy, FileText, Command, ChevronDown, Code } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface HeaderProps {
  onDownloadImage: () => void;
  onCopyImage: () => Promise<boolean>;
  onCopySvg: () => Promise<boolean>;
  onCopyText: () => void;
  onCopyAscii: () => Promise<boolean>;
}

export function Header({
  onDownloadImage,
  onCopyImage,
  onCopySvg,
  onCopyAscii,
}: HeaderProps) {
  const handleCopy = async (action: () => Promise<boolean>, label: string) => {
    const success = await action();
    if (success) {
      toast.success(`${label} copied to clipboard`);
    }
  };

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

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <ButtonGroup variant="outline">
            <Button onClick={onDownloadImage} className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="px-2">
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </ButtonGroup>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCopy(onCopyImage, "Image")}>
              <Copy className="mr-2 size-4" />
              Copy Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy(onCopySvg, "SVG")}>
              <Code className="mr-2 size-4" />
              Copy SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy(onCopyAscii, "ASCII")}>
              <FileText className="mr-2 size-4" />
              Copy ASCII
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="ml-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}