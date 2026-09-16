export interface SiteSummary {
  id: string;
  name: string;
  short_name: string;
  location: string;
  thumbnail: string;
  badge: string;
  path: string;
  stripe_link: string;
  description: string;
  highlights_count: number;
  total_stops: number;
}

export interface MapCoords {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export interface RoomPieceSummary {
  poi_id: string;
  title: string;
  is_premium: boolean;
  estimated_minutes: number;
  thumbnail: string;
  file: string;
  ranking?: number;
}

export interface Room {
  id: string;
  name: string;
  culture: string;
  tags: string[];
  short_description: string;
  floor: number;
  featured_pieces: string[];
  coords?: MapCoords;
  pieces_info?: RoomPieceSummary[];
}

export interface RouteStop {
  poi_id: string;
  title: string;
  room_zone: string;
  file: string;
  map_coords?: MapCoords;
  estimated_minutes?: number;
  tags?: string[];
  room_id?: string;
  ranking?: number;
  orden_sala?: number;
}

export interface SiteRoute {
  id: string;
  name: string;
  duration: string;
  description: string;
  stops: RouteStop[];
  is_custom?: boolean;
}

export interface SiteManifest {
  site_id: string;
  name: string;
  pass_price_mxn: number;
  pass_price_usd: number;
  floorplan_url?: string;
  rooms?: Room[];
  routes: SiteRoute[];
}

export interface VisualChallengeItem {
  id: string;
  title: string;
  clue: string;
}

export interface CuriosityItem {
  id: string;
  fact: string;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ObservationChallengeItem {
  titulo: string;
  descripcion: string;
}

export interface PieceSpecsObject {
  material?: string;
  provenance?: string;
  weight?: string;
  age?: string;
}

export interface PieceFaqItem {
  question: string;
  answer: string;
}

export interface PieceData {
  poi_id: string;
  room_id?: string;
  site_id?: string;
  orden_sala?: number;
  is_premium: boolean;
  estimated_minutes?: number;
  tags?: string[];
  location?: {
    room_id?: string;
    room_name?: string;
    case_number?: string;
  };
  case_number?: string;
  map_coords?: MapCoords;
  map?: { x: number; y: number } | MapCoords;
  summary_30s?: string;
  observation_challenges?: ObservationChallengeItem[];
  did_you_know?: string[];
  specs?: PieceSpecsObject | SpecItem[];
  faq?: PieceFaqItem[];
  identification: {
    title: string;
    culture_period: string;
    room_zone: string;
    tags: string[];
    hero_image: string;
  };
  narrative: {
    one_liner: string;
    short_desc: string;
    deep_desc: string;
  };
  audioguide: {
    audio_script: string;
    audio_file_url: string;
  };
  visual_challenge?: VisualChallengeItem[];
  curiosities?: CuriosityItem[];
  faqs?: FaqItem[];
}

export interface SiteLicense {
  site_id: string;
  expires_at: number;
  device_id: string;
}
