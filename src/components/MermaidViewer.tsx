import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import mermaid from "mermaid";
import { 
  Maximize, 
  Minimize, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  Loader2, 
  AlertCircle, 
  CheckCircle2 
} from "lucide-react";
import { ZOOM_CONFIG } from "../config";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

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
      fontFamily: 'Manrope, sans-serif',
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
    <div ref={containerRef} className="h-full w-full flex flex-col bg-muted/5 relative overflow-hidden group/viewer">
      
      {/* Viewer Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-muted/10 shrink-0 z-10 relative backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Eye className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </span>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-2">
           {isRendering ? (
              <span className="text-[10px] text-amber-500 font-mono flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                 <Loader2 className="size-3 animate-spin" /> PROCESSING
              </span>
           ) : error ? (
              <span className="text-[10px] text-destructive font-mono flex items-center gap-1.5 bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                 <AlertCircle className="size-3" /> ERROR
              </span>
           ) : (
              <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 transition-opacity duration-500">
                 <CheckCircle2 className="size-3" /> READY
              </span>
           )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background Grid with Mask - Separated to avoid masking UI */}
        <div className="absolute inset-0 bg-grid-pattern-small [background-size:16px_16px] [mask-image:linear-gradient(to_bottom,white,transparent_100%)] pointer-events-none" />
        
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
              {/* Floating Controls */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl shadow-black/20 ring-1 ring-white/10 dark:ring-black/20">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => zoomOut(currentScale * ZOOM_CONFIG.buttonStep)}
                  className="rounded-full hover:bg-muted"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-4" />
                </Button>
                
                <div className="px-2 min-w-[3rem] text-center font-mono text-xs text-muted-foreground select-none">
                  {Math.round(currentScale * 100)}%
                </div>
                
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => zoomIn(currentScale * ZOOM_CONFIG.buttonStep)}
                  className="rounded-full hover:bg-muted"
                  title="Zoom In"
                >
                  <ZoomIn className="size-4" />
                </Button>

                <div className="w-px h-4 bg-border mx-1" />

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => resetTransform()}
                  className="rounded-full hover:bg-muted"
                  title="Reset View"
                >
                  <RotateCcw className="size-4" />
                </Button>

                {onToggleFullscreen && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleFullscreen}
                    className="rounded-full hover:bg-muted"
                    title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                  >
                    {isFullscreen ? (
                      <Minimize className="size-4" />
                    ) : (
                      <Maximize className="size-4" />
                    )}
                  </Button>
                )}
              </div>

              <TransformComponent
                wrapperClass="h-full w-full !bg-transparent"
                contentClass="flex items-center justify-center"
              >
                <div
                  ref={contentRef}
                  className="flex items-center justify-center relative min-w-full min-h-full py-20 px-20"
                >
                  {/* Container for Mermaid SVG */}
                  <div
                    ref={mermaidRef}
                    className="mermaid-container transition-opacity duration-300"
                    style={{
                      opacity: isRendering ? 0.5 : 1,
                      filter: isRendering ? 'blur(2px)' : 'none',
                    }}
                  />
                  
                  {/* Error Overlay */}
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/50 backdrop-blur-sm">
                      <div className="max-w-md w-full mx-4 p-4 rounded-lg border border-destructive/50 bg-destructive/5 text-destructive shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-2 font-semibold mb-2">
                          <AlertCircle className="size-4" />
                          <span>Rendering Error</span>
                        </div>
                        <div className="text-xs font-mono break-all opacity-90">
                          {error}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}