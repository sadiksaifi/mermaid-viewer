import { useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { MermaidEditor } from "@/components/MermaidEditor";
import { MermaidViewer } from "@/components/MermaidViewer";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { EXPORT_CONFIG } from "./config";
import { renderMermaidAscii } from "beautiful-mermaid";

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

function App() {
  const [diagram, setDiagram] = useState(DEFAULT_DIAGRAM);
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  const handleRenderComplete = useCallback(
    (svgElement: SVGSVGElement | null) => {
      svgElementRef.current = svgElement;
    },
    []
  );

  const toggleFullscreen = useCallback(() => {
    setIsViewerFullscreen((prev) => !prev);
  }, []);

  const svgToImage = async (
    svgElement: SVGSVGElement,
    scale: number = EXPORT_CONFIG.scale
  ): Promise<Blob> => {
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Get dimensions from the original SVG
    const bbox = svgElement.getBBox();
    const width = svgElement.width.baseVal.value || bbox.width + bbox.x * 2;
    const height = svgElement.height.baseVal.value || bbox.height + bbox.y * 2;

    // Set explicit dimensions on the cloned SVG (scaled up for higher resolution)
    clonedSvg.setAttribute("width", String(width * scale));
    clonedSvg.setAttribute("height", String(height * scale));

    // Remove external font references that cause canvas tainting
    const styleElements = clonedSvg.querySelectorAll("style");
    styleElements.forEach((style) => {
      style.textContent = (style.textContent || "")
        .replace(/@import[^;]+;/g, "")
        .replace(/@font-face\s*\{[^}]*url\s*\([^)]*https?:[^}]*\}/g, "");
    });

    // Add xmlns attribute if missing (required for standalone SVG)
    if (!clonedSvg.getAttribute("xmlns")) {
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    // Serialize the cleaned SVG and convert to data URL (same-origin, avoids tainting)
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
    const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = (width || img.width) * scale;
        canvas.height = (height || img.height) * scale;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Fill white background for better export
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        }, "image/png");
      };

      img.onerror = () => {
        reject(new Error("Failed to load SVG"));
      };

      img.src = svgUrl;
    });
  };

  const handleDownloadImage = async () => {
    if (!svgElementRef.current) {
      toast.error("Oops! No diagram to download.", {
        description:
          "No diagram to download. Please ensure the diagram is rendered correctly.",
      });
      return;
    }

    try {
      const blob = await svgToImage(svgElementRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mermaid-diagram.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);

      toast.error("Oops! Failed to download image.", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const handleCopyImage = async (): Promise<boolean> => {
    if (!svgElementRef.current) {
      toast.error("Oops! No diagram to copy.", {
        description:
          "No diagram to copy. Please ensure the diagram is rendered correctly.",
      });
      return false;
    }

    try {
      const blob = await svgToImage(svgElementRef.current);

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        return true;
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (error) {
      console.error("Failed to copy image:", error);
      toast.error("Oops! Failed to copy image.", {
        description: "Your browser may not support this feature.",
      });
      return false;
    }
  };

  const handleCopyText = () => {
    if (!diagram.trim()) {
      toast.error("No diagram to copy.");
      return;
    }

    navigator.clipboard
      .writeText(diagram)
      .then(() => {
        toast.success("Mermaid code copied to clipboard!");
      })
      .catch((error) => {
        console.error("Failed to copy text:", error);
        toast.error("Failed to copy Mermaid code. Please try again.");
      });
  };

  const handleCopyAscii = async (): Promise<boolean> => {
    if (!diagram.trim()) {
      toast.error("No diagram to copy.");
      return false;
    }

    try {
      const ascii = await renderMermaidAscii(diagram);
      await navigator.clipboard.writeText(ascii);
      return true;
    } catch (error) {
      console.error("Failed to generate ASCII:", error);
      toast.error("Oops! Failed to generate ASCII.", {
        description: "Could not convert this diagram to ASCII.",
      });
      return false;
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header
          onDownloadImage={handleDownloadImage}
          onCopyImage={handleCopyImage}
          onCopyText={handleCopyText}
          onCopyAscii={handleCopyAscii}
        />
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 overflow-hidden"
        >
          {!isViewerFullscreen && (
            <>
              <ResizablePanel defaultSize={40} minSize={20}>
                <MermaidEditor value={diagram} onChange={setDiagram} />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          <ResizablePanel defaultSize={60} minSize={20}>
            <MermaidViewer
              diagram={diagram}
              onRenderComplete={handleRenderComplete}
              isFullscreen={isViewerFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

export default App;
