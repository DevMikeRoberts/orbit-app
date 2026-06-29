// Major universities worldwide with their locations
const UNIVERSITIES = [
  // Top US Universities
  { name: "Harvard University", city: "Cambridge", country: "US", lat: 42.3601, lng: -71.1129 },
  { name: "MIT", city: "Cambridge", country: "US", lat: 42.3601, lng: -71.0589 },
  { name: "Stanford University", city: "Stanford", country: "US", lat: 37.4419, lng: -122.143 },
  { name: "Yale University", city: "New Haven", country: "US", lat: 41.3083, lng: -72.9267 },
  { name: "Princeton University", city: "Princeton", country: "US", lat: 40.3494, lng: -74.6597 },
  { name: "Columbia University", city: "New York", country: "US", lat: 40.8075, lng: -73.9626 },
  { name: "University of Pennsylvania", city: "Philadelphia", country: "US", lat: 39.9526, lng: -75.1929 },
  { name: "Duke University", city: "Durham", country: "US", lat: 36.0014, lng: -78.9382 },
  { name: "Northwestern University", city: "Evanston", country: "US", lat: 42.0534, lng: -87.6753 },
  { name: "University of Chicago", city: "Chicago", country: "US", lat: 41.7896, lng: -87.5996 },
  { name: "Carnegie Mellon University", city: "Pittsburgh", country: "US", lat: 40.4426, lng: -79.9426 },
  { name: "University of California, Berkeley", city: "Berkeley", country: "US", lat: 37.8722, lng: -122.2596 },
  { name: "University of California, San Diego", city: "La Jolla", country: "US", lat: 32.8801, lng: -117.2347 },
  { name: "University of Michigan", city: "Ann Arbor", country: "US", lat: 42.2657, lng: -83.7295 },
  { name: "University of Texas at Austin", city: "Austin", country: "US", lat: 30.2849, lng: -97.7341 },
  { name: "University of Washington", city: "Seattle", country: "US", lat: 47.6554, lng: -122.3035 },
  { name: "Caltech", city: "Pasadena", country: "US", lat: 34.1377, lng: -118.1253 },
  { name: "Boston University", city: "Boston", country: "US", lat: 42.3496, lng: -71.1084 },
  { name: "University of Southern California", city: "Los Angeles", country: "US", lat: 34.0224, lng: -118.2851 },

  // UK Universities
  { name: "University of Oxford", city: "Oxford", country: "GB", lat: 51.7548, lng: -1.2545 },
  { name: "University of Cambridge", city: "Cambridge", country: "GB", lat: 52.1951, lng: 0.1204 },
  { name: "London School of Economics", city: "London", country: "GB", lat: 51.5156, lng: -0.1211 },
  { name: "Imperial College London", city: "London", country: "GB", lat: 51.4988, lng: -0.1749 },
  { name: "University of London", city: "London", country: "GB", lat: 51.5254, lng: -0.1341 },
  { name: "University College London", city: "London", country: "GB", lat: 51.5253, lng: -0.1340 },
  { name: "University of Edinburgh", city: "Edinburgh", country: "GB", lat: 55.9245, lng: -3.1880 },
  { name: "University of Manchester", city: "Manchester", country: "GB", lat: 53.4670, lng: -2.2336 },

  // Europe
  { name: "ETH Zurich", city: "Zurich", country: "CH", lat: 47.3769, lng: 8.5472 },
  { name: "Sorbonne University", city: "Paris", country: "FR", lat: 48.8485, lng: 2.3522 },
  { name: "University of Paris", city: "Paris", country: "FR", lat: 48.8485, lng: 2.3522 },
  { name: "Technical University of Munich", city: "Munich", country: "DE", lat: 48.2632, lng: 11.6679 },
  { name: "Heidelberg University", city: "Heidelberg", country: "DE", lat: 49.4134, lng: 8.7099 },
  { name: "University of Tokyo", city: "Tokyo", country: "JP", lat: 35.7116, lng: 139.7565 },

  // Canada
  { name: "University of Toronto", city: "Toronto", country: "CA", lat: 43.6632, lng: -79.1957 },
  { name: "McGill University", city: "Montreal", country: "CA", lat: 45.5047, lng: -73.5771 },
  { name: "University of British Columbia", city: "Vancouver", country: "CA", lat: 49.2827, lng: -123.2548 },

  // Australia
  { name: "University of Melbourne", city: "Melbourne", country: "AU", lat: -37.7969, lng: 144.9619 },
  { name: "University of Sydney", city: "Sydney", country: "AU", lat: -33.8868, lng: 151.1093 },
  { name: "Australian National University", city: "Canberra", country: "AU", lat: -35.2761, lng: 149.1205 },

  // China
  { name: "Tsinghua University", city: "Beijing", country: "CN", lat: 39.9975, lng: 116.3278 },
  { name: "Peking University", city: "Beijing", country: "CN", lat: 39.9974, lng: 116.3094 },
  { name: "Fudan University", city: "Shanghai", country: "CN", lat: 31.2965, lng: 121.5580 },

  // India
  { name: "Indian Institute of Technology Delhi", city: "Delhi", country: "IN", lat: 28.5465, lng: 77.1919 },
  { name: "Indian Institute of Technology Bombay", city: "Mumbai", country: "IN", lat: 19.1261, lng: 72.9127 },

  // Singapore
  { name: "National University of Singapore", city: "Singapore", country: "SG", lat: 1.3521, lng: 103.8198 },
  { name: "Nanyang Technological University", city: "Singapore", country: "SG", lat: 1.3521, lng: 103.8198 },

  // South Korea
  { name: "Seoul National University", city: "Seoul", country: "KR", lat: 37.4601, lng: 126.9520 },
  { name: "Korea Advanced Institute of Science and Technology", city: "Daejeon", country: "KR", lat: 36.3737, lng: 127.3636 },
];

export function searchUniversities(query: string): Array<{
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = UNIVERSITIES.filter((uni) =>
    uni.name.toLowerCase().includes(q) || uni.city.toLowerCase().includes(q)
  ).map((uni) => ({
    name: uni.name,
    city: uni.city,
    country: uni.country,
    lat: uni.lat,
    lng: uni.lng,
  }));

  // Sort by relevance (name match first)
  results.sort((a, b) => {
    const aNameMatch = a.name.toLowerCase().indexOf(q);
    const bNameMatch = b.name.toLowerCase().indexOf(q);
    if (aNameMatch === -1) return 1;
    if (bNameMatch === -1) return -1;
    return aNameMatch - bNameMatch;
  });

  return results;
}
