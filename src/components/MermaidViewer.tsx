import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import mermaid from "mermaid";
import { Maximize, Minimize } from "lucide-react";
import { ZOOM_CONFIG } from "../config";
import { useTheme } from "@/components/theme-provider";

interface MermaidViewerProps {
  diagram: string;
  onRenderComplete?: (svgElement: SVGSVGElement | null) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function MermaidViewer({
  diagram,
  onRenderComplete,
  isFullscreen = false,
  onToggleFullscreen,
}: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScale, setCurrentScale] = useState<number>(ZOOM_CONFIG.initialScale);

  const { theme } = useTheme();
  const [mermaidTheme, setMermaidTheme] = useState<"default" | "dark">("default");

  // Initialize Mermaid and handle theme changes
  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const newTheme = isDark ? "dark" : "default";

    setMermaidTheme(newTheme);

    mermaid.initialize({
      startOnLoad: false,
      theme: newTheme,
      securityLevel: "loose",
    });
  }, [theme]);

  // Ensure content fills the viewport for panning
  useEffect(() => {
    const updateContentSize = () => {
      if (containerRef.current && contentRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        contentRef.current.style.minWidth = `${containerRect.width}px`;
        contentRef.current.style.minHeight = `${containerRect.height}px`;
      }
    };

    updateContentSize();

    const resizeObserver = new ResizeObserver(() => {
      updateContentSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Render Mermaid diagram
  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      // Small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (!isMounted || !mermaidRef.current) {
        return;
      }

      const currentRef = mermaidRef.current;

      if (!diagram.trim()) {
        if (currentRef) {
          currentRef.innerHTML = "";
        }
        setError(null);
        setIsRendering(false);
        onRenderComplete?.(null);
        return;
      }

      setIsRendering(true);
      setError(null);

      try {
        // Clear previous content
        if (currentRef) {
          currentRef.innerHTML = "";
        }

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, diagram);

        // Check if component is still mounted and ref is still valid
        if (!isMounted || !mermaidRef.current) {
          setIsRendering(false);
          return;
        }

        mermaidRef.current.innerHTML = svg;

        // Find the rendered SVG element
        const svgElement = mermaidRef.current?.querySelector("svg") || null;
        onRenderComplete?.(svgElement);

        setIsRendering(false);
      } catch (err) {
        if (!isMounted) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to render diagram";
        setError(errorMessage);
        setIsRendering(false);
        onRenderComplete?.(null);
      }
    };

    // Debounce rendering to avoid excessive re-renders
    const timeoutId = setTimeout(renderDiagram, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [diagram, onRenderComplete, mermaidTheme]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden bg-background">
      <TransformWrapper
        initialScale={ZOOM_CONFIG.initialScale}
        minScale={ZOOM_CONFIG.minScale}
        maxScale={ZOOM_CONFIG.maxScale}
        onTransformed={(e) => setCurrentScale(e.state.scale)}
        wheel={{
          step: Math.max(currentScale * ZOOM_CONFIG.wheelStep, 0.1),
          smoothStep: Math.max(currentScale * ZOOM_CONFIG.wheelSmoothStep, 0.001),
        }}
        zoomAnimation={{
          animationTime: ZOOM_CONFIG.animationTime,
          animationType: "easeOut",
        }}
        panning={{ disabled: false }}
        doubleClick={{ disabled: false }}
        centerOnInit={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={() => zoomIn(currentScale * ZOOM_CONFIG.buttonStep)}
                className="px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-accent text-sm font-medium"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => zoomOut(currentScale * ZOOM_CONFIG.buttonStep)}
                className="px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-accent text-sm font-medium"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => resetTransform()}
                className="px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-accent text-sm font-medium"
                title="Reset"
              >
                ↻
              </button>
              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-accent text-sm font-medium flex items-center justify-center"
                  title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            <TransformComponent
              wrapperClass="h-full w-full bg-background"
              contentClass="flex items-center justify-center"
            >
              <div
                ref={contentRef}
                className="flex items-center justify-center relative"
                style={{ width: "100%", height: "100%" }}
              >
                {/* Always render the mermaid container to keep ref attached */}
                <div
                  ref={mermaidRef}
                  className="mermaid-container"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
                {/* Overlay states */}
                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-muted-foreground">Rendering...</div>
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-destructive p-4 border border-destructive rounded-md max-w-md bg-background">
                      <div className="font-semibold mb-2">Render Error</div>
                      <div className="text-sm">{error}</div>
                    </div>
                  </div>
                )}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
