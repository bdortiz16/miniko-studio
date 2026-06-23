// Motor de contabilidad: costos configurables y cálculo de utilidad por pedido.

export interface Costs {
  // Costo de producción por figura, según estilo (styleId) y tipo.
  production: Record<string, { persona: number; mascota: number }>;
  // Materiales por FIGURA:
  paints: number; // pinturas
  brush: number; // pincel
  paper: number; // papel protector
  // Materiales por PEDIDO:
  box: number; // caja
  wrapping: number; // envoltura
  cards: number; // tarjetas
  shippingCost: number; // lo que te cobra la transportadora (Envia) por pedido
  // Impuestos / pasarela
  ivaRate: number; // 0.19
  wompiPct: number; // 0.0265
  wompiFixed: number; // 700 (en pesos)
}

export function defaultCosts(): Costs {
  return {
    production: {
      kawaii: { persona: 0, mascota: 0 },
      caricatura: { persona: 0, mascota: 0 },
      realista: { persona: 0, mascota: 0 },
    },
    paints: 0,
    brush: 0,
    paper: 0,
    box: 0,
    wrapping: 0,
    cards: 0,
    shippingCost: 0,
    ivaRate: 0.19,
    wompiPct: 0.0265,
    wompiFixed: 700,
  };
}

export interface OrderEconomics {
  revenue: number; // venta (pesos)
  production: number;
  materials: number;
  shipping: number;
  wompiFee: number; // comisión Wompi + IVA
  totalCost: number;
  profit: number; // utilidad neta
  net: number; // lo que te entra a Wompi (venta - comisión)
}

interface OrderLike {
  amount: number; // centavos
  styleId?: string;
  personas?: number;
  mascotas?: number;
}

export function orderEconomics(order: OrderLike, c: Costs): OrderEconomics {
  const revenue = (order.amount || 0) / 100;
  const personas = order.personas || 0;
  const mascotas = order.mascotas || 0;
  const figures = personas + mascotas;
  const prod = c.production[order.styleId || ""] || { persona: 0, mascota: 0 };
  const production = personas * prod.persona + mascotas * prod.mascota;
  const materials = (c.paints + c.brush + c.paper) * figures + c.box + c.wrapping + c.cards;
  const shipping = c.shippingCost;
  const wompiFee = (revenue * c.wompiPct + c.wompiFixed) * (1 + c.ivaRate);
  const totalCost = production + materials + shipping + wompiFee;
  return {
    revenue,
    production,
    materials,
    shipping,
    wompiFee,
    totalCost,
    profit: revenue - totalCost,
    net: revenue - wompiFee,
  };
}
