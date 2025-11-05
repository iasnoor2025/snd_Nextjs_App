export interface CountryRecord {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  officialName: string;
  nationality: string;
}

// Focused list covering most commonly used nationalities in the app context.
// Extend as needed.
export const COUNTRIES: CountryRecord[] = [
  { code: 'SA', name: 'Saudi Arabia', officialName: 'Kingdom of Saudi Arabia', nationality: 'Saudi' },
  { code: 'IN', name: 'India', officialName: 'Republic of India', nationality: 'Indian' },
  { code: 'PK', name: 'Pakistan', officialName: 'Islamic Republic of Pakistan', nationality: 'Pakistani' },
  { code: 'BD', name: 'Bangladesh', officialName: "People's Republic of Bangladesh", nationality: 'Bangladeshi' },
  { code: 'PH', name: 'Philippines', officialName: 'Republic of the Philippines', nationality: 'Filipino' },
  { code: 'NP', name: 'Nepal', officialName: 'Federal Democratic Republic of Nepal', nationality: 'Nepalese' },
  { code: 'EG', name: 'Egypt', officialName: 'Arab Republic of Egypt', nationality: 'Egyptian' },
  { code: 'SD', name: 'Sudan', officialName: 'Republic of the Sudan', nationality: 'Sudanese' },
  { code: 'JO', name: 'Jordan', officialName: 'Hashemite Kingdom of Jordan', nationality: 'Jordanian' },
  { code: 'YE', name: 'Yemen', officialName: 'Republic of Yemen', nationality: 'Yemeni' },
  { code: 'LK', name: 'Sri Lanka', officialName: 'Democratic Socialist Republic of Sri Lanka', nationality: 'Sri Lankan' },
  { code: 'ID', name: 'Indonesia', officialName: 'Republic of Indonesia', nationality: 'Indonesian' },
  { code: 'ET', name: 'Ethiopia', officialName: 'Federal Democratic Republic of Ethiopia', nationality: 'Ethiopian' },
  { code: 'KE', name: 'Kenya', officialName: 'Republic of Kenya', nationality: 'Kenyan' },
  { code: 'MA', name: 'Morocco', officialName: 'Kingdom of Morocco', nationality: 'Moroccan' },
  { code: 'TN', name: 'Tunisia', officialName: 'Republic of Tunisia', nationality: 'Tunisian' },
  { code: 'LB', name: 'Lebanon', officialName: 'Lebanese Republic', nationality: 'Lebanese' },
  { code: 'SY', name: 'Syria', officialName: 'Syrian Arab Republic', nationality: 'Syrian' },
  { code: 'TR', name: 'Turkey', officialName: 'Republic of Türkiye', nationality: 'Turkish' },
  { code: 'US', name: 'United States', officialName: 'United States of America', nationality: 'American' },
  { code: 'GB', name: 'United Kingdom', officialName: 'United Kingdom of Great Britain and Northern Ireland', nationality: 'British' },
  { code: 'CN', name: 'China', officialName: "People's Republic of China", nationality: 'Chinese' },
  { code: 'TH', name: 'Thailand', officialName: 'Kingdom of Thailand', nationality: 'Thai' },
  { code: 'MM', name: 'Myanmar', officialName: 'Republic of the Union of Myanmar', nationality: 'Burmese' },
  { code: 'AF', name: 'Afghanistan', officialName: 'Islamic Republic of Afghanistan', nationality: 'Afghan' },
];

export function mapCountryToResponse(country: CountryRecord) {
  const codeLower = country.code.toLowerCase();
  // Use flagcdn (S3/MinIO alternative static) for small flag icons
  const flag = `https://flagcdn.com/24x18/${codeLower}.png`;
  return {
    code: country.code,
    name: country.name,
    officialName: country.officialName,
    nationality: country.nationality,
    flag,
  };
}

