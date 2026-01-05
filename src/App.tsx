import { useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { MermaidEditor } from "@/components/MermaidEditor";
import { MermaidViewer } from "@/components/MermaidViewer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

function App() {
  const [diagram, setDiagram] = useState(DEFAULT_DIAGRAM);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  const handleRenderComplete = useCallback(
    (svgElement: SVGSVGElement | null) => {
      svgElementRef.current = svgElement;
    },
    []
  );

  const svgToImage = async (svgElement: SVGSVGElement): Promise<Blob> => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Fill white background for better export
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
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

  const handleCopyImage = async () => {
    if (!svgElementRef.current) {
      toast.error("Oops! No diagram to copy.", {
        description:
          "No diagram to copy. Please ensure the diagram is rendered correctly.",
      });
      return;
    }

    try {
      const blob = await svgToImage(svgElementRef.current);

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        toast.success("Success!", {
          description: "Image copied to clipboard!",
        });
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (error) {
      console.error("Failed to copy image:", error);
      toast.error("Oops! Failed to copy image.", {
        description: "Your browser may not support this feature.",
      });
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

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="h-screen flex flex-col overflow-hidden">
        <Header
          onDownloadImage={handleDownloadImage}
          onCopyImage={handleCopyImage}
          onCopyText={handleCopyText}
        />
        <div className="flex-1 grid grid-cols-[40%_60%] overflow-hidden">
          <MermaidEditor value={diagram} onChange={setDiagram} />
          <MermaidViewer
            diagram={diagram}
            onRenderComplete={handleRenderComplete}
          />
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

export default App;
