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

export interface RouteStop {
  poi_id: string;
  title: string;
  room_zone: string;
  file: string;
}

export interface SiteRoute {
  id: string;
  name: string;
  duration: string;
  description: string;
  stops: RouteStop[];
}

export interface SiteManifest {
  site_id: string;
  name: string;
  pass_price_mxn: number;
  pass_price_usd: number;
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

export interface PieceData {
  poi_id: string;
  is_premium: boolean;
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
  visual_challenge: VisualChallengeItem[];
  curiosities: CuriosityItem[];
  specs: SpecItem[];
  faqs: FaqItem[];
}

export interface SiteLicense {
  site_id: string;
  expires_at: number;
  device_id: string;
}
