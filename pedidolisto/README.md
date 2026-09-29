# PedidoListo — demo comercial

**Tu distribuidora, bajo control.** Demo funcional de un SaaS B2B para distribuidoras y mayoristas en Bolivia:
pedidos (vendedores, WhatsApp, teléfono), clientes y crédito, inventario, almacén, cobranzas, vendedores y reportes.

Empresa ficticia: **Distribuidora Illimani** (La Paz). Todo en español, montos en `Bs`, fechas `28 sep 2026`.

> Es una demo: no hay backend, autenticación real, WhatsApp real, facturación SIN ni pagos.
> Los datos viven en el navegador (`localStorage`) y se pueden restablecer desde **Configuración → Restablecer demo**.

## Ejecutar

```bash
cd pedidolisto
npm install
npm run dev        # http://localhost:3000
```

`npm run check` corre lint + TypeScript + build de producción.

### Deploy en Vercel

Importa el repositorio en Vercel y configura **Root Directory = `pedidolisto`** (framework: Next.js). No requiere variables de entorno.

## Guion sugerido para presentar

1. **Login** → "Entrar a la demo".
2. **Inicio**: ventas del día, cobrado, crédito, pedidos, alertas, pedidos recientes.
3. **Clientes → Tienda Don José**: deuda, deuda vencida, crédito disponible, historial y resumen.
4. **Nuevo pedido** (desde el perfil): 12 Coca-Cola 2L, 6 Agua Vital x12, 4 Powerade → **Crédito** → ver saldo proyectado → **Confirmar pedido**.
5. **Almacén**: el pedido aparece arriba con la etiqueta *Nuevo* → **Comenzar preparación** → **Consolidado del día**.
6. **Cobranzas**: **Registrar pago** (saldo antes / pago / saldo después) y **Recordar pago** (mensaje + WhatsApp `wa.me`).
7. **Asistente de pedidos**: **Interpretar pedido** → revisar lo detectado → **Confirmar pedido**. Probar los otros 4 mensajes.
8. Menú de usuario → **Ver como: Vendedor / Almacén** para mostrar cómo cambia la navegación.

`Ctrl + K` abre la búsqueda global (clientes, pedidos, productos).

## Arquitectura

```
app/(app)/*            rutas (client components; renderizan tras cargar la demo)
components/ui          primitivos estilo shadcn/ui sobre Radix
components/<dominio>   componentes por módulo (orders, customers, warehouse, assistant…)
lib/types.ts           tipos del dominio (Customer, Product, Order, Payment…)
lib/domain/            reglas puras: precios, cuentas (FIFO), analítica, inventario
lib/services/          mutaciones puras DemoData → DemoData (crear pedido, pago, ajuste…)
lib/store/             Zustand: estado + persistencia en localStorage
lib/mock/              generador determinístico de datos seed
lib/assistant/         parser determinístico de mensajes WhatsApp
lib/format.ts          formato de moneda, fechas y horas
```

- **Saldos derivados, no almacenados**: la deuda, deuda vencida, crédito disponible y próximo vencimiento se calculan
  de las ventas a crédito y pagos (aplicando pagos FIFO), así un pago o pedido nuevo actualiza todas las pantallas.
- **Servicios reemplazables**: `lib/services/*` recibe y devuelve datos sin tocar la UI. Para pasar a Supabase o una API,
  se reimplementan esas funciones (y las lecturas de `lib/store/hooks.ts`) sin reescribir las pantallas.
- **Datos siempre "de hoy"**: el seed se genera relativo a la fecha actual; si los datos guardados son de otro día se
  regeneran para que el dashboard siempre muestre un día activo.
