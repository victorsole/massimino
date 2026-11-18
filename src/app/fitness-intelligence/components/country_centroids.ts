// Shared country centroids for map markers and proportional symbols

// Country centroids for markers [lng, lat]
export const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  // Nordic [lng, lat]
  SE: [18.6435, 62.1983], // Sweden
  NO: [8.4689, 60.4720],  // Norway
  DK: [9.5018, 56.2639],  // Denmark
  FI: [25.7482, 61.9241], // Finland
  IS: [-19.0208, 64.9631], // Iceland
  // British Isles
  GB: [-3.4360, 55.3781], // UK
  IE: [-8.2439, 53.4129], // Ireland
  // Western Europe
  DE: [10.4515, 51.1657], // Germany
  FR: [2.2137, 46.2276],  // France
  NL: [5.2913, 52.1326],  // Netherlands
  BE: [4.4699, 50.5039],  // Belgium
  LU: [6.1296, 49.8153],  // Luxembourg
  // Central Europe
  CH: [8.2275, 46.8182],  // Switzerland
  AT: [14.5501, 47.5162], // Austria
  PL: [19.1451, 51.9194], // Poland
  CZ: [15.4729, 49.8175], // Czech Republic
  SK: [19.6990, 48.6690], // Slovakia
  HU: [19.5033, 47.1625], // Hungary
  // Southern Europe
  ES: [-3.7038, 40.4168], // Spain
  PT: [-8.2245, 39.3999], // Portugal
  IT: [12.5674, 41.8719], // Italy
  GR: [21.8243, 39.0742], // Greece
  MT: [14.3754, 35.9375], // Malta
  CY: [33.4299, 35.1264], // Cyprus
  // Balkans
  SI: [14.9955, 46.1512], // Slovenia
  HR: [15.2000, 45.1000], // Croatia
  RS: [21.0059, 44.0165], // Serbia
  BA: [17.6791, 43.9159], // Bosnia
  ME: [19.3744, 42.7087], // Montenegro
  AL: [20.1683, 41.1533], // Albania
  MK: [21.7453, 41.5124], // North Macedonia
  XK: [20.9020, 42.6026], // Kosovo
  BG: [25.4858, 42.7339], // Bulgaria
  RO: [24.9668, 45.9432], // Romania
  // Baltic
  EE: [25.0136, 58.5953], // Estonia
  LV: [24.6032, 56.8796], // Latvia
  LT: [23.8813, 55.1694], // Lithuania
  // Eastern Europe
  UA: [31.1656, 48.3794], // Ukraine
  MD: [28.3699, 47.4116], // Moldova
  BY: [27.9534, 53.7098], // Belarus
  TR: [35.2433, 38.9637], // Turkey
  // Caucasus (Olympic medal tables)
  GE: [43.3569, 42.3154], // Georgia
  AM: [45.0382, 40.0691], // Armenia
  AZ: [47.5769, 40.1431], // Azerbaijan
};
