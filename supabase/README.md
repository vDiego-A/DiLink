# Configuración de Supabase para DiLink

En `Supabase Dashboard > SQL Editor`, ejecuta en este orden:

1. `migrations/202608140001_profiles_and_links.sql`
2. `migrations/202608140002_avatar_storage_and_free_limit.sql`
3. `migrations/202608140003_save_profile_editor.sql`
4. `migrations/202608140004_pro_payments.sql`
5. `migrations/202608140005_pro_editor_features.sql`
6. `migrations/202608140006_admin_pro_access.sql`
7. `migrations/202608160001_pro_media_and_design.sql`
8. `migrations/202608160002_analytics.sql`
9. `migrations/202608160003_free_image_background.sql`

Si una migración ya fue ejecutada correctamente, continúa con la siguiente.

## Comprobación

Después de aplicar las migraciones, verifica:

- `Table Editor`: existen `profiles`, `links`, `payment_requests`, `subscriptions`, `admin_users` y `analytics_events` con RLS habilitado.
- `Storage`: existen los buckets públicos `avatars` y `background-assets`.
- `Database > Functions`: existen `save_profile_editor`, `submit_pro_payment`, `review_pro_payment`, `sync_my_plan`, `track_public_analytics_event`, `get_my_analytics_overview`, `get_my_analytics_daily` y `get_my_link_analytics`.

## Registrar al administrador de pagos

La revisión manual está cerrada por defecto. Después de ejecutar la migración `004`, abre `SQL Editor` y ejecuta una sola vez, reemplazando el correo por el de tu propia cuenta:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'TU_CORREO_DE_ADMINISTRADOR'
on conflict (user_id) do nothing;
```

Después ejecuta la migración `006`, inicia sesión con esa cuenta y abre el dashboard. Verás el acceso **Verificar pagos**, que dirige a `/admin/payments`. Ningún usuario que no esté en `admin_users` puede aprobar su propio pago.

Las cuentas registradas en `admin_users` reciben acceso Pro interno mientras mantengan ese rol. No necesitan crear una solicitud de pago.

La migración `007` incorpora las nuevas fuentes y estilos de botón Pro. También permite fondos sólidos y gradientes en Free, y crea `background-assets` para que únicamente una cuenta con capacidades Pro pueda subir su imagen o video de fondo. Los videos se limitan a MP4/WebM, 25 MB y la interfaz valida una duración máxima de 10 segundos.

La migración `008` registra visitas y clics únicamente para perfiles publicados. Free recibe los totales básicos; las series diarias y el rendimiento por enlace se validan en PostgreSQL y requieren acceso Pro vigente.

La migración `009` permite que Free suba y guarde una imagen de fondo propia. Las políticas de Storage y la función de guardado siguen exigiendo Pro para cualquier fondo de video.

Al aprobar una solicitud, se crea o renueva una suscripción Pro por 30 días. Si vence, el plan vuelve a Free, se restaura un diseño compatible y los enlaces posteriores al tercero se conservan pero quedan inactivos.

No utilices la Service Role Key en el navegador. El guardado usa la sesión normal del usuario, valida su identidad en el servidor y las funciones de Supabase comprueban el propietario o el rol administrativo antes de modificar datos.
