import type { PickupDetails } from './types';

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  hours: string;
}

export const WA_PICKUP_LOCATIONS: PickupLocation[] = [
  { id: 'perth-cbd', name: 'Perth CBD', address: 'Perth WA 6000', hours: 'Mon–Sat · 10am–7pm' },
  { id: 'victoria-park', name: 'Victoria Park', address: 'Victoria Park WA 6100', hours: 'Mon–Sat · 10am–7pm' },
  { id: 'fremantle', name: 'Fremantle', address: 'Fremantle WA 6160', hours: 'Mon–Sun · 11am–6pm' },
  { id: 'joondalup', name: 'Joondalup', address: 'Joondalup WA 6027', hours: 'Mon–Sat · 10am–7pm' },
  { id: 'midland', name: 'Midland', address: 'Midland WA 6056', hours: 'Mon–Sat · 10am–6pm' },
];

export const PICKUP_WINDOWS = [
  'Next available · 10am–12pm',
  'Next available · 12pm–2pm',
  'Next available · 2pm–4pm',
  'Next available · 4pm–6pm',
];

export const PHOTO_ID_TYPES = [
  'Current Australian driver licence with photo',
  'Current passport',
  'Current WA Photo Card',
  'Current Australian proof of age/photo card',
  'Current Australian learner permit with photo',
  'Current physical Keypass card',
];

export const WA_PROOF_OF_AGE_URL = 'https://www.wa.gov.au/organisation/racing-gaming-and-liquor/proof-of-age';

export function validatePickupDetails(details: PickupDetails): PickupDetails {
  const location = WA_PICKUP_LOCATIONS.find((item) => item.id === details.locationId);
  if (!location) throw new Error('Choose a Western Australian pickup location.');
  if (details.locationName !== location.name || details.locationAddress !== location.address) {
    throw new Error('Pickup location details do not match the selected WA store.');
  }
  if (!PICKUP_WINDOWS.includes(details.window)) throw new Error('Choose an available pickup window.');
  if (!PHOTO_ID_TYPES.includes(details.collector.idType)) throw new Error('Choose the photo ID the collector will show.');
  if (details.collector.fullName.trim().length < 2) throw new Error('Enter the collector’s full legal name as shown on their photo ID.');
  if (details.collector.type === 'nominee' && !/^\+?[0-9 ()-]{8,20}$/.test(details.collector.phone?.trim() || '')) {
    throw new Error('Enter a valid mobile number for the nominated collector.');
  }
  if (details.waPickupOnly !== true || details.photoIdRequired !== true || details.ageConfirmed !== true) {
    throw new Error('Confirm WA pickup, age eligibility and the compulsory photo ID check.');
  }
  return {
    ...details,
    collector: {
      ...details.collector,
      fullName: details.collector.fullName.trim(),
      phone: details.collector.phone?.trim() || '',
    },
  };
}
