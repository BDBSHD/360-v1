export type TourNode = {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  panorama: string;
  links: { nodeId: string; position: { yaw: number; pitch: number } }[];
  hasVideo?: boolean;
  videoId?: string;
  videoPosition?: { yaw: number; pitch: number };
  videoSize?: { width: number; height: number };
};

export const LOGO_URL = "https://360.emav.cat/assets/logo-color-text-blanc.png";

export const tourNodes: TourNode[] = [
  {
    id: "sala-1",
    name: "Sala 1",
    title: "Sala 1",
    subtitle: "Espai principal",
    panorama: "https://360.emav.cat/assets/img-360/foto-360-1.jpg",
    hasVideo: true,
    videoId: "C2FVKd0EiXg",
    videoPosition: { yaw: -0.3, pitch: 0 },
    videoSize: { width: 600, height: 340 },
    links: [
      { nodeId: "sala-2", position: { yaw: 1.2, pitch: 0 } },
    ],
  },
  {
    id: "sala-2",
    name: "Sala 2",
    title: "Sala 2",
    subtitle: "Segon espai",
    panorama: "https://360.emav.cat/assets/img-360/foto-360-2.jpg",
    links: [
      { nodeId: "sala-1", position: { yaw: -1.2, pitch: 0 } },
    ],
  },
];
