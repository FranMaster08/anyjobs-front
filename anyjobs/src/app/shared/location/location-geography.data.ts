import type { SupportedCountryCode } from './location-geography.types';

export type GeoDivisionType = 'DEPARTMENT' | 'PROVINCE';

export interface GeoMunicipality {
  name: string;
  neighborhoods: readonly string[];
}

export interface GeoDivision {
  name: string;
  type: GeoDivisionType;
  municipalities: readonly GeoMunicipality[];
}

export interface LocationCatalogCountry {
  divisions: string[];
  municipalitiesByDivision: Record<string, string[]>;
  neighborhoodsByMunicipalityKey: Record<string, string[]>;
}

export type LocationCatalog = Record<SupportedCountryCode, LocationCatalogCountry>;

const DEFAULT_BARRIOS = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Periferia'] as const;

const generic = (): readonly string[] => DEFAULT_BARRIOS;

export function municipalityCatalogKey(division: string, municipality: string): string {
  return `${division.trim()}::${municipality.trim()}`;
}

/** Municipios y barrios detallados por departamento/provincia. */
const MUNICIPALITIES_BY_DIVISION: Record<string, readonly GeoMunicipality[]> = {
  'Bogotá D.C.': [
    {
      name: 'Bogotá',
      neighborhoods: [
        'Usaquén',
        'Chapinero',
        'Santa Fe',
        'San Cristóbal',
        'Usme',
        'Tunjuelito',
        'Bosa',
        'Kennedy',
        'Fontibón',
        'Engativá',
        'Suba',
        'Barrios Unidos',
        'Teusaquillo',
        'Los Mártires',
        'Antonio Nariño',
        'Puente Aranda',
        'La Candelaria',
        'Rafael Uribe Uribe',
        'Ciudad Bolívar',
        'Sumapaz',
      ],
    },
  ],
  Antioquia: [
    {
      name: 'Medellín',
      neighborhoods: [
        'El Poblado',
        'Laureles-Estadio',
        'La Candelaria',
        'Aranjuez',
        'Castilla',
        'Robledo',
        'Buenos Aires',
        'Villa Hermosa',
        'Belén',
      ],
    },
    { name: 'Envigado', neighborhoods: generic() },
    { name: 'Bello', neighborhoods: generic() },
    { name: 'Itagüí', neighborhoods: generic() },
    { name: 'Sabaneta', neighborhoods: generic() },
  ],
  'Valle del Cauca': [
    {
      name: 'Cali',
      neighborhoods: [
        'San Fernando',
        'Granada',
        'El Peñón',
        'Ciudad Jardín',
        'Normandía',
        'Santa Rita',
        'Meléndez',
        'Pance',
      ],
    },
    { name: 'Palmira', neighborhoods: generic() },
    { name: 'Buenaventura', neighborhoods: generic() },
  ],
  Atlántico: [
    {
      name: 'Barranquilla',
      neighborhoods: [
        'El Prado',
        'Riomar',
        'Norte Centro Histórico',
        'Sur Oriente',
        'Metropolitana',
        'Suroccidente',
        'Noroccidente',
      ],
    },
    { name: 'Soledad', neighborhoods: generic() },
  ],
  Santander: [
    {
      name: 'Bucaramanga',
      neighborhoods: [
        'Cabecera del Llano',
        'García Rovira',
        'La Concordia',
        'Provenza',
        'Cañaveral',
        'Ciudadela Real de Minas',
      ],
    },
    { name: 'Floridablanca', neighborhoods: generic() },
  ],
  Bolívar: [
    {
      name: 'Cartagena',
      neighborhoods: [
        'Centro Histórico',
        'Bocagrande',
        'Castillogrande',
        'Manga',
        'Crespo',
        'Getsemaní',
      ],
    },
  ],
  Cundinamarca: [
    { name: 'Chía', neighborhoods: generic() },
    { name: 'Zipaquirá', neighborhoods: generic() },
    { name: 'Soacha', neighborhoods: generic() },
    { name: 'Facatativá', neighborhoods: generic() },
    { name: 'Girardot', neighborhoods: generic() },
    { name: 'Fusagasugá', neighborhoods: generic() },
    { name: 'Mosquera', neighborhoods: generic() },
    { name: 'Madrid', neighborhoods: generic() },
  ],
  Risaralda: [{ name: 'Pereira', neighborhoods: generic() }],
  Quindío: [{ name: 'Armenia', neighborhoods: generic() }],
  Caldas: [{ name: 'Manizales', neighborhoods: generic() }],
  Tolima: [{ name: 'Ibagué', neighborhoods: generic() }],
  Nariño: [{ name: 'Pasto', neighborhoods: generic() }],
  Meta: [{ name: 'Villavicencio', neighborhoods: generic() }],
  Magdalena: [{ name: 'Santa Marta', neighborhoods: generic() }],
  Huila: [{ name: 'Neiva', neighborhoods: generic() }],
  'La Guajira': [{ name: 'Riohacha', neighborhoods: generic() }, { name: 'Maicao', neighborhoods: generic() }],
  'Norte de Santander': [{ name: 'Cúcuta', neighborhoods: generic() }],
  'Ciudad Autónoma de Buenos Aires': [
    {
      name: 'Ciudad Autónoma de Buenos Aires',
      neighborhoods: [
        'Palermo',
        'Recoleta',
        'Belgrano',
        'Caballito',
        'Almagro',
        'Boedo',
        'San Telmo',
        'La Boca',
        'Villa Crespo',
        'Flores',
        'Villa Urquiza',
        'Núñez',
        'Puerto Madero',
        'Retiro',
        'Balvanera',
      ],
    },
  ],
  'Buenos Aires': [
    { name: 'La Plata', neighborhoods: generic() },
    { name: 'Mar del Plata', neighborhoods: generic() },
    { name: 'Bahía Blanca', neighborhoods: generic() },
    { name: 'Quilmes', neighborhoods: generic() },
    { name: 'San Isidro', neighborhoods: generic() },
    { name: 'Tigre', neighborhoods: generic() },
    { name: 'Pilar', neighborhoods: generic() },
  ],
  Córdoba: [
    { name: 'Córdoba', neighborhoods: ['Centro', 'Nueva Córdoba', 'Güemes', 'Alberdi', 'Cerro de las Rosas'] },
    { name: 'Villa Carlos Paz', neighborhoods: generic() },
    { name: 'Río Cuarto', neighborhoods: generic() },
  ],
  'Santa Fe': [
    { name: 'Rosario', neighborhoods: ['Centro', 'Fisherton', 'Echesortu', 'Pichincha'] },
    { name: 'Santa Fe', neighborhoods: generic() },
  ],
  Mendoza: [
    { name: 'Mendoza', neighborhoods: generic() },
    { name: 'Godoy Cruz', neighborhoods: generic() },
    { name: 'Maipú', neighborhoods: generic() },
  ],
  Tucumán: [{ name: 'San Miguel de Tucumán', neighborhoods: generic() }],
  Salta: [{ name: 'Salta', neighborhoods: generic() }],
};

function defaultMunicipality(divisionName: string): GeoMunicipality[] {
  const capital =
    divisionName === 'Bogotá D.C.'
      ? 'Bogotá'
      : divisionName === 'Ciudad Autónoma de Buenos Aires'
        ? 'Ciudad Autónoma de Buenos Aires'
        : 'Cabecera municipal';
  return [{ name: capital, neighborhoods: generic() }];
}

function municipalitiesFor(divisionName: string): readonly GeoMunicipality[] {
  return MUNICIPALITIES_BY_DIVISION[divisionName] ?? defaultMunicipality(divisionName);
}

const CO_DEPARTMENTS = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada',
  'Bogotá D.C.',
] as const;

const AR_PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego, Antártida e Islas del Atlántico Sur',
  'Tucumán',
] as const;

function buildDivisions(names: readonly string[], type: GeoDivisionType): GeoDivision[] {
  return names.map((name) => ({
    name,
    type,
    municipalities: municipalitiesFor(name),
  }));
}

export const GEOGRAPHY_BY_COUNTRY: Record<SupportedCountryCode, readonly GeoDivision[]> = {
  CO: buildDivisions(CO_DEPARTMENTS, 'DEPARTMENT'),
  AR: buildDivisions(AR_PROVINCES, 'PROVINCE'),
};

function findDivision(countryCode: SupportedCountryCode, divisionName: string): GeoDivision | undefined {
  return (GEOGRAPHY_BY_COUNTRY[countryCode] ?? []).find(
    (d) => d.name.localeCompare(divisionName.trim(), undefined, { sensitivity: 'accent' }) === 0,
  );
}

export function getDivisionsForCountry(countryCode: string): readonly string[] {
  const code = countryCode.trim().toUpperCase() as SupportedCountryCode;
  return (GEOGRAPHY_BY_COUNTRY[code] ?? []).map((d) => d.name);
}

export function getMunicipalitiesForDivision(
  countryCode: string,
  divisionName: string,
): readonly string[] {
  const code = countryCode.trim().toUpperCase() as SupportedCountryCode;
  const division = findDivision(code, divisionName);
  return division?.municipalities.map((m) => m.name) ?? [];
}

export function getNeighborhoodsForMunicipality(
  countryCode: string,
  divisionName: string,
  municipalityName: string,
): readonly string[] {
  const code = countryCode.trim().toUpperCase() as SupportedCountryCode;
  const division = findDivision(code, divisionName);
  const municipality = division?.municipalities.find(
    (m) => m.name.localeCompare(municipalityName.trim(), undefined, { sensitivity: 'accent' }) === 0,
  );
  return municipality?.neighborhoods ?? [];
}

/** @deprecated Usar getNeighborhoodsForMunicipality */
export function getNeighborhoodsForDivision(
  countryCode: string,
  divisionName: string,
): readonly string[] {
  const municipalities = getMunicipalitiesForDivision(countryCode, divisionName);
  if (municipalities.length === 1) {
    return getNeighborhoodsForMunicipality(countryCode, divisionName, municipalities[0]);
  }
  return [];
}

export function isDivisionValidForCountry(countryCode: string, divisionName: string): boolean {
  return getDivisionsForCountry(countryCode).some(
    (d) => d.localeCompare(divisionName.trim(), undefined, { sensitivity: 'accent' }) === 0,
  );
}

export function isMunicipalityValidForDivision(
  countryCode: string,
  divisionName: string,
  municipalityName: string,
): boolean {
  return getMunicipalitiesForDivision(countryCode, divisionName).some(
    (m) => m.localeCompare(municipalityName.trim(), undefined, { sensitivity: 'accent' }) === 0,
  );
}

export function isNeighborhoodValidForMunicipality(
  countryCode: string,
  divisionName: string,
  municipalityName: string,
  neighborhood: string,
): boolean {
  return getNeighborhoodsForMunicipality(countryCode, divisionName, municipalityName).some(
    (n) => n.localeCompare(neighborhood.trim(), undefined, { sensitivity: 'accent' }) === 0,
  );
}

export function buildLocationCatalogResponse(): LocationCatalog {
  const buildCountry = (divisions: readonly GeoDivision[]): LocationCatalogCountry => {
    const municipalitiesByDivision: Record<string, string[]> = {};
    const neighborhoodsByMunicipalityKey: Record<string, string[]> = {};

    for (const division of divisions) {
      municipalitiesByDivision[division.name] = division.municipalities.map((m) => m.name);
      for (const municipality of division.municipalities) {
        neighborhoodsByMunicipalityKey[municipalityCatalogKey(division.name, municipality.name)] = [
          ...municipality.neighborhoods,
        ];
      }
    }

    return {
      divisions: divisions.map((d) => d.name),
      municipalitiesByDivision,
      neighborhoodsByMunicipalityKey,
    };
  };

  return {
    CO: buildCountry(GEOGRAPHY_BY_COUNTRY.CO),
    AR: buildCountry(GEOGRAPHY_BY_COUNTRY.AR),
  };
}
