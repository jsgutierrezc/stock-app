// Genera los iconos PNG de Tati sin dependencias externas.
// Dibuja el anillo de tres areas (cuerpo, creatividad, carrera) del dashboard.
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
    let table = crc32.table
    if (!table) {
        table = crc32.table = []
        for (let n = 0; n < 256; n++) {
            let c = n
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
            table[n] = c >>> 0
        }
    }
    let crc = 0xffffffff
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
    return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
    return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(width, height, rgba) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0)
    ihdr.writeUInt32BE(height, 4)
    ihdr[8] = 8 // bit depth
    ihdr[9] = 6 // color type: RGBA
    const stride = width * 4
    const raw = Buffer.alloc(height * (stride + 1))
    for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = 0 // filtro: ninguno
        rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
    }
    const idat = zlib.deflateSync(raw, { level: 9 })
    return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)
function smoothstep(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
}
const mezclar = (base, capa, a) => base + (capa - base) * a

// Mismos colores que las tres areas del dashboard.
const AREAS = [
    { desde: -90, hasta: 30, col: [25, 158, 112] }, // cuerpo
    { desde: 30, hasta: 150, col: [217, 89, 38] }, // creatividad
    { desde: 150, hasta: 270, col: [57, 135, 229] }, // carrera
]
const SEPARACION = 7 // grados de aire entre arcos

function drawIcon(size, maskable) {
    const rgba = Buffer.alloc(size * size * 4)
    const fondo = [14, 17, 22]
    const cx = size / 2
    const cy = size / 2
    const radio = size * (maskable ? 0.245 : 0.31)
    const grosor = size * (maskable ? 0.075 : 0.095)
    const borde = size * 0.006 + 0.75

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let r = fondo[0]
            let g = fondo[1]
            let b = fondo[2]
            const dx = x + 0.5 - cx
            const dy = y + 0.5 - cy
            const d = Math.sqrt(dx * dx + dy * dy)
            const dentro =
                smoothstep(radio - grosor / 2 - borde, radio - grosor / 2 + borde, d) *
                (1 - smoothstep(radio + grosor / 2 - borde, radio + grosor / 2 + borde, d))
            if (dentro > 0) {
                let ang = (Math.atan2(dy, dx) * 180) / Math.PI // -180..180
                for (const a of AREAS) {
                    let rel = ang - (a.desde + SEPARACION / 2)
                    while (rel < 0) rel += 360
                    const largo = a.hasta - a.desde - SEPARACION
                    if (rel > largo) continue
                    // suaviza las puntas del arco
                    const punta = Math.min(smoothstep(0, 2.5, rel), 1 - smoothstep(largo - 2.5, largo, rel))
                    const alfa = dentro * punta
                    if (alfa <= 0) continue
                    r = mezclar(r, a.col[0], alfa)
                    g = mezclar(g, a.col[1], alfa)
                    b = mezclar(b, a.col[2], alfa)
                }
            }
            const i = (y * size + x) * 4
            rgba[i] = clamp(r)
            rgba[i + 1] = clamp(g)
            rgba[i + 2] = clamp(b)
            rgba[i + 3] = 255
        }
    }
    return rgba
}

const outDir = path.join(__dirname, '..', 'public', 'tati', 'icons')
fs.mkdirSync(outDir, { recursive: true })

const targets = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon-180.png', size: 180, maskable: false },
]

for (const t of targets) {
    const png = encodePNG(t.size, t.size, drawIcon(t.size, t.maskable))
    fs.writeFileSync(path.join(outDir, t.name), png)
    console.log('escrito', t.name, t.size + 'x' + t.size, png.length + ' bytes')
}
