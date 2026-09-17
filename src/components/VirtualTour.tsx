import { useEffect, useRef, useState, useCallback } from "react";
import { Viewer, events as coreEvents } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin, events as tourEvents } from "@photo-sphere-viewer/virtual-tour-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import { tourNodes, LOGO_URL, type TourNode } from "@/tour-data";
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Info,
  X,
  Compass,
  Move,
} from "lucide-react";

type Props = {
  onNodeChange: (node: TourNode) => void;
  onReady: () => void;
  onProgress: (progress: number) => void;
};

export default function VirtualTour({ onNodeChange, onReady, onProgress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const markersRef = useRef<MarkersPlugin | null>(null);
  const videoMarkerRef = useRef<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentNode, setCurrentNode] = useState<TourNode>(tourNodes[0]);

  const createVideoElement = useCallback((node: TourNode): HTMLElement => {
    const wrapper = document.createElement("div");
    wrapper.className = "video-marker-wrapper";
    wrapper.style.width = `${node.videoSize?.width ?? 600}px`;
    wrapper.style.height = `${node.videoSize?.height ?? 340}px`;

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${node.videoId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1`;
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    wrapper.appendChild(iframe);

    return wrapper;
  }, []);

  const updateVideoMarker = useCallback(
    (node: TourNode) => {
      if (!markersRef.current) return;

      if (videoMarkerRef.current) {
        try {
          markersRef.current.removeMarker(videoMarkerRef.current, false);
        } catch {
          // marker may not exist
        }
        videoMarkerRef.current = null;
      }

      if (node.hasVideo && node.videoId) {
        const videoEl = createVideoElement(node);
        const markerId = `video-${node.id}`;
        markersRef.current.addMarker(
          {
            id: markerId,
            elementLayer: videoEl as any,
            position: [
              {
                yaw: node.videoPosition?.yaw ?? 0,
                pitch: node.videoPosition?.pitch ?? 0,
              },
              { yaw: (node.videoPosition?.yaw ?? 0) + 0.01, pitch: 0 },
              { yaw: (node.videoPosition?.yaw ?? 0) + 0.01, pitch: 0.01 },
              { yaw: node.videoPosition?.yaw ?? 0, pitch: 0.01 },
            ],
            size: { width: node.videoSize?.width ?? 600, height: node.videoSize?.height ?? 340 },
            visible: true,
          },
          true,
        );
        videoMarkerRef.current = markerId;
      }
    },
    [createVideoElement],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Viewer({
      container: containerRef.current,
      defaultZoomLvl: 50,
      navbar: ["zoom", "fullscreen"],
      mousewheelCtrlKey: false,
      mousemove: true,
      touchmoveTwoFingers: false,
      canvasBackground: "#0a1628",
      plugins: [
        [MarkersPlugin, { markers: [] }],
        [
          VirtualTourPlugin,
          {
            nodes: tourNodes.map((n) => ({
              id: n.id,
              panorama: n.panorama,
              name: n.name,
              caption: n.title,
              links: n.links.map((l) => ({
                nodeId: l.nodeId,
                position: l.position,
              })),
            })),
            startNodeId: tourNodes[0].id,
            renderMode: "3d",
            positionMode: "manual",
            dataMode: "client",
            preload: true,
            showLinkTooltip: true,
          },
        ],
      ],
    });

    viewerRef.current = viewer;

    const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin | null;
    if (markersPlugin) {
      markersRef.current = markersPlugin;
    }

    const tourPlugin = viewer.getPlugin(VirtualTourPlugin) as VirtualTourPlugin | null;

    viewer.addEventListener("load-progress", (e: any) => {
      onProgress(e.progress);
    });

    viewer.addEventListener(coreEvents.ReadyEvent.type, () => {
      onReady();
    });

    viewer.addEventListener(coreEvents.PanoramaLoadedEvent.type, () => {
      onReady();
    });

    viewer.addEventListener(coreEvents.PanoramaErrorEvent.type, () => {
      onReady();
    });

    if (tourPlugin) {
      tourPlugin.addEventListener(tourEvents.NodeChangedEvent.type, (e: any) => {
        const matched = tourNodes.find((n) => n.id === e.node.id);
        if (matched) {
          setCurrentNode(matched);
          onNodeChange(matched);
          updateVideoMarker(matched);
        }
      });
    }

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const iframes = containerRef.current?.querySelectorAll("iframe");
      iframes?.forEach((iframe) => {
        const src = iframe.getAttribute("src") || "";
        if (src.includes("youtube.com/embed/")) {
          const newSrc = src.replace(/mute=[01]/, `mute=${next ? 1 : 0}`);
          iframe.setAttribute("src", newSrc);
        }
      });
      return next;
    });
  }, []);

  const goToNode = useCallback(
    (direction: "prev" | "next") => {
      const tourPlugin = viewerRef.current?.getPlugin(VirtualTourPlugin) as any;
      if (!tourPlugin) return;
      const current = tourPlugin.getCurrentNode();
      const idx = tourNodes.findIndex((n) => n.id === current.id);
      if (idx === -1) return;
      const nextIdx = direction === "next" ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= tourNodes.length) return;
      tourPlugin.setCurrentNode(tourNodes[nextIdx].id);
    },
    [],
  );

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="pointer-events-auto animate-fade-in">
            <img
              src={LOGO_URL}
              alt="EMAV"
              className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
            />
          </div>

          {/* Room title */}
          <div className="pointer-events-auto glass-panel rounded-full px-6 py-2.5 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
              <span className="font-display text-lg font-semibold tracking-wide text-white">
                {currentNode.title}
              </span>
              <span className="text-sm text-slate-400 font-light">
                {currentNode.subtitle}
              </span>
            </div>
          </div>

          {/* Info button */}
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="pointer-events-auto glass-panel rounded-full p-2.5 hover:bg-cyan-500/20 transition-colors duration-200 animate-fade-in"
            aria-label="Informació"
          >
            <Info className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="absolute top-20 right-6 z-30 w-80 animate-scale-in">
          <div className="glass-panel rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-white">
                {currentNode.title}
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {currentNode.subtitle}. Navega per l'espai 360° arrossegant el ratolí
              o lliscant amb el dit. Utilitza les fletxes per moure't entre les
              diferents sales.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Move className="w-4 h-4 text-cyan-400" />
                <span>Arrossega per girar la càmera</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Fes clic a les fletxes per canviar de sala</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-center gap-3 pb-6">
          <button
            onClick={() => goToNode("prev")}
            disabled={tourNodes.findIndex((n) => n.id === currentNode.id) === 0}
            className="pointer-events-auto glass-panel rounded-full p-3 hover:bg-cyan-500/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
            aria-label="Sala anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Room indicators */}
          <div className="pointer-events-auto glass-panel rounded-full px-4 py-2.5 flex items-center gap-2">
            {tourNodes.map((node, i) => (
              <div key={node.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-300 ${
                    node.id === currentNode.id
                      ? "bg-cyan-500/20 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      node.id === currentNode.id
                        ? "bg-cyan-400 scale-125"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="text-xs font-medium">{node.name}</span>
                </div>
                {i < tourNodes.length - 1 && (
                  <div className="w-4 h-px bg-slate-600" />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => goToNode("next")}
            disabled={
              tourNodes.findIndex((n) => n.id === currentNode.id) ===
              tourNodes.length - 1
            }
            className="pointer-events-auto glass-panel rounded-full p-3 hover:bg-cyan-500/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
            aria-label="Sala següent"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Right-side floating controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 pointer-events-auto">
          {currentNode.hasVideo && (
            <button
              onClick={toggleMute}
              className="glass-panel rounded-full p-3 hover:bg-cyan-500/20 transition-all duration-200 hover:scale-105"
              aria-label={muted ? "Activa el so" : "Silencia"}
            >
              {muted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="glass-panel rounded-full p-3 hover:bg-cyan-500/20 transition-all duration-200 hover:scale-105"
            aria-label="Pantalla completa"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
