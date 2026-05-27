# Krypto-Polla Natillera · Mundial 2026

Polla futbolera familiar para el Mundial 2026. Hecha con cariño y dedicada a
**Krypto** 🐶, el perrito de la Natillera.

Stack: **Next.js 15** (App Router) · TypeScript · Tailwind ·
**Supabase** (Postgres) · **api-football** (RapidAPI) · despliegue en **Vercel**.

---

## Cómo funciona

- Cada familiar entra con un **código de invitación** que les da el admin
  (sin contraseñas, sin email).
- El admin sincroniza el calendario y los marcadores desde api-football.
- Cada participante mete su pronóstico antes del pitazo inicial; después se
  bloquea el partido.
- Marcadores cuentan **90 minutos reglamentarios + tiempo de reposición**
  (no incluye prórrogas ni penales).
- Las reglas de puntaje y los multiplicadores por fase son **editables por
  el admin** desde `/admin/reglas`.

### Sistema de puntaje (valores por defecto)

| Acierto                                  | Puntos |
| ---------------------------------------- | -----: |
| Marcador exacto                          | 5      |
| Acertar ganador (1X2)                    | 3      |
| Acertar la diferencia de goles           | 2      |
| Acertar el marcador de un equipo (c/u)   | 1      |

Multiplicador: × 1 en fase de grupos, × 2 desde octavos en adelante.

---

## Setup

### 1. Crear proyecto en Supabase

1. Crea un proyecto nuevo en https://supabase.com.
2. Anota `Project URL` y `service_role key` (Settings → API).
3. En el SQL editor, pega el contenido de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   y ejecútalo.

### 2. Suscribirse a api-football en RapidAPI

1. Crea cuenta en https://rapidapi.com/api-sports/api/api-football.
2. Anota tu RapidAPI key. El plan gratuito da 100 requests/día — suficiente
   con el cron cada 15 min (96 req/día).

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
API_FOOTBALL_KEY=...
API_FOOTBALL_LEAGUE_ID=1     # World Cup
API_FOOTBALL_SEASON=2026
ADMIN_TOKEN=<algo-largo-aleatorio>
SEED_ADMIN_CODE=NATIADMIN
SEED_ADMIN_NAME=TuNombre
```

### 4. Correr en local

```bash
npm install
npm run dev
```

### 5. Crear el primer admin

Con el server corriendo:

```bash
curl -X POST http://localhost:3000/api/seed-admin \
     -H "Authorization: Bearer $ADMIN_TOKEN"
```

Devuelve el código de admin que pusiste en `SEED_ADMIN_CODE`. Entra a
http://localhost:3000 con ese código y desde `/admin/participantes` agregas
al resto de la familia.

### 6. Sincronizar fixture

En `/admin` haz clic en **Sincronizar ahora**. Trae los 104 partidos del
Mundial 2026 desde api-football. Después de cada cambio recalcula los puntos
de todos los pronósticos.

---

## Despliegue en Vercel

1. Crea un repo nuevo en GitHub (ej. `krypto-polla`) y empuja esta carpeta
   como raíz del repo.
2. En Vercel, importa el repo. Vercel detecta Next.js automáticamente.
3. Configura las variables de entorno (las mismas de `.env.local`).
4. Asocia tu dominio personalizado (Settings → Domains).
5. Cron de sincronización: viene configurado en `vercel.json` (cada 15 min
   GET `/api/sync`). Si no necesitas refresco automático, borra `vercel.json`
   y haz sync manual desde `/admin`.

---

## Estructura

```
app/
  ├── page.tsx               Login con código de invitación
  ├── play/                  Vista del jugador
  │   ├── page.tsx           Pronósticos
  │   ├── posiciones/        Tabla de posiciones
  │   └── info/              Reglas y recomendaciones
  ├── admin/                 Panel de admin
  │   ├── page.tsx           Dashboard + sync + recalc
  │   ├── partidos/          Cargar resultados manualmente
  │   ├── reglas/            Editar puntajes y multiplicadores
  │   └── participantes/     CRUD de la familia
  ├── api/
  │   ├── sync/              GET — sync vía cron / Bearer token
  │   └── seed-admin/        POST — crea el primer admin
  └── actions/               Server actions (auth, predictions, admin)
lib/
  ├── auth.ts                Cookie + lookup por código de invitación
  ├── supabase.ts            Service-role client (solo server)
  ├── api-football.ts        Sync de fixture y resultados
  ├── scoring.ts             Cálculo de puntos
  ├── recalc.ts              Recalcula puntos en lote
  ├── stages.ts              Normalización de fases
  └── utils.ts               cn(), fechas, generador de códigos
supabase/
  └── migrations/0001_init.sql
```

---

## Notas de seguridad

- La `service_role` key **solo** se usa en el servidor (`lib/supabase.ts`
  está marcado con `import "server-only"`). Nunca la expongas al cliente.
- La sesión vive en una cookie HTTP-only firmada por la propia plataforma
  Next.js (no hay token JWT en la URL ni en localStorage).
- Las acciones del admin (`/app/actions/admin.ts`) revalidan el rol en cada
  llamada vía `requireAdmin()`.
- El endpoint `/api/sync` requiere `Bearer $ADMIN_TOKEN` salvo cuando lo
  invoca Vercel Cron (el header `x-vercel-cron` lo identifica).
