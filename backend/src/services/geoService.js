export const cityCoordinates = {
  Pune: [18.5204, 73.8567],
  Mumbai: [19.076, 72.8777],
  Delhi: [28.6139, 77.209],
  Hyderabad: [17.385, 78.4867],
  Bangalore: [12.9716, 77.5946],
  Kolkata: [22.5726, 88.3639],
  Lucknow: [26.8467, 80.9462],
  Kochi: [9.9312, 76.2673],
  Jaipur: [26.9124, 75.7873],
  Gurgaon: [28.4595, 77.0266],
  Chandigarh: [30.7333, 76.7794],
  Ahmedabad: [23.0225, 72.5714],
  Vellore: [12.9165, 79.1325],
  Nagpur: [21.1458, 79.0882],
  Indore: [22.7196, 75.8577],
};

export function normalizeCity(value = "") {
  const clean = value.trim().toLowerCase();
  return Object.keys(cityCoordinates).find((city) => city.toLowerCase() === clean) || null;
}

export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRad = (v) => (v * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function resolveDonorHospital(donor, hospitals) {
  const byAddress = normalizeCity(donor.address || "");
  if (byAddress) {
    const mapped = hospitals.find((h) => normalizeCity(h.city || "") === byAddress);
    if (mapped) return mapped;
  }
  return hospitals[(donor.donor_id - 1) % hospitals.length] || null;
}

export function resolveRecipientHospital(recipient, hospitals, demandModel = []) {
  const preferred = demandModel.find((item) => item.organ_type === recipient.required_organ);
  if (preferred) {
    const fromState = hospitals.find((h) => (h.state || "").toLowerCase() === preferred.state.toLowerCase());
    if (fromState) return fromState;
  }
  return hospitals[(recipient.recipient_id - 1) % hospitals.length] || null;
}

export function distanceBetweenHospitals(sourceHospital, destinationHospital) {
  const sourceCity = normalizeCity(sourceHospital?.city || "");
  const destinationCity = normalizeCity(destinationHospital?.city || "");

  if (!sourceCity || !destinationCity) return 250;
  const source = cityCoordinates[sourceCity];
  const destination = cityCoordinates[destinationCity];
  if (!source || !destination) return 250;

  return haversineKm(source, destination);
}
