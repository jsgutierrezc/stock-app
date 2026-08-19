# Tati — Mi plan de mejora

App personal (PWA) para seguir un plan de mejora repartido en tres dimensiones
que pesan lo mismo:

| Dimensión | Qué reúne | Color |
|---|---|---|
| **BODY** | Alimentación y ejercicio | rosa `#e75480` |
| **SOUL** | Creatividad y proyectos del alma (bordar, pintar, leer) | azul claro `#0ea5e9` |
| **TALENT** | Trabajo, hoja de vida, portafolio y contenido | violeta `#6b3fc9` |

Funciona sin conexión, no tiene servidor ni cuentas: **todo se guarda en el
navegador del dispositivo**. Vive dentro del repo `stock-app`, en la carpeta
`public/tati/`, y convive con VisionColor (que sigue en la raíz del sitio).

---

## 1. Abrirla en tu computador

```bash
git clone https://github.com/jsgutierrezc/stock-app.git
cd stock-app
git checkout claude/app-tati-4lcfqx
```

Si ya tienes el repo clonado:

```bash
git fetch origin
git checkout claude/app-tati-4lcfqx
git pull
```

Y luego levanta un servidor local, con lo que tengas instalado:

**Con Python** (no necesita instalar nada):

```bash
cd public
python3 -m http.server 8000     # en Windows: py -m http.server 8000
```

→ abre **http://localhost:8000/tati/**

**Con Node:**

```bash
npm install
npm start
```

→ abre **http://localhost:3000/tati/**

> No la abras con doble clic en `index.html`. Con `file://` el navegador
> bloquea parte de lo que la app necesita. Tiene que ser por `localhost`.

**Para verla en el celular** (misma wifi): busca la IP de tu computador
(`ipconfig` en Windows, `ifconfig | grep inet` en Mac) y entra a
`http://192.168.x.x:8000/tati/`. Todo funciona, pero al no ser HTTPS no se
puede "instalar" en la pantalla de inicio; para eso hay que publicarla
(sección 7).

---

## 2. Qué hay en cada pestaña

### Plan
La pantalla del día a día.

- **Tira de la semana**: los siete días, con un punto debajo de los que tienen
  algo marcado. Se puede retroceder a días pasados; el futuro está bloqueado.
- **Frase del día**: la misma frase durante todo el día. ↻ para ver otra,
  ♥ para guardarla y *Mis frases* para escribir las tuyas (entran a la rotación).
- **Tarjeta de avance**: cuántos hábitos llevas, un arco por dimensión y el
  botón **Terminar día**.
- **Una tarjeta por dimensión** con sus hábitos del día. Los hábitos de tipo
  *marcar* se completan con la palomita; los de *cantidad* con − y +. Tocar el
  nombre lo completa de una.
- **Ánimo y nota** del día.
- **Fotos del día**: las del día que estés mirando, con acceso para agregar.

Cuando completas todos los hábitos del día cae una lluvia de corazones.

### Hábitos
Gestión del plan, agrupada por dimensión. Cada hábito muestra su meta
(`8 vasos`, `30 min`, `marcar y listo`) y los días en que aplica. **Tocar un
hábito lo abre para editar**: nombre, dimensión, tipo, meta, unidad y días.
*Pausar* lo saca del Plan sin borrar su historial.

### Metas
Proyectos con pasos marcables y barra de avance, cada uno etiquetado con su
dimensión. Vienen precargados "Hoja de vida lista", "Portafolio en línea",
"Contenido para redes", el bordado y la rutina de ejercicio.

### Galería
El archivo de avances: fotos agrupadas por mes, con el día, un punto del color
de la dimensión y el sticker que le pusiste. Al agregar una foto eliges día,
dimensión, nota y sticker. El visor a pantalla completa permite descargar o
borrar.

### Heart
El balance entre las tres dimensiones.

- **Equilibrio (%)**: qué tan pareja va la dimensión más floja frente a la más
  fuerte. Si BODY va al 90 % y TALENT al 45 %, el equilibrio es 50 %. Es
  distinto del cumplimiento: puedes cumplir mucho y estar desbalanceada.
- **Triángulo de balance**: un vértice por dimensión. Equilátero = las tres
  parejas. En el centro, una carita que cambia según cómo vas (feliz,
  contenta, preocupada o dormida si no hay datos).
- **Cada dimensión** con su porcentaje y sus hábitos cumplidos.
- **Racha, mejor racha, promedio y días cumplidos.** Un día cuenta como
  cumplido con **70 %** o más de sus hábitos.
- **Gráfico de cumplimiento** + vista de tabla.
- **Mis datos**: exportar, importar y reiniciar.

El selector **7 / 30 / 90 días** manda sobre toda la pantalla. A 90 días el
gráfico se agrupa por semana.

---

## 3. Cómo está organizado el código

Todo es HTML, CSS y JavaScript sin librerías ni compilación: se edita y se
recarga el navegador.

| Archivo | Qué contiene |
|---|---|
| `index.html` | La estructura de las cinco vistas, la barra de pestañas, el modal y el visor de fotos. |
| `style.css` | Todos los estilos y los colores del tema (variables al inicio del archivo). |
| `data.js` | **Lo que se edita para personalizar**: las tres dimensiones, los hábitos iniciales, las metas iniciales, las frases y los stickers. |
| `app.js` | Toda la lógica: estado, cálculos, pantallas, gráficos y eventos. |
| `fotos.js` | Guardado de fotos en IndexedDB y compresión de imágenes. |
| `sw.js` | Service worker: hace que funcione sin conexión. |
| `manifest.json` | Datos para instalarla como app (nombre, iconos, colores). |
| `icons/` | Iconos generados por `tools/generate-tati-icons.js` (en la raíz del repo). |

---

## 4. Dónde se guardan tus datos

### El plan → `localStorage`, clave `tati.plan.v1`

```jsonc
{
  "version": 1,
  "habitos": [
    { "id": "a1b2c3", "pilar": "cuerpo", "nombre": "Tomar agua",
      "icono": "💧", "tipo": "cantidad", "meta": 8, "unidad": "vasos",
      "dias": [0,1,2,3,4,5,6], "activo": true }
  ],
  "metas": [
    { "id": "d4e5f6", "pilar": "carrera", "nombre": "Hoja de vida lista",
      "pasos": [{ "id": "g7h8", "texto": "Escribir el resumen", "hecho": false }] }
  ],
  "registro": {
    "2026-08-19": { "valores": { "a1b2c3": 6 }, "animo": 4,
                    "nota": "Buen día", "cerrado": false }
  },
  "frasesFav": [], "frasesPropias": [], "fraseDelDia": {}
}
```

Los identificadores de las dimensiones siguen siendo `cuerpo`, `creatividad` y
`carrera` (BODY, SOUL y TALENT son solo los nombres visibles). Por eso cambiar
los nombres no rompió nada de lo ya guardado. `dias` usa 0 = domingo … 6 = sábado.

### Las fotos → IndexedDB, base `tati-fotos`, almacén `fotos`

Cada foto guarda `{ id, dia, pilar, nota, sticker, creado, blob }`. Antes de
guardarse se reduce a 1400 px de lado máximo y se convierte a JPEG: una foto de
celular pasa de varios MB a unos 200 KB.

### Respaldos

- **Exportar** (en Heart) descarga un `.json` con hábitos, metas e historial.
  **Importar** lo restaura. Las fotos **no** van en ese archivo.
- Las fotos se descargan una por una desde el visor de la galería.
- **Reiniciar** borra el plan y vuelve al inicial; **no toca las fotos**.
- Cada navegador tiene sus propios datos: lo del computador no aparece en el
  celular. Para pasarlo, exporta e importa.

---

## 5. Cómo personalizarla

Casi todo está en `data.js`:

- **Hábitos iniciales** → lista `HABITOS_INICIALES`. Cada uno lleva `pilar`,
  `nombre`, `icono` (emoji), `tipo` (`check` o `cantidad`), `meta`, `unidad` y
  `dias`. Ojo: esto solo aplica la primera vez que se abre la app; después se
  editan desde la pestaña Hábitos.
- **Metas iniciales** → `METAS_INICIALES`.
- **Frases** → `FRASES`. También puedes agregarlas desde la app en *Mis frases*.
- **Stickers** → `STICKERS`.
- **Nombres, lemas, colores e iconos de las dimensiones** → `PILARES`. Si
  cambias un color, cambia también su gemelo en `style.css` (`--cuerpo`,
  `--creatividad`, `--carrera`) para que la app quede consistente.

En `app.js`:

- **Umbral del día cumplido** → `UMBRAL_DIA` (hoy 70).

En `style.css`, las variables del inicio (`:root`) controlan todo el tema: fondo,
tarjetas, rosa de la marca y colores de las dimensiones.

> Si tocas `sw.js` o quieres forzar que el navegador recoja los cambios, sube el
> número de `CACHE` (`tati-v5` → `tati-v6`) y recarga.

---

## 6. Por qué está hecho así

- **Sin servidor ni cuentas.** Es un diario personal: los datos no salen del
  dispositivo. Eso también significa que borrar los datos del navegador borra
  la app; de ahí la importancia de exportar de vez en cuando.
- **Los colores de las tres dimensiones están validados**, no elegidos a ojo:
  rosa, azul claro y violeta se confunden con facilidad, sobre todo para
  daltonismo, así que se probaron decenas de combinaciones y se eligió la de
  mayor separación. El par más parecido queda al doble del mínimo exigido.
- **El color nunca carga solo la identidad.** Cada barra, vértice, chip y meta
  lleva el nombre de su dimensión escrito, y el gráfico de Heart tiene vista de
  tabla.
- **Dentro de los gráficos el rosa significa BODY y nada más.** Por eso el
  cumplimiento total (barras y punto de día cumplido) usa un gris rosado
  neutro, aunque el resto de la app sea rosa.
- **Las fotos van en IndexedDB** porque `localStorage` no aguanta binarios;
  y se comprimen para que quepan cientos.
- **Las animaciones se apagan solas** si el sistema tiene activado "reducir
  movimiento".

---

## 7. Publicarla en internet

El repo ya trae `.github/workflows/pages.yml`, que sube la carpeta `public/` a
GitHub Pages. Dos caminos:

1. **Sin tocar `main`**: en GitHub, pestaña *Actions* → *Deploy PWA to GitHub
   Pages* → *Run workflow* → elegir la rama `claude/app-tati-4lcfqx`.
2. **Fusionando a `main`**: el workflow se dispara solo con cada push.

En ambos casos la dirección queda:

```
https://jsgutierrezc.github.io/stock-app/tati/
```

Requiere que en *Settings → Pages* la fuente esté puesta en **GitHub Actions**.
Publicada y con HTTPS, ya se puede instalar en la pantalla de inicio del celular.

---

## 8. Qué se hizo, en orden

| Commit | Qué trajo |
|---|---|
| `b48b8cd` | Primera versión: Plan del día, gestión de hábitos, metas, progreso, PWA offline. |
| `179ecd3` | Rediseño con el lenguaje visual de Fitia: tema claro, tira de la semana, tarjeta de avance con arcos y barra de pestañas flotante. |
| `134b3f5` | Frases motivacionales y galería de fotos (IndexedDB). |
| `e21cb82` | Arreglo: los campos del modal se desbordaban. |
| `cad4fcd` | Pestaña **Heart** con el balance, nombres BODY / SOUL / TALENT y piel rosa. |
| `760b7e4` | Colores nuevos por dimensión, carita del balance, rebote al marcar, lluvia de corazones y stickers. |

---

## 9. Ideas que quedaron pendientes

- Descargar toda la galería de una vez (un ZIP) para respaldar fuera del teléfono.
- Reordenar hábitos arrastrando y elegir su icono al crearlos.
- Tendencia de las tres dimensiones semana a semana dentro de Heart.
- Recordatorios (requiere permisos de notificación).
