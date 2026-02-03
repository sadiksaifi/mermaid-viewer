import { useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { MermaidEditor } from "@/components/MermaidEditor";
import { MermaidViewer } from "@/components/MermaidViewer";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { EXPORT_CONFIG } from "./config";
import { renderMermaidAscii } from "beautiful-mermaid";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { cn } from "./lib/utils";
import mermaid from "mermaid";

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
  const editorPanelRef = useRef<ImperativePanelHandle>(null);
  const { theme } = useTheme();

  const handleRenderComplete = useCallback(
    (svgElement: SVGSVGElement | null) => {
      svgElementRef.current = svgElement;
    },
    [],
  );

  const toggleFullscreen = useCallback(() => {
    const panel = editorPanelRef.current;
    if (panel) {
      if (isViewerFullscreen) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  }, [isViewerFullscreen]);

  const renderLightMermaid = async (
    diagramText: string,
  ): Promise<SVGSVGElement> => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const currentTheme = isDark ? "dark" : "default";

    // Initialize with default (light) theme for export
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Inter, -apple-system, sans-serif",
    });

    try {
      const id = `mermaid-export-${Date.now()}`;
      const { svg } = await mermaid.render(id, diagramText);

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, "image/svg+xml");
      return doc.documentElement as unknown as SVGSVGElement;
    } finally {
      // Restore the user's theme
      mermaid.initialize({
        startOnLoad: false,
        theme: currentTheme,
        securityLevel: "loose",
        fontFamily: "Inter, -apple-system, sans-serif",
      });
    }
  };

  const svgToImage = async (
    svgElement: SVGSVGElement,
    scale: number = EXPORT_CONFIG.scale,
  ): Promise<Blob> => {
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Get dimensions using viewBox (preferred) or getBBox to ensure we get the full content size
    // and not just the displayed size (which might be constrained by container)
    const viewBox = svgElement.viewBox.baseVal;
    let sourceWidth = viewBox?.width;
    let sourceHeight = viewBox?.height;
    let sourceX = viewBox?.x ?? 0;
    let sourceY = viewBox?.y ?? 0;

    // Fallback to getBBox if viewBox is missing/empty
    if (!sourceWidth || !sourceHeight) {
      // Note: getBBox might fail if the element is not in the DOM
      // Since we are using a fresh SVG from parser, we might need to append it briefly or rely on attributes
      // But typically mermaid output has viewBox or width/height attributes.
      try {
        const bbox = svgElement.getBBox();
        sourceWidth = bbox.width;
        sourceHeight = bbox.height;
        sourceX = bbox.x;
        sourceY = bbox.y;

        // Update viewBox to match the bbox if we had to fallback
        clonedSvg.setAttribute(
          "viewBox",
          `${sourceX} ${sourceY} ${sourceWidth} ${sourceHeight}`,
        );
      } catch (e) {
        // If getBBox fails (e.g. element not in DOM), try attributes
        console.warn("getBBox failed, falling back to attributes", e);
      }
    }

    // Last fallback to attributes
    if (!sourceWidth || !sourceHeight) {
      const w = svgElement.getAttribute("width");
      const h = svgElement.getAttribute("height");
      if (w) sourceWidth = parseFloat(w);
      if (h) sourceHeight = parseFloat(h);
    }
    
    // If still no dimensions, try max-width/style (mermaid specific) or default
    if (!sourceWidth || !sourceHeight) {
        // Try to parse from style if available
        const styleMaxWidth = svgElement.style.maxWidth;
        if (styleMaxWidth && styleMaxWidth.endsWith('px')) {
            sourceWidth = parseFloat(styleMaxWidth);
        }
        // If all else fails, default to a reasonable size or throw
        if (!sourceWidth) sourceWidth = 800;
        if (!sourceHeight) sourceHeight = 600;
    }


    // Remove any style constraints (like max-width) that Mermaid might add
    clonedSvg.style.maxWidth = "none";
    clonedSvg.style.maxHeight = "none";

    // Ensure the SVG scales to fill our new canvas
    clonedSvg.setAttribute("width", "100%");
    clonedSvg.setAttribute("height", "100%");

    // Calculate target dimensions with a safety cap to prevent canvas crashes
    const MAX_DIMENSION = 10000;
    let targetWidth = sourceWidth * scale;
    let targetHeight = sourceHeight * scale;

    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
      const aspect = targetWidth / targetHeight;
      if (targetWidth > targetHeight) {
        targetWidth = MAX_DIMENSION;
        targetHeight = MAX_DIMENSION / aspect;
      } else {
        targetHeight = MAX_DIMENSION;
        targetWidth = MAX_DIMENSION * aspect;
      }
    }

    // Set explicit dimensions on the cloned SVG for serialization
    clonedSvg.setAttribute("width", String(targetWidth));
    clonedSvg.setAttribute("height", String(targetHeight));

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
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Fill white background for better export
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image filling the canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

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
    if (!diagram.trim()) {
      toast.error("Oops! No diagram to download.");
      return;
    }

    try {
      const lightSvg = await renderLightMermaid(diagram);
      const blob = await svgToImage(lightSvg);
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
    if (!diagram.trim()) {
      toast.error("Oops! No diagram to copy.");
      return false;
    }

    try {
      const lightSvg = await renderLightMermaid(diagram);
      const blob = await svgToImage(lightSvg);

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

  const handleCopySvg = async (): Promise<boolean> => {
    if (!diagram.trim()) {
      toast.error("Oops! No diagram to copy.");
      return false;
    }

    try {
      const lightSvg = await renderLightMermaid(diagram);
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(lightSvg);
      await navigator.clipboard.writeText(svgString);
      return true;
    } catch (error) {
      console.error("Failed to copy SVG:", error);
      toast.error("Oops! Failed to copy SVG.", {
        description: "Failed to copy SVG code to clipboard.",
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
          onCopySvg={handleCopySvg}
          onCopyText={handleCopyText}
          onCopyAscii={handleCopyAscii}
        />
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 overflow-hidden"
        >
          <ResizablePanel
            ref={editorPanelRef}
            defaultSize={40}
            minSize={20}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setIsViewerFullscreen(true)}
            onExpand={() => setIsViewerFullscreen(false)}
          >
            <MermaidEditor value={diagram} onChange={setDiagram} />
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className={cn("dark:w-0.5 dark:bg-background", isViewerFullscreen ? "hidden" : "")}
          />

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
      <Toaster richColors position="bottom-right" theme={theme} />
    </ThemeProvider>
  );
}

export default App;
