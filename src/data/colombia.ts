// Departamentos de Colombia con código DANE y principales municipios.
// El código postal por defecto = códigoDANE + "0001" (capital del depto),
// editable por el cliente.

export interface Depto {
  name: string;
  code: string; // 2 dígitos DANE
  cities: string[];
}

export const DEPARTAMENTOS_CO: Depto[] = [
  { name: "Amazonas", code: "91", cities: ["Leticia", "Puerto Nariño"] },
  { name: "Antioquia", code: "05", cities: ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Rionegro", "Turbo", "Sabaneta", "Caldas", "Copacabana", "La Estrella", "Girardota", "Marinilla", "Caucasia", "El Carmen de Viboral"] },
  { name: "Arauca", code: "81", cities: ["Arauca", "Saravena", "Tame", "Arauquita"] },
  { name: "Atlántico", code: "08", cities: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia", "Galapa", "Baranoa"] },
  { name: "Bogotá D.C.", code: "11", cities: ["Bogotá"] },
  { name: "Bolívar", code: "13", cities: ["Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar", "Arjona"] },
  { name: "Boyacá", code: "15", cities: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa"] },
  { name: "Caldas", code: "17", cities: ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"] },
  { name: "Caquetá", code: "18", cities: ["Florencia", "San Vicente del Caguán"] },
  { name: "Casanare", code: "85", cities: ["Yopal", "Aguazul", "Villanueva"] },
  { name: "Cauca", code: "19", cities: ["Popayán", "Santander de Quilichao", "Puerto Tejada"] },
  { name: "Cesar", code: "20", cities: ["Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia"] },
  { name: "Chocó", code: "27", cities: ["Quibdó", "Istmina"] },
  { name: "Córdoba", code: "23", cities: ["Montería", "Cereté", "Sahagún", "Lorica", "Montelíbano", "Tierralta"] },
  { name: "Cundinamarca", code: "25", cities: ["Soacha", "Facatativá", "Zipaquirá", "Chía", "Mosquera", "Madrid", "Funza", "Fusagasugá", "Girardot", "Cajicá", "Tocancipá", "Cota", "La Calera", "Sibaté", "Tenjo"] },
  { name: "Guainía", code: "94", cities: ["Inírida"] },
  { name: "Guaviare", code: "95", cities: ["San José del Guaviare"] },
  { name: "Huila", code: "41", cities: ["Neiva", "Pitalito", "Garzón", "La Plata"] },
  { name: "La Guajira", code: "44", cities: ["Riohacha", "Maicao", "Uribia", "Fonseca"] },
  { name: "Magdalena", code: "47", cities: ["Santa Marta", "Ciénaga", "Fundación"] },
  { name: "Meta", code: "50", cities: ["Villavicencio", "Acacías", "Granada"] },
  { name: "Nariño", code: "52", cities: ["Pasto", "Tumaco", "Ipiales", "Túquerres"] },
  { name: "Norte de Santander", code: "54", cities: ["Cúcuta", "Ocaña", "Villa del Rosario", "Los Patios", "Pamplona", "Tibú"] },
  { name: "Putumayo", code: "86", cities: ["Mocoa", "Puerto Asís"] },
  { name: "Quindío", code: "63", cities: ["Armenia", "Calarcá", "La Tebaida", "Montenegro", "Quimbaya"] },
  { name: "Risaralda", code: "66", cities: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"] },
  { name: "San Andrés y Providencia", code: "88", cities: ["San Andrés", "Providencia"] },
  { name: "Santander", code: "68", cities: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"] },
  { name: "Sucre", code: "70", cities: ["Sincelejo", "Corozal", "Sampués"] },
  { name: "Tolima", code: "73", cities: ["Ibagué", "Espinal", "Melgar", "Honda", "Líbano"] },
  { name: "Valle del Cauca", code: "76", cities: ["Cali", "Buenaventura", "Palmira", "Tuluá", "Cartago", "Buga", "Jamundí", "Yumbo", "Candelaria"] },
  { name: "Vaupés", code: "97", cities: ["Mitú"] },
  { name: "Vichada", code: "99", cities: ["Puerto Carreño"] },
];

export function citiesOf(deptName: string): string[] {
  return DEPARTAMENTOS_CO.find((d) => d.name === deptName)?.cities ?? [];
}

export function postalOf(deptName: string): string {
  const d = DEPARTAMENTOS_CO.find((x) => x.name === deptName);
  return d ? `${d.code}0001` : "";
}

// Nombre válido: al menos dos palabras de solo letras.
export function isValidName(s: string): boolean {
  return /^[A-Za-zÀ-ÿñÑ]{2,}(\s+[A-Za-zÀ-ÿñÑ]{2,})+$/.test((s || "").trim());
}

// Celular colombiano: 10 dígitos que empiezan en 3.
export function isValidCel(s: string): boolean {
  return /^3\d{9}$/.test((s || "").replace(/\D/g, ""));
}
