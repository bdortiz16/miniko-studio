// Departamentos de Colombia con sus municipios y código postal POR CIUDAD.
// Los códigos son los oficiales (6 dígitos). Donde no se tenga certeza se usa
// el de la capital del depto como aproximación; el campo es editable.

export interface City {
  name: string;
  postal: string;
}
export interface Depto {
  name: string;
  cities: City[];
}

export const DEPARTAMENTOS_CO: Depto[] = [
  { name: "Amazonas", cities: [
    { name: "Leticia", postal: "910001" }, { name: "Puerto Nariño", postal: "910070" },
  ]},
  { name: "Antioquia", cities: [
    { name: "Medellín", postal: "050001" }, { name: "Bello", postal: "051050" },
    { name: "Itagüí", postal: "055410" }, { name: "Envigado", postal: "055420" },
    { name: "Apartadó", postal: "057840" }, { name: "Rionegro", postal: "054040" },
    { name: "Turbo", postal: "057860" }, { name: "Sabaneta", postal: "055450" },
    { name: "Caldas", postal: "055480" }, { name: "Copacabana", postal: "051010" },
    { name: "La Estrella", postal: "055460" }, { name: "Girardota", postal: "051030" },
    { name: "Marinilla", postal: "054030" }, { name: "Caucasia", postal: "056010" },
    { name: "El Carmen de Viboral", postal: "054050" },
  ]},
  { name: "Arauca", cities: [
    { name: "Arauca", postal: "810001" }, { name: "Saravena", postal: "813031" },
    { name: "Tame", postal: "813011" }, { name: "Arauquita", postal: "813001" },
  ]},
  { name: "Atlántico", cities: [
    { name: "Barranquilla", postal: "080001" }, { name: "Soledad", postal: "083001" },
    { name: "Malambo", postal: "083021" }, { name: "Sabanalarga", postal: "083201" },
    { name: "Puerto Colombia", postal: "081001" }, { name: "Galapa", postal: "081011" },
    { name: "Baranoa", postal: "082001" },
  ]},
  { name: "Bogotá D.C.", cities: [{ name: "Bogotá", postal: "110111" }] },
  { name: "Bolívar", cities: [
    { name: "Cartagena", postal: "130001" }, { name: "Magangué", postal: "132501" },
    { name: "Turbaco", postal: "131001" }, { name: "El Carmen de Bolívar", postal: "132501" },
    { name: "Arjona", postal: "131007" },
  ]},
  { name: "Boyacá", cities: [
    { name: "Tunja", postal: "150001" }, { name: "Duitama", postal: "150461" },
    { name: "Sogamoso", postal: "152211" }, { name: "Chiquinquirá", postal: "154001" },
    { name: "Paipa", postal: "150421" },
  ]},
  { name: "Caldas", cities: [
    { name: "Manizales", postal: "170001" }, { name: "La Dorada", postal: "175001" },
    { name: "Chinchiná", postal: "176020" }, { name: "Villamaría", postal: "176001" },
    { name: "Riosucio", postal: "174001" },
  ]},
  { name: "Caquetá", cities: [
    { name: "Florencia", postal: "180001" }, { name: "San Vicente del Caguán", postal: "182121" },
  ]},
  { name: "Casanare", cities: [
    { name: "Yopal", postal: "850001" }, { name: "Aguazul", postal: "851011" },
    { name: "Villanueva", postal: "854401" },
  ]},
  { name: "Cauca", cities: [
    { name: "Popayán", postal: "190001" }, { name: "Santander de Quilichao", postal: "191030" },
    { name: "Puerto Tejada", postal: "192501" },
  ]},
  { name: "Cesar", cities: [
    { name: "Valledupar", postal: "200001" }, { name: "Aguachica", postal: "205010" },
    { name: "Agustín Codazzi", postal: "202050" }, { name: "Bosconia", postal: "201020" },
  ]},
  { name: "Chocó", cities: [
    { name: "Quibdó", postal: "270001" }, { name: "Istmina", postal: "272510" },
  ]},
  { name: "Córdoba", cities: [
    { name: "Montería", postal: "230001" }, { name: "Cereté", postal: "230550" },
    { name: "Sahagún", postal: "232510" }, { name: "Lorica", postal: "231510" },
    { name: "Montelíbano", postal: "234001" }, { name: "Tierralta", postal: "234501" },
  ]},
  { name: "Cundinamarca", cities: [
    { name: "Soacha", postal: "250051" }, { name: "Facatativá", postal: "253051" },
    { name: "Zipaquirá", postal: "250251" }, { name: "Chía", postal: "250001" },
    { name: "Mosquera", postal: "250040" }, { name: "Madrid", postal: "250030" },
    { name: "Funza", postal: "250027" }, { name: "Fusagasugá", postal: "252211" },
    { name: "Girardot", postal: "252430" }, { name: "Cajicá", postal: "250240" },
    { name: "Tocancipá", postal: "251017" }, { name: "Cota", postal: "250010" },
    { name: "La Calera", postal: "251010" }, { name: "Sibaté", postal: "250054" },
    { name: "Tenjo", postal: "250201" },
  ]},
  { name: "Guainía", cities: [{ name: "Inírida", postal: "940001" }] },
  { name: "Guaviare", cities: [{ name: "San José del Guaviare", postal: "950001" }] },
  { name: "Huila", cities: [
    { name: "Neiva", postal: "410001" }, { name: "Pitalito", postal: "417030" },
    { name: "Garzón", postal: "414020" }, { name: "La Plata", postal: "413030" },
  ]},
  { name: "La Guajira", cities: [
    { name: "Riohacha", postal: "440001" }, { name: "Maicao", postal: "442001" },
    { name: "Uribia", postal: "443001" }, { name: "Fonseca", postal: "444001" },
  ]},
  { name: "Magdalena", cities: [
    { name: "Santa Marta", postal: "470001" }, { name: "Ciénaga", postal: "478020" },
    { name: "Fundación", postal: "475030" },
  ]},
  { name: "Meta", cities: [
    { name: "Villavicencio", postal: "500001" }, { name: "Acacías", postal: "507001" },
    { name: "Granada", postal: "504001" },
  ]},
  { name: "Nariño", cities: [
    { name: "Pasto", postal: "520001" }, { name: "Tumaco", postal: "528501" },
    { name: "Ipiales", postal: "524060" }, { name: "Túquerres", postal: "523040" },
  ]},
  { name: "Norte de Santander", cities: [
    { name: "Cúcuta", postal: "540001" }, { name: "Ocaña", postal: "546551" },
    { name: "Villa del Rosario", postal: "542051" }, { name: "Los Patios", postal: "541010" },
    { name: "Pamplona", postal: "543050" }, { name: "Tibú", postal: "544036" },
  ]},
  { name: "Putumayo", cities: [
    { name: "Mocoa", postal: "860001" }, { name: "Puerto Asís", postal: "862001" },
  ]},
  { name: "Quindío", cities: [
    { name: "Armenia", postal: "630001" }, { name: "Calarcá", postal: "631001" },
    { name: "La Tebaida", postal: "632011" }, { name: "Montenegro", postal: "631021" },
    { name: "Quimbaya", postal: "632004" },
  ]},
  { name: "Risaralda", cities: [
    { name: "Pereira", postal: "660001" }, { name: "Dosquebradas", postal: "661001" },
    { name: "Santa Rosa de Cabal", postal: "661020" }, { name: "La Virginia", postal: "662001" },
  ]},
  { name: "San Andrés y Providencia", cities: [
    { name: "San Andrés", postal: "880001" }, { name: "Providencia", postal: "880150" },
  ]},
  { name: "Santander", cities: [
    { name: "Bucaramanga", postal: "680001" }, { name: "Floridablanca", postal: "681001" },
    { name: "Girón", postal: "687541" }, { name: "Piedecuesta", postal: "681011" },
    { name: "Barrancabermeja", postal: "687031" }, { name: "San Gil", postal: "684031" },
  ]},
  { name: "Sucre", cities: [
    { name: "Sincelejo", postal: "700001" }, { name: "Corozal", postal: "702021" },
    { name: "Sampués", postal: "704510" },
  ]},
  { name: "Tolima", cities: [
    { name: "Ibagué", postal: "730001" }, { name: "Espinal", postal: "733520" },
    { name: "Melgar", postal: "734001" }, { name: "Honda", postal: "732010" },
    { name: "Líbano", postal: "731540" },
  ]},
  { name: "Valle del Cauca", cities: [
    { name: "Cali", postal: "760001" }, { name: "Buenaventura", postal: "764501" },
    { name: "Palmira", postal: "763531" }, { name: "Tuluá", postal: "763021" },
    { name: "Cartago", postal: "762021" }, { name: "Buga", postal: "763041" },
    { name: "Jamundí", postal: "760561" }, { name: "Yumbo", postal: "760501" },
    { name: "Candelaria", postal: "760531" },
  ]},
  { name: "Vaupés", cities: [{ name: "Mitú", postal: "970001" }] },
  { name: "Vichada", cities: [{ name: "Puerto Carreño", postal: "990001" }] },
];

export function citiesOf(deptName: string): City[] {
  return DEPARTAMENTOS_CO.find((d) => d.name === deptName)?.cities ?? [];
}

// Código postal del municipio elegido.
export function postalOf(deptName: string, cityName: string): string {
  return citiesOf(deptName).find((c) => c.name === cityName)?.postal ?? "";
}

// Nombre válido: al menos dos palabras de solo letras.
export function isValidName(s: string): boolean {
  return /^[A-Za-zÀ-ÿñÑ]{2,}(\s+[A-Za-zÀ-ÿñÑ]{2,})+$/.test((s || "").trim());
}

// Celular colombiano: 10 dígitos que empiezan en 3.
export function isValidCel(s: string): boolean {
  return /^3\d{9}$/.test((s || "").replace(/\D/g, ""));
}
