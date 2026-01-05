import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import mermaid from "mermaid";

interface MermaidViewerProps {
  diagram: string;
  onRenderComplete?: (svgElement: SVGSVGElement | null) => void;
}

export function MermaidViewer({ diagram, onRenderComplete }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });
  }, []);

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
    window.addEventListener("resize", updateContentSize);
    return () => window.removeEventListener("resize", updateContentSize);
  }, []);

  // Render Mermaid diagram
  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
        
        const errorMessage = err instanceof Error ? err.message : "Failed to render diagram";
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
  }, [diagram, onRenderComplete]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={4}
        wheel={{ step: 0.1 }}
        panning={{ disabled: false }}
        doubleClick={{ disabled: false }}
        centerOnInit={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-accent text-sm font-medium"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => zoomOut()}
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
                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
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

