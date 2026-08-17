# Plataforma link-in-bio

SaaS de páginas personales construido con Next.js, React, TypeScript, Tailwind CSS y Supabase. Incluye landing, autenticación, onboarding, editor y páginas públicas.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

Crea `.env.local` a partir de `.env.example` y completa:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave pública del proyecto Supabase.
- `NEXT_PUBLIC_APP_URL`: URL pública absoluta de la aplicación. En local puede ser `http://localhost:3000`; en Vercel debe ser la URL definitiva del despliegue, por ejemplo `https://dilink.vercel.app`.

Si `NEXT_PUBLIC_APP_URL` no está configurada durante el desarrollo, la aplicación utilizará `http://localhost:3000` como respaldo. No guardes credenciales reales en `.env.example`.

## Supabase y acceso con Google

1. Completa `.env.local` con la URL y la Publishable Key del proyecto.
2. En `Authentication > URL Configuration`, utiliza `http://localhost:3000` como Site URL.
3. Agrega `http://localhost:3000/**` a Redirect URLs para desarrollo local.
4. En `Authentication > Sign In / Providers`, confirma que Email está habilitado.
5. En `Authentication > Email Templates > Confirm signup`, usa este enlace dentro de la plantilla:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`.
6. En la plantilla `Reset password`, usa:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
7. Para Google, habilita el proveedor y utiliza en Google Auth Platform el callback que muestra Supabase.

Las claves privadas de Google se configuran únicamente en Supabase; nunca deben agregarse al frontend.

## Perfiles y enlaces en Supabase

Antes de utilizar el editor con guardado real:

1. Abre `SQL Editor` en el Dashboard de Supabase.
2. Crea una consulta nueva.
3. Ejecuta en orden las nueve migraciones incluidas en `supabase/migrations/`.
4. Si ya ejecutaste las anteriores, aplica solamente las migraciones pendientes. La `004` incorpora pagos y suscripciones Pro; la `005` habilita sus capacidades en el editor; la `006` concede acceso Pro a las cuentas administradoras; la `007` añade tipografías, botones premium y fondos multimedia; la `008` activa Analytics; y la `009` habilita imágenes de fondo en Free manteniendo el video en Pro.
5. Comprueba en `Table Editor` que existen `profiles`, `links`, `payment_requests`, `subscriptions`, `admin_users` y `analytics_events`, todas con RLS habilitado, y en `Storage` que existen los buckets públicos `avatars` y `background-assets`.

Las migraciones crean relaciones, restricciones de username, políticas por propietario, el límite Free de tres enlaces, almacenamiento seguro para fotos y fondos, verificación manual de Pago Móvil y funciones de guardado protegidas por el plan vigente.

Para habilitar la revisión administrativa, registra tu usuario en `admin_users` siguiendo las instrucciones de `supabase/README.md`. El panel privado estará disponible en `/admin/payments`.

## Validación

```bash
npm run lint
npm run build
```

## Organización

- `app/`: layout global, metadata y composición de rutas.
- `components/ui/`: piezas base reutilizables.
- `components/marketing/`: secciones de la landing.
- `components/auth/`: formularios y presentación del acceso.
- `lib/config.ts`: configuración central del producto.
- `lib/supabase/`: clientes seguros para navegador y servidor.
- `proxy.ts`: actualización de cookies y persistencia de sesión SSR.
- `lib/plans.ts`: límites y contenido centralizado de Free y Pro.
- `lib/themes.ts`: catálogo compartido de temas.

## Rutas de autenticación

- `/signup`: registro por email y contraseña.
- `/login`: acceso por email, contraseña o Google.
- `/forgot-password`: solicitud segura de recuperación.
- `/reset-password`: establecimiento de una nueva contraseña.
- `/auth/callback`: intercambio PKCE para confirmaciones, recuperación y OAuth.
- `/auth/confirm`: verificación SSR de enlaces de correo mediante `token_hash`.
- `/dashboard`: resumen privado de la página del usuario.
- `/dashboard/editor`: edición privada de perfil, enlaces y diseño.
- `/dashboard/analytics`: resumen de visitas y clics, con detalle avanzado para Pro.
- `/checkout`: reporte y seguimiento del Pago Móvil para Pro.
- `/admin/payments`: revisión privada de pagos para administradores autorizados.
- `/[username]`: página pública cuando el usuario activa su publicación.
