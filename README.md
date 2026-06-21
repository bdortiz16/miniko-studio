# Miniko Studio 🎨

Tienda online para vender figuras 3D personalizadas (impresas en 3D) en **3 estilos**:
**Kawaii**, **Realista** y **Caricatura**. El cliente sube su foto, elige estilo y
tamaño, paga con Stripe y recibe un kit para pintar.

Construido con **Next.js (App Router) + Tailwind CSS** y **Stripe Checkout**.

## 🚀 Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena tus claves de Stripe
npm run dev
```

Abre http://localhost:3000

## 🔑 Configuración de Stripe (pagos reales)

1. Crea una cuenta en https://stripe.com y entra en el Dashboard.
2. Copia tus claves desde https://dashboard.stripe.com/apikeys
3. Pégalas en `.env.local`:

   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

Para probar pagos usa la tarjeta de test `4242 4242 4242 4242`, cualquier
fecha futura y cualquier CVC.

## 📷 Subida de fotos (Vercel Blob)

El paso "Foto" del asistente sube la imagen del cliente a **Vercel Blob**.

1. En Vercel: pestaña **Storage → Create → Blob**.
2. Vercel añade automáticamente `BLOB_READ_WRITE_TOKEN` al proyecto.
3. Para local, copia ese token a `.env.local`.

## ✉️ Verificación de email (Resend)

El paso "Email" envía un código de 6 dígitos con **Resend**.

1. Crea una API key en https://resend.com/api-keys → `RESEND_API_KEY`.
2. `EMAIL_FROM`: para pruebas usa `onboarding@resend.dev` (solo envía a tu
   propio email). En producción, verifica un dominio en Resend.
3. `AUTH_SECRET`: una cadena larga y aleatoria para firmar los códigos.

Mientras no configures cada servicio, esa parte del asistente avisa con un
mensaje claro en lugar de fallar.

## 🧭 Flujo de pedido (asistente `/pedido`)

Pedido guiado en 6 pasos, al estilo de la referencia:
**Estilo → Foto → Email → Preview → Envío → Pago**. Toda la info del pedido
(estilo, fotos, email y dirección) se adjunta a los **metadatos** de la sesión
de Stripe, así la ves directamente en el Dashboard de Stripe.

## 🖼️ Reemplazar las imágenes

Las imágenes actuales son **placeholders SVG** en `public/styles/`:

| Archivo                       | Dónde aparece                          |
| ----------------------------- | -------------------------------------- |
| `public/styles/kawaii.svg`    | Tarjeta del estilo Kawaii              |
| `public/styles/realista.svg`  | Tarjeta del estilo Realista            |
| `public/styles/caricatura.svg`| Tarjeta del estilo Caricatura          |
| `public/styles/hero.svg`      | Imagen grande de la portada (hero)     |
| `public/styles/kit.svg`       | Imagen del kit en la sección "El kit"  |

Sustituye estos archivos por tus fotos reales. Puedes mantener el mismo nombre
(p. ej. subir `kawaii.jpg` y cambiar la ruta en `src/data/catalog.ts`), o
reemplazar directamente el `.svg`.

## 💶 Precios y catálogo

Todo el catálogo (estilos, tamaños y precios) está en un solo archivo fácil de editar:
**`src/data/catalog.ts`**. Los precios se definen en céntimos de euro.

## 📁 Estructura

```
src/
  app/
    page.tsx              # Landing
    personalizar/         # Configurador (estilo + tamaño)
    carrito/              # Carrito + checkout Stripe
    precios/              # Página de precios
    faq/                  # Preguntas frecuentes
    exito/                # Confirmación tras el pago
    api/checkout/         # Crea la sesión de pago de Stripe
  components/             # Header, Footer, tarjetas
  data/catalog.ts         # Catálogo y precios (EDITA AQUÍ)
  lib/                    # Carrito (contexto) y cliente Stripe
public/styles/            # Imágenes (placeholders por ahora)
```

## ☁️ Despliegue

Recomendado en **Vercel**: importa el repo, añade las variables de entorno
(las 3 de Stripe) y despliega. Recuerda usar tus claves `live` y poner
`NEXT_PUBLIC_SITE_URL` con tu dominio real en producción.
