import { useState, useCallback, useEffect } from "react";
import VirtualTour from "@/components/VirtualTour";
import LoadingScreen from "@/components/LoadingScreen";
import type { TourNode } from "@/tour-data";

function App() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleReady = useCallback(() => {
    setReady((prev) => prev || true);
  }, []);

  useEffect(() => {
    const fallback = setTimeout(() => setReady(true), 15000);
    return () => clearTimeout(fallback);
  }, []);

  const handleNodeChange = useCallback((_node: TourNode) => {
    // could be used for analytics or other tracking
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a1628]">
      <VirtualTour
        onNodeChange={handleNodeChange}
        onReady={handleReady}
        onProgress={handleProgress}
      />
      <LoadingScreen progress={progress} ready={ready} />
    </div>
  );
}

export default App;
