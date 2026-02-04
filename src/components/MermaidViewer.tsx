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
  const [currentScale, setCurrentScale] = useState<number>(
    ZOOM_CONFIG.initialScale,
  );

  const { theme } = useTheme();
  const [mermaidTheme, setMermaidTheme] = useState<"default" | "dark">(
    "default",
  );

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
      fontFamily: "Inter, -apple-system, sans-serif",
    });
  }, [theme]);

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

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (!isMounted || !mermaidRef.current) return;

      const currentRef = mermaidRef.current;

      if (!diagram.trim()) {
        if (currentRef) currentRef.innerHTML = "";
        setError(null);
        setIsRendering(false);
        onRenderComplete?.(null);
        return;
      }

      setIsRendering(true);
      setError(null);

      try {
        if (currentRef) currentRef.innerHTML = "";
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, diagram);

        if (!isMounted || !mermaidRef.current) {
          setIsRendering(false);
          return;
        }

        mermaidRef.current.innerHTML = svg;
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

    const timeoutId = setTimeout(renderDiagram, 300);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [diagram, onRenderComplete, mermaidTheme]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex flex-col bg-muted/5 relative overflow-hidden group/viewer"
    >
      {/* Header */}
      {!isFullscreen && (
        <div className="h-9 border-b border-border/40 flex items-center justify-between px-4 shrink-0 z-10 relative bg-secondary">
          <div className="flex items-center gap-2">
            <Eye className="size-3.5 text-muted-foreground/70" />
            <span className="text-xs font-medium text-muted-foreground/70">
              Preview
            </span>
          </div>

          {/* Minimal Status */}
          <div className="flex items-center gap-2">
            {isRendering ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">
                  Render...
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-1.5 text-red-500">
                <div className="size-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-medium">Error</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-500/80">
                <div className="size-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_4px_currentColor]" />
                <span className="text-[10px] font-medium">Live</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden bg-tertiary">
        <div className="absolute inset-0 bg-grid-pattern-small pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-50" />

        <TransformWrapper
          initialScale={ZOOM_CONFIG.initialScale}
          minScale={ZOOM_CONFIG.minScale}
          maxScale={ZOOM_CONFIG.maxScale}
          onTransformed={(e) => setCurrentScale(e.state.scale)}
          wheel={{
            step: Math.max(currentScale * ZOOM_CONFIG.wheelStep, 0.1),
            smoothStep: Math.max(
              currentScale * ZOOM_CONFIG.wheelSmoothStep,
              0.001,
            ),
          }}
          zoomAnimation={{
            animationTime: ZOOM_CONFIG.animationTime,
            animationType: "easeOut",
          }}
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Apple-style Floating Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center p-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-lg shadow-black/5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => zoomOut(currentScale * ZOOM_CONFIG.buttonStep)}
                  className="rounded-full size-8 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ZoomOut className="size-4" />
                </Button>

                <div className="w-[3rem] text-center font-medium text-xs text-muted-foreground select-none tabular-nums">
                  {Math.round(currentScale * 100)}%
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => zoomIn(currentScale * ZOOM_CONFIG.buttonStep)}
                  className="rounded-full size-8 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ZoomIn className="size-4" />
                </Button>

                <div className="w-px h-3 bg-border mx-1" />

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => resetTransform()}
                  className="rounded-full size-8 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                </Button>

                {onToggleFullscreen && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleFullscreen}
                    className="rounded-full size-8 hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize className="size-3.5" />
                    ) : (
                      <Maximize className="size-3.5" />
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
                  <div
                    ref={mermaidRef}
                    className="mermaid-container transition-all duration-500 ease-out"
                    style={{
                      opacity: isRendering ? 0.4 : 1,
                      filter: isRendering ? "blur(8px)" : "none",
                      transform: isRendering ? "scale(0.98)" : "scale(1)",
                    }}
                  />

                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                      <div className="max-w-sm w-full mx-4 p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-red-200/50 dark:border-red-900/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            <AlertCircle className="size-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-foreground mb-1">
                              Syntax Error
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono leading-relaxed break-all">
                              {error}
                            </p>
                          </div>
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
