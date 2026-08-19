/* Tati - dashboard del plan de mejora.
   Todo el estado vive en localStorage; no hay servidor ni cuentas. */

const KEY = 'tati.plan.v1'
const UMBRAL_DIA = 70 // % de hábitos para dar el día por cumplido
const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const DIAS_NOMBRE = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const VACIO = { valores: {}, animo: 0, nota: '', cerrado: false }

/* ---------------- utilidades ---------------- */

const $ = (sel) => document.querySelector(sel)
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3)

function esc(txt) {
    return String(txt).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function iso(fecha) {
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    const d = String(fecha.getDate()).padStart(2, '0')
    return fecha.getFullYear() + '-' + m + '-' + d
}
function fechaDe(txt) {
    const [a, m, d] = txt.split('-').map(Number)
    return new Date(a, m - 1, d)
}
const hoyISO = () => iso(new Date())
function sumarDias(txt, n) {
    const f = fechaDe(txt)
    f.setDate(f.getDate() + n)
    return iso(f)
}
// Lunes de la semana a la que pertenece la fecha.
function lunesDe(txt) {
    const f = fechaDe(txt)
    const desplazamiento = (f.getDay() + 6) % 7
    return sumarDias(txt, -desplazamiento)
}
const pilarDe = (id) => PILARES.find((p) => p.id === id) || PILARES[0]

/* ---------------- estado ---------------- */

function semilla() {
    return {
        version: 1,
        habitos: HABITOS_INICIALES.map((h) => Object.assign({ id: uid(), activo: true }, h)),
        metas: METAS_INICIALES.map((m) => ({
            id: uid(),
            pilar: m.pilar,
            nombre: m.nombre,
            pasos: m.pasos.map((t) => ({ id: uid(), texto: t, hecho: false })),
        })),
        registro: {},
        frasesFav: [],
        frasesPropias: [],
        fraseDelDia: {},
    }
}

function cargar() {
    try {
        const crudo = localStorage.getItem(KEY)
        if (!crudo) return null
        const s = JSON.parse(crudo)
        if (!s || !Array.isArray(s.habitos) || !Array.isArray(s.metas)) return null
        if (!s.registro || typeof s.registro !== 'object') s.registro = {}
        if (!Array.isArray(s.frasesFav)) s.frasesFav = []
        if (!Array.isArray(s.frasesPropias)) s.frasesPropias = []
        if (!s.fraseDelDia || typeof s.fraseDelDia !== 'object') s.fraseDelDia = {}
        return s
    } catch (e) {
        console.warn('No se pudo leer el almacenamiento local', e)
        return null
    }
}

function guardar() {
    try {
        localStorage.setItem(KEY, JSON.stringify(estado))
    } catch (e) {
        console.warn('No se pudo guardar', e)
    }
}

let estado = cargar()
if (!estado) {
    estado = semilla()
    guardar() // deja el plan inicial guardado desde la primera visita
}
let vista = 'hoy'
let periodo = 7
let fecha = hoyISO()
let lunes = lunesDe(fecha)
let verTabla = false
let ultimoPop = null

/* ---------------- cálculos ---------------- */

function habitosDelDia(dia) {
    const wd = fechaDe(dia).getDay()
    return estado.habitos.filter((h) => h.activo !== false && h.dias.includes(wd))
}
function reg(dia) {
    return estado.registro[dia] || VACIO
}
function regEditable(dia) {
    if (!estado.registro[dia]) estado.registro[dia] = { valores: {}, animo: 0, nota: '', cerrado: false }
    return estado.registro[dia]
}
function valor(dia, habitoId) {
    return reg(dia).valores[habitoId] || 0
}
const objetivo = (h) => (h.tipo === 'cantidad' ? Number(h.meta) || 1 : 1)
const cumplido = (h, v) => v >= objetivo(h)

function progresoDia(dia) {
    const lista = habitosDelDia(dia)
    const porPilar = {}
    PILARES.forEach((p) => (porPilar[p.id] = { hechos: 0, total: 0 }))
    let hechos = 0
    lista.forEach((h) => {
        const casilla = porPilar[h.pilar] || (porPilar[h.pilar] = { hechos: 0, total: 0 })
        casilla.total++
        if (cumplido(h, valor(dia, h.id))) {
            casilla.hechos++
            hechos++
        }
    })
    return {
        lista,
        porPilar,
        hechos,
        total: lista.length,
        pct: lista.length ? Math.round((hechos * 100) / lista.length) : 0,
    }
}

function diaCumplido(dia) {
    const p = progresoDia(dia)
    return p.total > 0 && p.pct >= UMBRAL_DIA
}

function rachaActual() {
    let cursor = hoyISO()
    if (!diaCumplido(cursor)) cursor = sumarDias(cursor, -1)
    let n = 0
    for (let i = 0; i < 730; i++) {
        const p = progresoDia(cursor)
        if (p.total === 0) {
            cursor = sumarDias(cursor, -1)
            continue // un día sin hábitos programados no rompe la racha
        }
        if (p.pct < UMBRAL_DIA) break
        n++
        cursor = sumarDias(cursor, -1)
    }
    return n
}

function mejorRacha() {
    const dias = Object.keys(estado.registro).sort()
    if (!dias.length) return rachaActual()
    let cursor = dias[0]
    const fin = hoyISO()
    let mejor = 0
    let actual = 0
    for (let i = 0; i < 1500 && cursor <= fin; i++) {
        const p = progresoDia(cursor)
        if (p.total > 0) {
            if (p.pct >= UMBRAL_DIA) {
                actual++
                if (actual > mejor) mejor = actual
            } else {
                actual = 0
            }
        }
        cursor = sumarDias(cursor, 1)
    }
    return Math.max(mejor, rachaActual())
}

function ultimosDias(n, hasta) {
    const fin = hasta || hoyISO()
    const salida = []
    for (let i = n - 1; i >= 0; i--) {
        const dia = sumarDias(fin, -i)
        salida.push(Object.assign({ dia }, progresoDia(dia)))
    }
    return salida
}

/* ---------------- vista: Hoy ---------------- */

function tituloDia() {
    const hoy = hoyISO()
    if (fecha === hoy) return 'Hoy'
    if (fecha === sumarDias(hoy, -1)) return 'Ayer'
    const f = fechaDe(fecha)
    return f.getDate() + ' de ' + MESES[f.getMonth()].slice(0, 3)
}

function renderSemana() {
    const hoy = hoyISO()
    const dias = []
    for (let i = 0; i < 7; i++) dias.push(sumarDias(lunes, i))
    $('#week-days').innerHTML = dias
        .map((d) => {
            const f = fechaDe(d)
            const prog = progresoDia(d)
            const futuro = d > hoy
            let clase = 'wday'
            if (d === fecha) clase += ' sel'
            else if (d === hoy) clase += ' hoy'
            let punto = 'dot'
            if (!futuro && prog.hechos > 0) punto += prog.pct >= UMBRAL_DIA ? ' full' : ' on'
            return (
                '<button class="' + clase + '" data-dia="' + d + '"' + (futuro ? ' disabled' : '') +
                ' aria-label="' + DIAS_NOMBRE[f.getDay()] + ' ' + f.getDate() + '"' +
                ' aria-pressed="' + (d === fecha) + '">' +
                '<span class="letra">' + DIAS_CORTOS[f.getDay()] + '</span>' +
                '<span class="num">' + f.getDate() + '</span>' +
                '<span class="' + punto + '"></span></button>'
            )
        })
        .join('')
    $('#week-next').disabled = sumarDias(lunes, 7) > hoy
}

function polar(cx, cy, r, grados) {
    const a = (grados * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}
function arco(a0, a1, color, ancho, cx, cy, r) {
    if (a1 - a0 < 0.8) return ''
    const fin = Math.min(a1, a0 + 359.9)
    const [x0, y0] = polar(cx, cy, r, a0)
    const [x1, y1] = polar(cx, cy, r, fin)
    const grande = fin - a0 > 180 ? 1 : 0
    return (
        '<path d="M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + grande + ' 1 ' +
        x1.toFixed(2) + ' ' + y1.toFixed(2) + '" fill="none" stroke="' + color + '" stroke-width="' + ancho +
        '" stroke-linecap="round"/>'
    )
}

// Arco plano y ancho, al estilo de un medidor: cada área ocupa la porción
// que le corresponde según cuántos hábitos tiene programados ese día.
function dibujarMedidor(prog) {
    const cx = 160
    const cy = 430
    const r = 400
    const desde = 250
    const hasta = 290
    const ancho = 11
    const svg = $('#gauge')
    const activos = PILARES.filter((p) => (prog.porPilar[p.id] || {}).total > 0)
    if (!activos.length) {
        svg.innerHTML = arco(desde, hasta, 'var(--surface-2)', ancho, cx, cy, r)
        return
    }
    const separacion = 4
    let html = ''
    let ang = desde
    activos.forEach((p) => {
        const casilla = prog.porPilar[p.id]
        const porcion = (casilla.total / prog.total) * (hasta - desde)
        const inicio = ang + separacion / 2
        const largo = Math.max(porcion - separacion, 0)
        html += arco(inicio, inicio + largo, 'var(--surface-2)', ancho, cx, cy, r)
        const f = casilla.hechos / casilla.total
        if (f > 0) html += arco(inicio, inicio + largo * f, p.color, ancho, cx, cy, r)
        ang += porcion
    })
    svg.innerHTML = html
}

function filaHabito(h, dia) {
    const v = valor(dia, h.id)
    const meta = objetivo(h)
    const ok = cumplido(h, v)
    const p = pilarDe(h.pilar)
    const pop = h.id === ultimoPop ? ' pop' : ''
    let control
    if (h.tipo === 'cantidad') {
        control =
            '<div class="stepper">' +
            '<button data-accion="menos" data-id="' + h.id + '" aria-label="Restar en ' + esc(h.nombre) + '">&#8722;</button>' +
            '<span class="value"' + (ok ? ' style="color:' + p.color + '"' : '') + '>' + v + ' / ' + meta + '</span>' +
            '<button data-accion="mas" data-id="' + h.id + '" aria-label="Sumar en ' + esc(h.nombre) + '">+</button>' +
            '</div>'
    } else {
        control =
            '<button class="check' + (ok ? ' on' : '') + pop + '" data-accion="alternar" data-id="' + h.id + '"' +
            (ok ? ' style="background:' + p.color + ';border-color:' + p.color + '"' : '') +
            ' aria-pressed="' + ok + '" aria-label="' + esc(h.nombre) + '">&#10003;</button>'
    }
    const detalle = h.tipo === 'cantidad' ? esc(h.unidad || '') : ok ? 'Hecho' : 'Pendiente'
    return (
        '<div class="habit' + (ok ? ' done' : '') + '">' +
        '<span class="thumb" style="background:' + p.tinte + '" aria-hidden="true">' + (h.icono || p.icono) + '</span>' +
        '<div class="habit-main" data-accion="alternar" data-id="' + h.id + '" role="button" tabindex="0">' +
        '<span class="habit-name">' + esc(h.nombre) + '</span>' +
        '<span class="habit-meta">' + detalle + '</span>' +
        '</div>' + control + '</div>'
    )
}

function renderHoy() {
    const prog = progresoDia(fecha)
    const r = reg(fecha)
    $('#day-title').textContent = tituloDia()
    $('#streak-n').textContent = rachaActual()
    renderSemana()

    $('#hero-done').textContent = prog.hechos
    $('#hero-total').textContent = prog.total
    dibujarMedidor(prog)
    $('#gauge-desc').textContent =
        'Avance del día: ' + prog.pct + ' por ciento. ' +
        PILARES.map((p) => p.nombre + ' ' + prog.porPilar[p.id].hechos + ' de ' + prog.porPilar[p.id].total).join('. ')

    $('#area-cols').innerHTML = PILARES.map((p) => {
        const c = prog.porPilar[p.id]
        const pct = c.total ? (c.hechos * 100) / c.total : 0
        return (
            '<div class="area-col">' +
            '<span class="nombre">' + esc(p.nombre) + '</span>' +
            '<span class="cifra">' + c.hechos + ' <small>/ ' + c.total + '</small></span>' +
            '<span class="mini-track"><span class="mini-fill" style="width:' + pct + '%;background:' + p.color + '"></span></span>' +
            '</div>'
        )
    }).join('')

    const cerrado = !!r.cerrado
    const btn = $('#btn-finish')
    btn.textContent = cerrado ? 'Día terminado · ' + prog.pct + '%' : 'Terminar día'
    btn.classList.toggle('done', cerrado)

    $('#areas').innerHTML = PILARES.map((p) => {
        const lista = prog.lista.filter((h) => h.pilar === p.id)
        const c = prog.porPilar[p.id]
        const pct = c.total ? Math.round((c.hechos * 100) / c.total) : 0
        const cuerpo = lista.length
            ? lista.map((h) => filaHabito(h, fecha)).join('')
            : '<div class="habit"><span class="habit-meta" style="padding-left:2px">Hoy no hay nada programado en esta área.</span></div>'
        return (
            '<section class="card area-card">' +
            '<div class="area-head">' +
            '<div class="txt"><h2>' + esc(p.nombre) + '</h2>' +
            '<p class="area-sum">' + c.hechos + ' de ' + c.total + ' hábitos <span class="punto">·</span> ' + pct + '%</p></div>' +
            '<span class="area-badge" style="background:' + p.tinte + '" aria-hidden="true">' + p.icono + '</span>' +
            '</div>' + cuerpo +
            '<button class="add-row" data-accion="nuevo-habito" data-pilar="' + p.id + '" aria-label="Agregar hábito a ' + esc(p.nombre) + '">+</button>' +
            '</section>'
        )
    }).join('')

    $('#mood').innerHTML = ANIMOS.map(
        (a) =>
            '<button data-accion="animo" data-valor="' + a.valor + '" class="' + (r.animo === a.valor ? 'on' : '') +
            '" aria-pressed="' + (r.animo === a.valor) + '" title="' + a.texto + '" aria-label="' + a.texto + '">' + a.icono + '</button>'
    ).join('')
    $('#nota').value = r.nota || ''
    renderFrase()
    renderFotosDia()
}

/* ---------------- vista: Planes ---------------- */

function chipsDias(h, color) {
    return (
        '<div class="days" aria-label="Días">' +
        DIAS_CORTOS.map((d, i) => {
            const on = h.dias.includes(i)
            return '<span class="' + (on ? 'on' : '') + '"' + (on ? ' style="background:' + color + '"' : '') + '>' + d + '</span>'
        }).join('') +
        '</div>'
    )
}

function renderPlanes() {
    $('#planes').innerHTML = PILARES.map((p) => {
        const lista = estado.habitos.filter((h) => h.pilar === p.id)
        const items = lista.length
            ? lista
                  .map(
                      (h) =>
                          '<div class="plan-item' + (h.activo === false ? ' off' : '') + '">' +
                          '<span class="thumb" style="background:' + p.tinte + '" aria-hidden="true">' + (h.icono || p.icono) + '</span>' +
                          '<div class="habit-main" data-accion="editar-habito" data-id="' + h.id + '" role="button" tabindex="0">' +
                          '<span class="habit-name">' + esc(h.nombre) + '</span>' +
                          '<span class="habit-meta">' +
                          (h.tipo === 'cantidad' ? h.meta + ' ' + esc(h.unidad || '') : 'marcar y listo') +
                          '</span>' + chipsDias(h, p.color) + '</div>' +
                          '<button class="mini-btn" data-accion="activar" data-id="' + h.id + '">' +
                          (h.activo === false ? 'Activar' : 'Pausar') + '</button>' +
                          '</div>'
                  )
                  .join('')
            : '<p class="card-sub">Todavía no hay hábitos en esta área.</p>'
        return (
            '<section class="plan-group">' +
            '<div class="plan-group-head">' +
            '<span class="dot" style="background:' + p.color + '"></span>' +
            '<h2>' + esc(p.nombre) + '</h2>' +
            '<button class="link-btn" data-accion="nuevo-habito" data-pilar="' + p.id + '">+ Hábito</button>' +
            '</div>' + items + '</section>'
        )
    }).join('')
}

/* ---------------- vista: Metas ---------------- */

function renderMetas() {
    if (!estado.metas.length) {
        $('#metas').innerHTML = '<p class="card-sub">Aún no hay metas. Usa el botón + para crear la primera.</p>'
        return
    }
    $('#metas').innerHTML = estado.metas
        .map((m) => {
            const p = pilarDe(m.pilar)
            const hechos = m.pasos.filter((s) => s.hecho).length
            const pct = m.pasos.length ? Math.round((hechos * 100) / m.pasos.length) : 0
            const pasos = m.pasos
                .map(
                    (s) =>
                        '<div class="step' + (s.hecho ? ' done' : '') + '">' +
                        '<button class="check' + (s.hecho ? ' on' : '') + '" data-accion="paso" data-meta="' + m.id + '" data-id="' + s.id + '"' +
                        (s.hecho ? ' style="background:' + p.color + ';border-color:' + p.color + '"' : '') +
                        ' aria-pressed="' + s.hecho + '" aria-label="' + esc(s.texto) + '">&#10003;</button>' +
                        '<span class="txt">' + esc(s.texto) + '</span>' +
                        '<button class="mini-btn" data-accion="borrar-paso" data-meta="' + m.id + '" data-id="' + s.id + '" aria-label="Borrar paso">&#10005;</button>' +
                        '</div>'
                )
                .join('')
            return (
                '<section class="card goal">' +
                '<div class="goal-head">' +
                '<h3>' + esc(m.nombre) +
                ' <span class="chip-dim" style="color:' + p.color + ';background:' + p.tinte + '">' + esc(p.nombre) + '</span></h3>' +
                '<span class="goal-count">' + hechos + '/' + m.pasos.length + '</span>' +
                '<button class="mini-btn danger" data-accion="borrar-meta" data-id="' + m.id + '" aria-label="Borrar meta">&#10005;</button>' +
                '</div>' +
                '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%;background:' + p.color + '"></span></span>' +
                pasos +
                '<button class="mini-btn" data-accion="nuevo-paso" data-id="' + m.id + '" style="align-self:flex-start">+ Paso</button>' +
                '</section>'
            )
        })
        .join('')
}

/* ---------------- vista: Heart ---------------- */

// Resume un periodo: cuántos hábitos de cada dimensión se cumplieron.
function resumenPeriodo(n) {
    const dias = ultimosDias(n)
    const porDim = {}
    PILARES.forEach((p) => (porDim[p.id] = { hechos: 0, total: 0, pct: 0 }))
    dias.forEach((d) => {
        PILARES.forEach((p) => {
            porDim[p.id].hechos += d.porPilar[p.id].hechos
            porDim[p.id].total += d.porPilar[p.id].total
        })
    })
    PILARES.forEach((p) => {
        const c = porDim[p.id]
        c.pct = c.total ? Math.round((c.hechos * 100) / c.total) : 0
    })
    return { dias, porDim }
}

// Qué tan parejas van las tres: la más floja comparada con la más fuerte.
function equilibrioDe(valores) {
    const alto = Math.max.apply(null, valores)
    const bajo = Math.min.apply(null, valores)
    return alto > 0 ? Math.round((bajo / alto) * 100) : 0
}

const ANGULOS = { cuerpo: -90, creatividad: 150, carrera: 30 }

function caraDelBalance(equilibrio, valores) {
    if (!valores.some((v) => v > 0)) return 'dormida'
    if (equilibrio >= 85) return 'feliz'
    if (equilibrio >= 60) return 'contenta'
    return 'triste'
}

function dibujarRadar(porDim, animo) {
    const cx = 150
    const cy = 136
    const r = 82
    const punto = (grados, fraccion) => {
        const a = (grados * Math.PI) / 180
        return [cx + r * fraccion * Math.cos(a), cy + r * fraccion * Math.sin(a)]
    }
    const triangulo = (fraccion) =>
        PILARES.map((p) => punto(ANGULOS[p.id], fraccion).map((v) => v.toFixed(1)).join(',')).join(' ')

    let html =
        '<defs><linearGradient id="grad-dim" x1="0" y1="0" x2="1" y2="1">' +
        PILARES.map((p, i) => '<stop offset="' + (i * 50) + '%" stop-color="' + p.color + '"/>').join('') +
        '</linearGradient></defs>'
    // rejilla: 25, 50, 75 y 100 por ciento
    ;[0.25, 0.5, 0.75, 1].forEach((f) => {
        html += '<polygon points="' + triangulo(f) + '" fill="none" stroke="var(--line)" stroke-width="1"/>'
    })
    PILARES.forEach((p) => {
        const [x, y] = punto(ANGULOS[p.id], 1)
        html += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>'
    })

    // figura de los datos
    const puntos = PILARES.map((p) => punto(ANGULOS[p.id], Math.max(porDim[p.id].pct, 0) / 100))
    html +=
        '<polygon points="' + puntos.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ') + '" ' +
        'fill="url(#grad-dim)" fill-opacity="0.22" stroke="var(--serie)" stroke-width="1.8" stroke-linejoin="round" stroke-opacity="0.6"/>'

    html += caritaKawaii(cx, cy, animo)

    PILARES.forEach((p, i) => {
        const [x, y] = puntos[i]
        html += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="' + p.color + '" stroke="var(--surface)" stroke-width="2"/>'
    })

    // etiquetas por fuera, con nombre y porcentaje (nunca solo el color)
    PILARES.forEach((p) => {
        const [x, y] = punto(ANGULOS[p.id], 1.3)
        const ancla = ANGULOS[p.id] === -90 ? 'middle' : ANGULOS[p.id] === 30 ? 'start' : 'end'
        const dy = ANGULOS[p.id] === -90 ? -4 : 10
        html +=
            '<text x="' + x.toFixed(1) + '" y="' + (y + dy).toFixed(1) + '" text-anchor="' + ancla + '" font-size="13" font-weight="700" fill="var(--text)">' + p.nombre + '</text>' +
            '<text x="' + x.toFixed(1) + '" y="' + (y + dy + 15).toFixed(1) + '" text-anchor="' + ancla + '" font-size="12" fill="var(--muted)">' + porDim[p.id].pct + '%</text>'
    })
    $('#radar').innerHTML = html
}

// Carita del centro: cambia según qué tan parejas van las tres dimensiones.
function caritaKawaii(cx, cy, animo) {
    const OJOS = {
        feliz: '<path d="M-11 -1 q4.5 -6 9 0"/><path d="M2 -1 q4.5 -6 9 0"/>',
        dormida: '<path d="M-10.5 -2 h7"/><path d="M3.5 -2 h7"/>',
        otros: '<circle cx="-6.5" cy="-2.5" r="2.2" fill="var(--text)" stroke="none"/>' +
               '<circle cx="6.5" cy="-2.5" r="2.2" fill="var(--text)" stroke="none"/>',
    }
    const BOCAS = {
        feliz: '<path d="M-7 4.5 q7 7.5 14 0"/>',
        contenta: '<path d="M-5 5 q5 4.5 10 0"/>',
        dormida: '<path d="M-3.5 6 q3.5 3 7 0"/>',
        triste: '<path d="M-5 8.5 q5 -4.5 10 0"/>',
    }
    const ojos = OJOS[animo] || OJOS.otros
    const boca = BOCAS[animo] || BOCAS.contenta
    const rubor = PILARES[0].color
    return (
        '<g transform="translate(' + cx + ',' + cy + ')">' +
        '<circle r="23" fill="var(--surface)" opacity="0.9"/>' +
        '<circle cx="-12.5" cy="3.5" r="4.3" fill="' + rubor + '" opacity="0.32"/>' +
        '<circle cx="12.5" cy="3.5" r="4.3" fill="' + rubor + '" opacity="0.32"/>' +
        '<g fill="none" stroke="var(--text)" stroke-width="2" stroke-linecap="round">' +
        ojos + boca + '</g></g>'
    )
}

// Serie del gráfico: días sueltos hasta 30, semanas cuando el periodo es largo.
function serieDelPeriodo(n) {
    const dias = ultimosDias(n)
    if (n <= 30) {
        return dias.map((d) => {
            const f = fechaDe(d.dia)
            return {
                pct: d.pct,
                hechos: d.hechos,
                total: d.total,
                etiqueta: n <= 14 ? DIAS_CORTOS[f.getDay()] : String(f.getDate()),
                titulo: f.getDate() + ' ' + MESES[f.getMonth()].slice(0, 3),
            }
        })
    }
    const semanas = []
    for (let fin = dias.length; fin > 0; fin -= 7) {
        const trozo = dias.slice(Math.max(0, fin - 7), fin)
        const hechos = trozo.reduce((a, d) => a + d.hechos, 0)
        const total = trozo.reduce((a, d) => a + d.total, 0)
        const f = fechaDe(trozo[0].dia)
        semanas.unshift({
            pct: total ? Math.round((hechos * 100) / total) : 0,
            hechos,
            total,
            etiqueta: f.getDate() + '/' + (f.getMonth() + 1),
            titulo: 'semana del ' + f.getDate() + ' ' + MESES[f.getMonth()].slice(0, 3),
        })
    }
    return semanas
}

function barraRedondeada(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h)
    if (h <= 0.5) return ''
    return (
        'M' + x + ' ' + (y + h) + ' V' + (y + rr) + ' Q' + x + ' ' + y + ' ' + (x + rr) + ' ' + y +
        ' H' + (x + w - rr) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + rr) +
        ' V' + (y + h) + ' Z'
    )
}

function dibujarGrafico(datos) {
    const svg = $('#chart')
    const izq = 28
    const der = 314
    const arriba = 12
    const abajo = 120
    const alto = abajo - arriba
    const hueco = datos.length > 20 ? 1 : 2
    const ancho = (der - izq - hueco * (datos.length - 1)) / datos.length
    const cadaCuantas = datos.length > 16 ? Math.ceil(datos.length / 8) : 1
    let html = ''

    ;[0, 50, 100].forEach((v) => {
        const y = abajo - (v / 100) * alto
        html +=
            '<line x1="' + izq + '" y1="' + y + '" x2="' + der + '" y2="' + y + '" stroke="var(--line)" stroke-width="1"/>' +
            '<text x="' + (izq - 6) + '" y="' + (y + 3.5) + '" text-anchor="end" font-size="9" fill="var(--muted)">' + v + '</text>'
    })

    datos.forEach((d, i) => {
        const x = izq + i * (ancho + hueco)
        const h = (d.pct / 100) * alto
        const y = abajo - h
        const texto = d.total === 0 ? 'sin hábitos' : d.pct + '% (' + d.hechos + '/' + d.total + ')'
        html += '<g class="bar" tabindex="0" role="listitem" aria-label="' + d.titulo + ' - ' + texto + '" data-i="' + i + '">'
        if (d.total === 0) {
            html += '<line x1="' + x + '" y1="' + abajo + '" x2="' + (x + ancho) + '" y2="' + abajo + '" stroke="var(--line)" stroke-width="2"/>'
        } else if (h < 1.5) {
            html += '<line x1="' + x + '" y1="' + abajo + '" x2="' + (x + ancho) + '" y2="' + abajo + '" stroke="var(--muted)" stroke-width="2"/>'
        } else {
            html += '<path d="' + barraRedondeada(x, y, ancho, h, 4) + '" fill="var(--serie)"/>'
        }
        html += '<rect class="bar-hit" x="' + x + '" y="' + arriba + '" width="' + ancho + '" height="' + (alto + 16) + '"/>'
        if ((datos.length - 1 - i) % cadaCuantas === 0) {
            html += '<text x="' + (x + ancho / 2) + '" y="' + (abajo + 14) + '" text-anchor="middle" font-size="9" fill="var(--muted)">' + d.etiqueta + '</text>'
        }
        html += '</g>'
    })
    svg.innerHTML = '<g role="list">' + html + '</g>'

    const tip = $('#tip')
    const mostrar = (i) => {
        const d = datos[i]
        tip.innerHTML =
            d.titulo + ' &middot; ' + (d.total === 0 ? 'sin hábitos' : '<b>' + d.pct + '%</b> (' + d.hechos + '/' + d.total + ')')
        const caja = svg.getBoundingClientRect()
        const escala = caja.width / 320
        const centro = (izq + i * (ancho + hueco) + ancho / 2) * escala
        const margen = tip.offsetWidth / 2 + 4
        tip.style.left = Math.min(Math.max(centro, margen), caja.width - margen) + 'px'
        tip.style.top = Math.max(18, (abajo - (d.pct / 100) * alto) * escala - 6) + 'px'
        tip.classList.add('on')
    }
    const ocultar = () => tip.classList.remove('on')
    svg.querySelectorAll('.bar').forEach((g) => {
        const i = Number(g.dataset.i)
        g.addEventListener('mouseenter', () => mostrar(i))
        g.addEventListener('focus', () => mostrar(i))
        g.addEventListener('mouseleave', ocultar)
        g.addEventListener('blur', ocultar)
        g.addEventListener('click', () => mostrar(i))
    })
    svg.addEventListener('mouseleave', ocultar)
}

function renderHeart() {
    const { dias, porDim } = resumenPeriodo(periodo)
    const valores = PILARES.map((p) => porDim[p.id].pct)
    const equilibrio = equilibrioDe(valores)
    const conHabitos = dias.filter((d) => d.total > 0)
    const promedio = conHabitos.length
        ? Math.round(conHabitos.reduce((a, d) => a + d.pct, 0) / conHabitos.length)
        : 0
    const cumplidos = conHabitos.filter((d) => d.pct >= UMBRAL_DIA).length
    const floja = PILARES.slice().sort((a, b) => porDim[a.id].pct - porDim[b.id].pct)[0]

    $('#balance-num').textContent = equilibrio + '%'
    dibujarRadar(porDim, caraDelBalance(equilibrio, valores))
    $('#radar-desc').textContent =
        'Equilibrio ' + equilibrio + ' por ciento. ' +
        PILARES.map((p) => p.nombre + ' ' + porDim[p.id].pct + ' por ciento').join('. ')

    let mensaje
    if (!valores.some((v) => v > 0)) mensaje = 'Todavía no hay nada marcado en este periodo. Empieza por un hábito pequeño.'
    else if (equilibrio >= 85) mensaje = 'Tus tres dimensiones van parejas. Así se ve el equilibrio.'
    else if (equilibrio >= 60) mensaje = 'Vas bien: ' + floja.nombre + ' es la que pide un poquito más.'
    else mensaje = floja.nombre + ' se quedó atrás en este periodo. Elige un solo hábito de esa dimensión para mañana.'
    $('#balance-msg').textContent = mensaje

    $('#dim-periodo').textContent = 'últimos ' + periodo + ' días'
    $('#dimensiones').innerHTML = PILARES.map((p) => {
        const c = porDim[p.id]
        return (
            '<div class="bar-row">' +
            '<span class="label">' + esc(p.nombre) + '</span>' +
            '<span class="bar-track"><span class="bar-fill" style="width:' + c.pct + '%;background:' + p.color + '"></span></span>' +
            '<span class="value">' + c.pct + '%</span>' +
            '</div>' +
            '<p class="dim-detalle">' + esc(p.lema) + ' <span class="punto">·</span> ' + c.hechos + ' de ' + c.total + ' hábitos</p>'
        )
    }).join('')

    const tarjetas = [
        { v: rachaActual(), l: 'días de racha' },
        { v: mejorRacha(), l: 'mejor racha' },
        { v: promedio + '%', l: 'promedio del periodo' },
        { v: cumplidos + '/' + conHabitos.length, l: 'días cumplidos' },
    ]
    $('#stats').innerHTML = tarjetas
        .map((t) => '<div class="stat"><div class="stat-value">' + t.v + '</div><div class="stat-label">' + t.l + '</div></div>')
        .join('')

    const serie = serieDelPeriodo(periodo)
    $('#chart-sub').textContent =
        periodo > 30 ? 'Porcentaje de hábitos completados, por semana.' : 'Porcentaje de hábitos completados, por día.'
    dibujarGrafico(serie)

    $('#chart-table').innerHTML =
        '<table><caption class="sr-only">Cumplimiento</caption><thead><tr><th>' +
        (periodo > 30 ? 'Semana' : 'Día') + '</th><th class="num">Cumplido</th><th class="num">Hábitos</th></tr></thead><tbody>' +
        serie
            .slice()
            .reverse()
            .map(
                (d) =>
                    '<tr><td>' + d.titulo + '</td>' +
                    '<td class="num">' + (d.total ? d.pct + '%' : '-') + '</td>' +
                    '<td class="num">' + d.hechos + '/' + d.total + '</td></tr>'
            )
            .join('') +
        '</tbody></table>'
}

/* ---------------- frases ---------------- */

const poolFrases = () => FRASES.concat(estado.frasesPropias || [])

function indiceFrase(dia) {
    const pool = poolFrases()
    if (!pool.length) return 0
    const guardado = estado.fraseDelDia[dia]
    if (typeof guardado === 'number') return guardado % pool.length
    let h = 0
    for (let i = 0; i < dia.length; i++) h = (h * 31 + dia.charCodeAt(i)) >>> 0
    return h % pool.length
}

function renderFrase() {
    const pool = poolFrases()
    const texto = pool.length ? pool[indiceFrase(fecha)] : ''
    $('#frase-texto').textContent = texto
    const fav = (estado.frasesFav || []).includes(texto)
    const boton = $('#frase-fav')
    boton.classList.toggle('on', fav)
    boton.setAttribute('aria-pressed', String(fav))
    boton.innerHTML = fav ? '&#9829;' : '&#9825;'
}

function modalFrases() {
    const mias = estado.frasesPropias || []
    const favs = estado.frasesFav || []
    const lista = (titulo, arreglo, accion) =>
        '<div><p class="card-sub" style="margin-bottom:4px">' + titulo + '</p>' +
        (arreglo.length
            ? arreglo
                  .map(
                      (t, i) =>
                          '<div class="frase-mia"><span>' + esc(t) + '</span>' +
                          '<button type="button" class="mini-btn" data-accion="' + accion + '" data-i="' + i + '" aria-label="Quitar">&#10005;</button></div>'
                  )
                  .join('')
            : '<p class="card-sub">Nada por aquí todavía.</p>') +
        '</div>'
    abrirModal(
        'Mis frases',
        '<div class="field"><label for="f-frase">Escribe una frase tuya</label>' +
            '<input id="f-frase" name="frase" maxlength="140" placeholder="La que te sirva a ti"></div>' +
            '<button type="submit" class="btn btn-primary">Agregar</button>' +
            lista('Guardadas', favs, 'quitar-fav') +
            lista('Mías', mias, 'quitar-mia'),
        (form) => {
            const texto = form.frase.value.trim()
            if (!texto) return false
            estado.frasesPropias.push(texto)
            guardar()
            modalFrases()
            return false // el modal se queda abierto mostrando la lista
        }
    )
}

/* ---------------- fotos ---------------- */

const urlsVivas = { dia: [], galeria: [], visor: null }
const cacheFotos = {}
let diaFotosPintado = null
let fotoVisible = null

function revocar(grupo) {
    urlsVivas[grupo].forEach((u) => URL.revokeObjectURL(u))
    urlsVivas[grupo] = []
}
function urlDe(blob, grupo) {
    const u = URL.createObjectURL(blob)
    urlsVivas[grupo].push(u)
    return u
}

function miniatura(f, grupo) {
    cacheFotos[f.id] = f
    const p = f.pilar ? pilarDe(f.pilar) : null
    return (
        '<button class="miniatura" data-accion="ver-foto" data-id="' + f.id + '">' +
        '<img src="' + urlDe(f.blob, grupo) + '" alt="' + esc(f.nota || 'Foto del ' + f.dia) + '">' +
        (grupo === 'galeria' ? '<span class="dia-chip">' + fechaDe(f.dia).getDate() + '</span>' : '') +
        (f.sticker ? '<span class="sticker" aria-hidden="true">' + f.sticker + '</span>' : '') +
        (p ? '<span class="marca" style="background:' + p.color + '"></span>' : '') +
        '</button>'
    )
}

function renderFotosDia(forzar) {
    const cont = $('#fotos-dia')
    if (!cont || (!forzar && diaFotosPintado === fecha)) return
    diaFotosPintado = fecha
    fotosDelDia(fecha)
        .then((lista) => {
            revocar('dia')
            cont.innerHTML = lista.sort((a, b) => b.creado - a.creado).map((f) => miniatura(f, 'dia')).join('')
        })
        .catch(() => {
            cont.innerHTML = '<p class="card-sub">No se pudieron cargar las fotos en este navegador.</p>'
        })
}

function renderGaleria() {
    listarFotos()
        .then((lista) => {
            revocar('galeria')
            if (!lista.length) {
                $('#galeria-sub').textContent = 'Tu archivo de avances'
                $('#galeria').innerHTML =
                    '<div class="galeria-vacia"><p>Aquí se guardan tus fotos del día a día: el bordado que avanzó, el plato que preparaste, la caminata.</p>' +
                    '<button class="btn btn-primary" data-accion="agregar-foto">Agregar la primera foto</button></div>'
                return
            }
            const bytes = lista.reduce((a, f) => a + (f.blob.size || 0), 0)
            const peso = bytes >= 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB'
            $('#galeria-sub').textContent =
                lista.length + (lista.length === 1 ? ' foto' : ' fotos') + ' · ' + peso
            const meses = []
            lista.forEach((f) => {
                const clave = f.dia.slice(0, 7)
                let grupo = meses.find((m) => m.clave === clave)
                if (!grupo) meses.push((grupo = { clave, fotos: [] }))
                grupo.fotos.push(f)
            })
            $('#galeria').innerHTML = meses
                .map((m) => {
                    const [anio, mes] = m.clave.split('-').map(Number)
                    return (
                        '<section class="galeria-mes"><h2>' + MESES[mes - 1] + ' ' + anio + '</h2>' +
                        '<div class="galeria-grid">' + m.fotos.map((f) => miniatura(f, 'galeria')).join('') + '</div></section>'
                    )
                })
                .join('')
        })
        .catch(() => {
            $('#galeria').innerHTML = '<p class="card-sub">Este navegador no permite guardar fotos.</p>'
        })
}

function abrirVisor(id) {
    const f = cacheFotos[id]
    if (!f) return
    fotoVisible = f
    if (urlsVivas.visor) URL.revokeObjectURL(urlsVivas.visor)
    urlsVivas.visor = URL.createObjectURL(f.blob)
    const fe = fechaDe(f.dia)
    $('#visor-img').src = urlsVivas.visor
    $('#visor-img').alt = f.nota || 'Foto del ' + f.dia
    $('#visor-fecha').innerHTML =
        (f.sticker ? '<span class="sticker-grande" aria-hidden="true">' + f.sticker + '</span>' : '') +
        esc(DIAS_NOMBRE[fe.getDay()] + ' ' + fe.getDate() + ' de ' + MESES[fe.getMonth()] + ' de ' + fe.getFullYear())
    $('#visor-nota').textContent = f.nota || (f.pilar ? pilarDe(f.pilar).nombre : '')
    $('#visor').classList.remove('hidden')
}
function cerrarVisor() {
    $('#visor').classList.add('hidden')
    $('#visor-img').removeAttribute('src')
    if (urlsVivas.visor) URL.revokeObjectURL(urlsVivas.visor)
    urlsVivas.visor = null
    fotoVisible = null
}

function modalNuevaFoto(blob) {
    const previa = URL.createObjectURL(blob)
    abrirModal(
        'Nueva foto',
        '<img src="' + previa + '" alt="" class="previa">' +
            '<div class="field-row">' +
            '<div class="field"><label for="f-fdia">Día</label><input id="f-fdia" name="dia" type="date" value="' + fecha + '" max="' + hoyISO() + '"></div>' +
            '<div class="field"><label for="f-fpilar">Área</label><select id="f-fpilar" name="pilar"><option value="">Sin área</option>' +
            PILARES.map((p) => '<option value="' + p.id + '">' + esc(p.nombre) + '</option>').join('') +
            '</select></div></div>' +
            '<div class="field"><label for="f-fnota">Nota</label><input id="f-fnota" name="nota" maxlength="90" placeholder="¿Qué avance muestra esta foto?"></div>' +
            '<div class="field"><label>Sticker</label><div class="stickers" id="f-stickers">' +
            STICKERS.map((e, i) => '<button type="button" data-sticker="' + e + '"' + (i === 0 ? ' class="on"' : '') + ' aria-label="Sticker ' + (i + 1) + '">' + e + '</button>').join('') +
            '</div></div>' +
            '<button type="submit" class="btn btn-primary">Guardar foto</button>',
        (form) => {
            const elegido = $('#f-stickers').querySelector('button.on')
            const foto = {
                id: uid(),
                dia: form.dia.value || fecha,
                pilar: form.pilar.value,
                nota: form.nota.value.trim(),
                sticker: elegido ? elegido.dataset.sticker : '',
                creado: Date.now(),
                blob,
            }
            guardarFoto(foto)
                .then(() => {
                    URL.revokeObjectURL(previa)
                    if (vista === 'galeria') renderGaleria()
                    else renderFotosDia(true)
                })
                .catch(() => alert('No se pudo guardar la foto.'))
            return true
        }
    )
}

function elegirFoto() {
    $('#file-foto').click()
}

/* ---------------- render general ---------------- */

function render() {
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + vista))
    document.querySelectorAll('.tab').forEach((t) => {
        const on = t.dataset.view === vista
        t.classList.toggle('active', on)
        t.setAttribute('aria-selected', String(on))
    })
    if (vista === 'hoy') renderHoy()
    if (vista === 'planes') renderPlanes()
    if (vista === 'metas') renderMetas()
    if (vista === 'galeria') renderGaleria()
    if (vista === 'heart') renderHeart()
}

/* ---------------- modal ---------------- */

let alGuardarModal = null

function abrirModal(titulo, cuerpoHTML, alGuardar) {
    $('#modal-title').textContent = titulo
    $('#modal-form').innerHTML = cuerpoHTML
    alGuardarModal = alGuardar
    $('#modal').classList.remove('hidden')
    const primero = $('#modal-form input, #modal-form select')
    if (primero) primero.focus()
}
function cerrarModal() {
    $('#modal').classList.add('hidden')
    $('#modal-form').innerHTML = ''
    alGuardarModal = null
}

function formularioHabito(h) {
    const nuevo = !h.id
    return (
        '<div class="field"><label for="f-nombre">Nombre</label>' +
        '<input id="f-nombre" name="nombre" value="' + esc(h.nombre || '') + '" required maxlength="60" placeholder="Ej: caminar en la mañana"></div>' +
        '<div class="field-row">' +
        '<div class="field"><label for="f-pilar">Área</label><select id="f-pilar" name="pilar">' +
        PILARES.map((p) => '<option value="' + p.id + '"' + (h.pilar === p.id ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('') +
        '</select></div>' +
        '<div class="field"><label for="f-tipo">Tipo</label><select id="f-tipo" name="tipo">' +
        '<option value="check"' + (h.tipo !== 'cantidad' ? ' selected' : '') + '>Marcar</option>' +
        '<option value="cantidad"' + (h.tipo === 'cantidad' ? ' selected' : '') + '>Cantidad</option>' +
        '</select></div></div>' +
        '<div class="field-row" id="f-cantidad"' + (h.tipo === 'cantidad' ? '' : ' style="display:none"') + '>' +
        '<div class="field"><label for="f-meta">Meta</label><input id="f-meta" name="meta" type="number" min="1" step="1" value="' + (h.meta || 1) + '"></div>' +
        '<div class="field"><label for="f-unidad">Unidad</label><input id="f-unidad" name="unidad" maxlength="12" value="' + esc(h.unidad || '') + '" placeholder="min, páginas, vasos"></div>' +
        '</div>' +
        '<div class="field"><label>Días</label><div class="day-picker" id="f-dias">' +
        DIAS_CORTOS.map((d, i) => '<button type="button" data-dia="' + i + '" class="' + ((h.dias || []).includes(i) ? 'on' : '') + '">' + d + '</button>').join('') +
        '</div></div>' +
        '<button type="submit" class="btn btn-primary">Guardar</button>' +
        (nuevo ? '' : '<button type="button" class="btn btn-ghost danger" data-accion="borrar-habito" data-id="' + h.id + '">Borrar hábito</button>')
    )
}

function editarHabito(h, pilarPorDefecto) {
    const base = h || { pilar: pilarPorDefecto || PILARES[0].id, tipo: 'check', meta: 1, unidad: '', dias: [1, 2, 3, 4, 5], nombre: '' }
    abrirModal(h ? 'Editar hábito' : 'Nuevo hábito', formularioHabito(base), (form) => {
        const dias = Array.from($('#f-dias').querySelectorAll('button.on')).map((b) => Number(b.dataset.dia))
        const nombre = form.nombre.value.trim()
        if (!nombre) return false
        if (!dias.length) {
            alert('Elige al menos un día de la semana.')
            return false
        }
        const datos = {
            nombre,
            pilar: form.pilar.value,
            tipo: form.tipo.value,
            meta: form.tipo.value === 'cantidad' ? Math.max(1, Number(form.meta.value) || 1) : 1,
            unidad: form.tipo.value === 'cantidad' ? form.unidad.value.trim() : '',
            dias,
        }
        if (h) {
            Object.assign(h, datos)
        } else {
            estado.habitos.push(Object.assign({ id: uid(), activo: true }, datos))
        }
        guardar()
        return true
    })
}

function nuevaMeta() {
    abrirModal(
        'Nueva meta',
        '<div class="field"><label for="f-nombre">Nombre de la meta</label>' +
            '<input id="f-nombre" name="nombre" required maxlength="80" placeholder="Ej: portafolio en línea"></div>' +
            '<div class="field"><label for="f-pilar">Área</label><select id="f-pilar" name="pilar">' +
            PILARES.map((p) => '<option value="' + p.id + '">' + esc(p.nombre) + '</option>').join('') +
            '</select></div>' +
            '<button type="submit" class="btn btn-primary">Crear</button>',
        (form) => {
            const nombre = form.nombre.value.trim()
            if (!nombre) return false
            estado.metas.push({ id: uid(), pilar: form.pilar.value, nombre, pasos: [] })
            guardar()
            return true
        }
    )
}

/* ---------------- acciones ---------------- */

// Lluvia de corazones cuando el día queda completo.
function celebrar() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const capa = document.createElement('div')
    capa.className = 'corazones'
    capa.setAttribute('aria-hidden', 'true')
    const dulces = ['\u{1F497}', '\u2728', '\u{1F338}', '\u{1F496}', '\u2B50']
    for (let i = 0; i < 10; i++) {
        const s = document.createElement('span')
        s.textContent = dulces[i % dulces.length]
        s.style.left = 8 + ((i * 29) % 80) + '%'
        s.style.setProperty('--dx', (((i * 37) % 70) - 35) + 'px')
        s.style.setProperty('--giro', (((i * 53) % 60) - 30) + 'deg')
        s.style.animationDelay = (i * 0.07).toFixed(2) + 's'
        capa.appendChild(s)
    }
    document.body.appendChild(capa)
    setTimeout(() => capa.remove(), 2600)
}

// Marca el hábito para que rebote y celebra si el día quedó completo.
function despuesDeMarcar(id, antes) {
    ultimoPop = id
    setTimeout(() => {
        ultimoPop = null
    }, 500)
    guardar()
    renderHoy()
    const ahora = progresoDia(fecha)
    if (ahora.total > 0 && ahora.pct === 100 && antes < 100) celebrar()
}

function paso(h) {
    const meta = objetivo(h)
    if (meta >= 1000) return 500
    if (meta >= 60) return 10
    if (meta >= 20) return 5
    return 1
}

function cambiarValor(id, delta) {
    const h = estado.habitos.find((x) => x.id === id)
    if (!h) return
    const antes = progresoDia(fecha).pct
    const r = regEditable(fecha)
    const actual = r.valores[id] || 0
    if (h.tipo === 'cantidad') {
        r.valores[id] = Math.max(0, Math.min(objetivo(h) * 3, actual + delta * paso(h)))
    } else {
        r.valores[id] = actual >= 1 ? 0 : 1
    }
    despuesDeMarcar(id, antes)
}

function alternarHabito(id) {
    const h = estado.habitos.find((x) => x.id === id)
    if (!h) return
    const antes = progresoDia(fecha).pct
    const r = regEditable(fecha)
    const actual = r.valores[id] || 0
    r.valores[id] = cumplido(h, actual) ? 0 : objetivo(h)
    despuesDeMarcar(id, antes)
}

function exportar() {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tati-plan-' + hoyISO() + '.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function importar(archivo) {
    const lector = new FileReader()
    lector.onload = () => {
        try {
            const datos = JSON.parse(String(lector.result))
            if (!Array.isArray(datos.habitos)) throw new Error('formato')
            estado = {
                version: 1,
                habitos: datos.habitos,
                metas: Array.isArray(datos.metas) ? datos.metas : [],
                registro: datos.registro && typeof datos.registro === 'object' ? datos.registro : {},
            }
            guardar()
            render()
            alert('Datos importados.')
        } catch (e) {
            alert('Ese archivo no tiene el formato esperado.')
        }
    }
    lector.readAsText(archivo)
}

/* ---------------- eventos ---------------- */

document.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.tab')
    if (tab) {
        vista = tab.dataset.view
        render()
        return
    }

    const dia = ev.target.closest('.wday')
    if (dia && !dia.disabled) {
        fecha = dia.dataset.dia
        renderHoy()
        renderFotosDia(true)
        return
    }

    const el = ev.target.closest('[data-accion]')
    if (!el) return
    const accion = el.dataset.accion
    const id = el.dataset.id

    if (accion === 'alternar') alternarHabito(id)
    else if (accion === 'mas') cambiarValor(id, 1)
    else if (accion === 'menos') cambiarValor(id, -1)
    else if (accion === 'animo') {
        const v = Number(el.dataset.valor)
        const r = regEditable(fecha)
        r.animo = r.animo === v ? 0 : v
        guardar()
        renderHoy()
    } else if (accion === 'nuevo-habito') {
        editarHabito(null, el.dataset.pilar)
    } else if (accion === 'editar-habito') {
        editarHabito(estado.habitos.find((x) => x.id === id))
    } else if (accion === 'activar') {
        const h = estado.habitos.find((x) => x.id === id)
        h.activo = h.activo === false
        guardar()
        renderPlanes()
    } else if (accion === 'borrar-habito') {
        if (!confirm('¿Borrar este hábito? Su historial se conserva.')) return
        estado.habitos = estado.habitos.filter((x) => x.id !== id)
        guardar()
        cerrarModal()
        render()
    } else if (accion === 'paso') {
        const m = estado.metas.find((x) => x.id === el.dataset.meta)
        const s = m && m.pasos.find((x) => x.id === id)
        if (s) {
            s.hecho = !s.hecho
            guardar()
            renderMetas()
        }
    } else if (accion === 'borrar-paso') {
        const m = estado.metas.find((x) => x.id === el.dataset.meta)
        m.pasos = m.pasos.filter((x) => x.id !== id)
        guardar()
        renderMetas()
    } else if (accion === 'nuevo-paso') {
        const m = estado.metas.find((x) => x.id === id)
        const texto = prompt('Nuevo paso para "' + m.nombre + '":')
        if (texto && texto.trim()) {
            m.pasos.push({ id: uid(), texto: texto.trim(), hecho: false })
            guardar()
            renderMetas()
        }
    } else if (accion === 'agregar-foto') {
        elegirFoto()
    } else if (accion === 'ver-foto') {
        abrirVisor(id)
    } else if (accion === 'quitar-fav') {
        estado.frasesFav.splice(Number(el.dataset.i), 1)
        guardar()
        modalFrases()
    } else if (accion === 'quitar-mia') {
        estado.frasesPropias.splice(Number(el.dataset.i), 1)
        guardar()
        modalFrases()
    } else if (accion === 'borrar-meta') {
        if (!confirm('¿Borrar esta meta y sus pasos?')) return
        estado.metas = estado.metas.filter((x) => x.id !== id)
        guardar()
        renderMetas()
    }
})

document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('#visor').classList.contains('hidden')) cerrarVisor()
    if (ev.key === 'Escape' && !$('#modal').classList.contains('hidden')) cerrarModal()
    if (ev.key !== 'Enter' && ev.key !== ' ') return
    if (!(ev.target instanceof Element)) return
    const el = ev.target.closest('[data-accion][role="button"]')
    if (!el) return
    ev.preventDefault()
    el.click()
})

$('#btn-hoy').addEventListener('click', () => {
    fecha = hoyISO()
    lunes = lunesDe(fecha)
    renderHoy()
})
$('#week-prev').addEventListener('click', () => {
    lunes = sumarDias(lunes, -7)
    renderSemana()
})
$('#week-next').addEventListener('click', () => {
    if (sumarDias(lunes, 7) > hoyISO()) return
    lunes = sumarDias(lunes, 7)
    renderSemana()
})
$('#btn-finish').addEventListener('click', () => {
    const r = regEditable(fecha)
    r.cerrado = !r.cerrado
    guardar()
    renderHoy()
})

let temporizadorNota = null
$('#nota').addEventListener('input', (ev) => {
    clearTimeout(temporizadorNota)
    const texto = ev.target.value
    temporizadorNota = setTimeout(() => {
        regEditable(fecha).nota = texto
        guardar()
    }, 400)
})

$('#frase-otra').addEventListener('click', () => {
    const pool = poolFrases()
    if (pool.length < 2) return
    estado.fraseDelDia[fecha] = (indiceFrase(fecha) + 1) % pool.length
    guardar()
    renderFrase()
})
$('#frase-fav').addEventListener('click', () => {
    const texto = $('#frase-texto').textContent
    if (!texto) return
    const i = estado.frasesFav.indexOf(texto)
    if (i >= 0) estado.frasesFav.splice(i, 1)
    else estado.frasesFav.push(texto)
    guardar()
    renderFrase()
})
$('#frase-guardadas').addEventListener('click', modalFrases)

$('#file-foto').addEventListener('change', (ev) => {
    const archivo = ev.target.files[0]
    ev.target.value = ''
    if (!archivo) return
    comprimirImagen(archivo)
        .then(modalNuevaFoto)
        .catch((e) => alert(e.message || 'No se pudo procesar la imagen.'))
})
$('#visor-close').addEventListener('click', cerrarVisor)
$('#visor-descargar').addEventListener('click', () => {
    if (!fotoVisible) return
    const a = document.createElement('a')
    a.href = urlsVivas.visor
    a.download = 'tati-' + fotoVisible.dia + '.jpg'
    document.body.appendChild(a)
    a.click()
    a.remove()
})
$('#visor-borrar').addEventListener('click', () => {
    if (!fotoVisible) return
    if (!confirm('¿Borrar esta foto? No se puede deshacer.')) return
    const id = fotoVisible.id
    borrarFoto(id)
        .then(() => {
            delete cacheFotos[id]
            cerrarVisor()
            if (vista === 'galeria') renderGaleria()
            else renderFotosDia(true)
        })
        .catch(() => alert('No se pudo borrar la foto.'))
})

$('#btn-add-goal').addEventListener('click', nuevaMeta)
$('#modal-close').addEventListener('click', cerrarModal)
$('#modal').addEventListener('click', (ev) => {
    if (ev.target.id === 'modal') cerrarModal()
})
$('#modal-form').addEventListener('submit', (ev) => {
    ev.preventDefault()
    if (alGuardarModal && alGuardarModal(ev.target.elements) !== false) {
        cerrarModal()
        render()
    }
})
$('#modal-form').addEventListener('click', (ev) => {
    const dia = ev.target.closest('[data-dia]')
    if (dia) dia.classList.toggle('on')
    const sticker = ev.target.closest('[data-sticker]')
    if (sticker) {
        const yaEstaba = sticker.classList.contains('on')
        $('#f-stickers').querySelectorAll('button').forEach((b) => b.classList.remove('on'))
        if (!yaEstaba) sticker.classList.add('on') // tocarlo otra vez lo quita
    }
})
$('#modal-form').addEventListener('change', (ev) => {
    if (ev.target.name === 'tipo') {
        $('#f-cantidad').style.display = ev.target.value === 'cantidad' ? '' : 'none'
    }
})

$('#periodos').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-periodo]')
    if (!b) return
    periodo = Number(b.dataset.periodo)
    $('#periodos').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b))
    renderHeart()
})

$('#btn-table').addEventListener('click', () => {
    verTabla = !verTabla
    $('#chart-table').classList.toggle('hidden', !verTabla)
    $('#btn-table').textContent = verTabla ? 'Ocultar tabla' : 'Ver tabla'
    $('#btn-table').setAttribute('aria-pressed', String(verTabla))
})
$('#btn-export').addEventListener('click', exportar)
$('#btn-import').addEventListener('click', () => $('#file-import').click())
$('#file-import').addEventListener('change', (ev) => {
    if (ev.target.files[0]) importar(ev.target.files[0])
    ev.target.value = ''
})
$('#btn-reset').addEventListener('click', () => {
    if (!confirm('Esto borra hábitos, metas e historial y vuelve al plan inicial. Las fotos de la galería no se tocan. ¿Continuar?')) return
    estado = semilla()
    guardar()
    render()
})

render()

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW no registrado', e))
    })
}
