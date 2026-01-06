export type StoryStyle = 'NOIR' | 'CHILDREN' | 'HISTORICAL' | 'FANTASY';

export interface RouteDetails {
  startAddress: string;
  endAddress: string;
  distance: string;
  duration: string;
  durationSeconds: number;
  travelMode: string; // 'WALKING' | 'DRIVING'
  voiceName?: string;
  storyStyle: StoryStyle;
  routeGeometry?: [number, number][]; // Route coordinates [lng, lat] for map display
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
}

export interface StorySegment {
    index: number; // 1-based index
    text: string;
    audioBuffer?: any; // Changed for React Native compatibility
}

export interface AudioStory {
  totalSegmentsEstimate: number;
  outline: string[];
  segments: StorySegment[];
}

export enum AppState {
  PLANNING,
  CALCULATING_ROUTE,
  ROUTE_CONFIRMED,
  GENERATING_INITIAL_SEGMENT,
  READY_TO_PLAY,
  PLAYING
}

export interface POI {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number; // in meters
  description?: string;
  address?: string;
  website?: string;
}

export interface POIStory {
  poi: POI;
  story: string;
  audioBuffer?: any;
}
