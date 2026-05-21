// Generates the PWA PNG icons without any external dependency.
// Draws an additive RGB-circle motif (color-vision theme) and encodes PNG by hand.
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
        raw[y * (stride + 1)] = 0 // filter: none
        rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
    }
    const idat = zlib.deflateSync(raw, { level: 9 })
    return Buffer.concat([
        sig,
        chunk('IHDR', ihdr),
        chunk('IDAT', idat),
        chunk('IEND', Buffer.alloc(0)),
    ])
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)
function smoothstep(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
}

function drawIcon(size, maskable) {
    const rgba = Buffer.alloc(size * size * 4)
    const bg = [14, 17, 22]
    const cx = size / 2
    const cy = size / 2
    // smaller motif for maskable icons so it survives the OS safe-zone crop
    const cr = size * (maskable ? 0.165 : 0.205)
    const spread = size * (maskable ? 0.105 : 0.13)
    const circles = [
        { x: cx, y: cy - spread, col: [235, 66, 78] },
        { x: cx - spread * 0.87, y: cy + spread * 0.5, col: [70, 205, 110] },
        { x: cx + spread * 0.87, y: cy + spread * 0.5, col: [78, 138, 240] },
    ]
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let r = bg[0]
            let g = bg[1]
            let b = bg[2]
            for (const c of circles) {
                const dx = x - c.x
                const dy = y - c.y
                const d = Math.sqrt(dx * dx + dy * dy)
                const edge = size * 0.006 + 0.75
                const a = 1 - smoothstep(cr - edge, cr + edge, d)
                if (a > 0) {
                    r += c.col[0] * a * 0.9
                    g += c.col[1] * a * 0.9
                    b += c.col[2] * a * 0.9
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

const outDir = path.join(__dirname, '..', 'public', 'icons')
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
    console.log('wrote', t.name, t.size + 'x' + t.size, png.length + ' bytes')
}
