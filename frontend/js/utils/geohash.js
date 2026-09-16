/**
 * Client-Side Geohash Encoding & Decoding Utility
 * Standard Base-32 Morton space-filling curve implementation.
 * Zero external dependencies, runs instantly on every keystroke.
 */

export const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const BASE32_MAP = {};
for (let i = 0; i < BASE32.length; i++) {
  BASE32_MAP[BASE32[i]] = i;
}

export const PRECISION_META = {
  1:  { width_km: 5000,   height_km: 5000,   label: 'Continental (~5,000 km)',  scale: 'Global' },
  2:  { width_km: 1250,   height_km: 625,    label: 'Sub-continental (~1,250 km)', scale: 'Sub-Continent' },
  3:  { width_km: 156,    height_km: 156,    label: 'Regional (~156 km)',        scale: 'Province' },
  4:  { width_km: 39.1,   height_km: 19.5,   label: 'Metropolitan (~39 km)',     scale: 'City' },
  5:  { width_km: 4.89,   height_km: 4.89,   label: 'District (~4.9 km)',        scale: 'District' },
  6:  { width_km: 1.22,   height_km: 0.61,   label: 'Neighborhood (~1.2 km)',    scale: 'Neighborhood' },
  7:  { width_km: 0.153,  height_km: 0.153,  label: 'City Block (~153 m)',       scale: 'Block / Site' },
  8:  { width_km: 0.0382, height_km: 0.0191, label: 'Building (~38 m)',          scale: 'Building' },
  9:  { width_km: 0.0048, height_km: 0.0048, label: 'Room (~4.8 m)',             scale: 'Room' },
  10: { width_km: 0.0012, height_km: 0.0006, label: 'Desk (~1.2 m)',             scale: 'Desk' },
  11: { width_km: 0.00015, height_km: 0.00015, label: 'Device (~15 cm)',        scale: 'Device' },
  12: { width_km: 0.000037, height_km: 0.000019, label: 'Pinpoint (~3.7 cm)',  scale: 'Centimeter' }
};

export function isValidGeohash(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim().toLowerCase();
  if (s.length < 1 || s.length > 12) return false;
  for (let i = 0; i < s.length; i++) {
    if (!BASE32_MAP.hasOwnProperty(s[i])) return false;
  }
  return true;
}

export function decode(geohash) {
  if (!isValidGeohash(geohash)) {
    throw new Error('Invalid geohash string: ' + geohash);
  }
  const s = geohash.trim().toLowerCase();
  let isEven = true;
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;

  for (let i = 0; i < s.length; i++) {
    const cd = BASE32_MAP[s[i]];
    for (let mask = 16; mask > 0; mask >>= 1) {
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if (cd & mask) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (cd & mask) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  const latCenter = (latMin + latMax) / 2;
  const lonCenter = (lonMin + lonMax) / 2;
  const latErr = (latMax - latMin) / 2;
  const lonErr = (lonMax - lonMin) / 2;

  // Real world dimensions
  const earthRadiusKm = 6371.0088;
  const latSpanDeg = latMax - latMin;
  const lonSpanDeg = lonMax - lonMin;
  const heightKm = latSpanDeg * (Math.PI / 180.0) * earthRadiusKm;
  const widthKm = lonSpanDeg * (Math.PI / 180.0) * earthRadiusKm * Math.cos(latCenter * (Math.PI / 180.0));

  return {
    latitude: latCenter,
    longitude: lonCenter,
    precision: s.length,
    geohash: s,
    error: {
      latitude: latErr,
      longitude: lonErr
    },
    boundingBox: {
      minLat: latMin,
      maxLat: latMax,
      minLon: lonMin,
      maxLon: lonMax,
      south: latMin,
      north: latMax,
      west: lonMin,
      east: lonMax
    },
    dimensions: {
      latSpanDeg,
      lonSpanDeg,
      heightKm,
      widthKm,
      heightM: heightKm * 1000,
      widthM: widthKm * 1000
    }
  };
}

export function encode(latitude, longitude, precision = 7) {
  let lat = Number(latitude);
  let lon = Number(longitude);
  let prec = Math.max(1, Math.min(12, Math.round(Number(precision) || 7)));

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Latitude and Longitude must be valid numbers');
  }
  if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
  if (lon < -180 || lon > 180) throw new Error('Longitude must be between -180 and 180');

  let isEven = true;
  let latMin = -90.0, latMax = 90.0;
  let lonMin = -180.0, lonMax = 180.0;
  let hash = '';
  let ch = 0;
  let bit = 0;

  while (hash.length < prec) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) {
        ch |= (1 << (4 - bit));
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        latMin = mid;
      } else {
        latMax = mid;
      }
    }
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

// Neighbor computation tables
const NEIGHBOR_TABLE = {
  right:  { even: 'bc01fg45238967deuvhjyznpkmstqrwx' },
  left:   { even: '238967debc01fg45kmstqrwxuvhjyznp' },
  top:    { even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy' },
  bottom: { even: '14365h7k9dcfesgutwvy20r38zbqkmjx' }
};
NEIGHBOR_TABLE.bottom.odd = NEIGHBOR_TABLE.left.even;
NEIGHBOR_TABLE.top.odd = NEIGHBOR_TABLE.right.even;
NEIGHBOR_TABLE.left.odd = NEIGHBOR_TABLE.bottom.even;
NEIGHBOR_TABLE.right.odd = NEIGHBOR_TABLE.top.even;

const BORDER_TABLE = {
  right:  { even: 'bcfguvyz' },
  left:   { even: '0145hjnp' },
  top:    { even: 'prxz' },
  bottom: { even: '028b' }
};
BORDER_TABLE.bottom.odd = BORDER_TABLE.left.even;
BORDER_TABLE.top.odd = BORDER_TABLE.right.even;
BORDER_TABLE.left.odd = BORDER_TABLE.bottom.even;
BORDER_TABLE.right.odd = BORDER_TABLE.top.even;

export function adjacent(geohash, direction) {
  if (!isValidGeohash(geohash)) return null;
  const s = geohash.trim().toLowerCase();
  const dir = direction.toLowerCase();
  const lastCh = s[s.length - 1];
  const type = (s.length % 2) ? 'odd' : 'even';
  let parent = s.slice(0, -1);

  if (BORDER_TABLE[dir] && BORDER_TABLE[dir][type].indexOf(lastCh) !== -1 && parent.length > 0) {
    parent = adjacent(parent, dir);
  }

  const table = NEIGHBOR_TABLE[dir] ? NEIGHBOR_TABLE[dir][type] : null;
  if (!table) return null;
  const idx = table.indexOf(lastCh);
  if (idx === -1) return null;

  return (parent || '') + BASE32[idx];
}

export function getNeighbors(geohash) {
  if (!isValidGeohash(geohash)) return null;
  const n = adjacent(geohash, 'top');
  const s = adjacent(geohash, 'bottom');
  const e = adjacent(geohash, 'right');
  const w = adjacent(geohash, 'left');

  return {
    n,
    s,
    e,
    w,
    ne: n ? adjacent(n, 'right') : null,
    nw: n ? adjacent(n, 'left') : null,
    se: s ? adjacent(s, 'right') : null,
    sw: s ? adjacent(s, 'left') : null
  };
}

export function toBitRepresentation(geohash) {
  if (!isValidGeohash(geohash)) return null;
  const s = geohash.trim().toLowerCase();
  let bits = '';
  let latBits = '';
  let lonBits = '';
  let isEven = true;

  for (let i = 0; i < s.length; i++) {
    const val = BASE32_MAP[s[i]];
    for (let mask = 16; mask > 0; mask >>= 1) {
      const bit = (val & mask) ? '1' : '0';
      bits += bit;
      if (isEven) {
        lonBits += bit;
      } else {
        latBits += bit;
      }
      isEven = !isEven;
    }
  }

  return {
    interleavedBits: bits,
    latBits,
    lonBits,
    totalBits: bits.length
  };
}
