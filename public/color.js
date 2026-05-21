/*
 * color.js - Ciencia del color para VisionColor.
 * Expone window.CV con: matrices de correccion (daltonizacion),
 * laminas de prueba tipo Ishihara y nombres de color.
 */
window.CV = (function () {
    'use strict'

    // ---- Algebra de matrices 3x3 (arreglos de 9, fila por fila) ----
    var I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

    function matMul(a, b) {
        var r = new Array(9)
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                r[i * 3 + j] =
                    a[i * 3] * b[j] +
                    a[i * 3 + 1] * b[3 + j] +
                    a[i * 3 + 2] * b[6 + j]
            }
        }
        return r
    }
    function matAdd(a, b) {
        var r = new Array(9)
        for (var i = 0; i < 9; i++) r[i] = a[i] + b[i]
        return r
    }
    function matScale(a, s) {
        var r = new Array(9)
        for (var i = 0; i < 9; i++) r[i] = a[i] * s
        return r
    }
    // mezcla lineal entre dos matrices (t = 0 -> a, t = 1 -> b)
    function lerpMat(a, b, t) {
        var r = new Array(9)
        for (var i = 0; i < 9; i++) r[i] = a[i] * (1 - t) + b[i] * t
        return r
    }

    // ---- RGB <-> LMS (espacio de los conos), constantes de Vienot ----
    var RGB2LMS = [
        17.8824, 43.5161, 4.11935,
        3.45565, 27.1554, 3.86714,
        0.0299566, 0.184309, 1.46709,
    ]
    var LMS2RGB = [
        0.0809444479, -0.130504409, 0.116721066,
        -0.0102485335, 0.0540193266, -0.113614708,
        -0.000365296938, -0.00412161469, 0.693511405,
    ]

    // Simulacion de dicromacia (proyeccion al plano del dicromata) en LMS.
    var SIM_LMS = {
        protan: [0, 2.02344, -2.52581, 0, 1, 0, 0, 0, 1],
        deutan: [1, 0, 0, 0.494207, 0, 1.24827, 0, 0, 1],
        tritan: [1, 0, 0, 0, 1, 0, -0.395913, 0.801109, 0],
    }

    // Redistribucion del error: a que canales visibles se traslada
    // la informacion que el ojo no distingue.
    var ERR = {
        protan: [0, 0, 0, 0.7, 1, 0, 0.7, 0, 1],
        deutan: [0, 0, 0, 0.7, 1, 0, 0.7, 0, 1],
        tritan: [1, 0, 0.7, 0, 1, 0.7, 0, 0, 0],
    }

    /*
     * Matriz de correccion (daltonizacion) para un tipo y una intensidad.
     * Como simular + redistribuir el error son operaciones lineales, todo
     * el proceso se condensa en una sola matriz 3x3 que se aplica por pixel.
     *   corregido = [I + ERR * (I - Sim)] * rgb
     */
    function correctionMatrix(type, severity) {
        if (!SIM_LMS[type] || severity <= 0) return I3.slice()
        // simulacion de dicromata completa, llevada a espacio RGB
        var simFull = matMul(LMS2RGB, matMul(SIM_LMS[type], RGB2LMS))
        // tricromacia anomala (parcial): mezcla entre vista normal y dicromata
        var sim = lerpMat(I3, simFull, severity)
        var errorOp = matAdd(I3, matScale(sim, -1)) // (I - Sim)
        return matAdd(I3, matMul(ERR[type], errorOp))
    }

    function clamp255(v) {
        return v < 0 ? 0 : v > 255 ? 255 : v
    }

    // Aplica una matriz 3x3 a un ImageData (in situ).
    function transformImageData(img, m) {
        var d = img.data
        var m0 = m[0], m1 = m[1], m2 = m[2]
        var m3 = m[3], m4 = m[4], m5 = m[5]
        var m6 = m[6], m7 = m[7], m8 = m[8]
        for (var i = 0; i < d.length; i += 4) {
            var r = d[i], g = d[i + 1], b = d[i + 2]
            var nr = m0 * r + m1 * g + m2 * b
            var ng = m3 * r + m4 * g + m5 * b
            var nb = m6 * r + m7 * g + m8 * b
            d[i] = nr < 0 ? 0 : nr > 255 ? 255 : nr
            d[i + 1] = ng < 0 ? 0 : ng > 255 ? 255 : ng
            d[i + 2] = nb < 0 ? 0 : nb > 255 ? 255 : nb
        }
        return img
    }

    function isIdentity(m) {
        for (var i = 0; i < 9; i++) {
            if (Math.abs(m[i] - I3[i]) > 1e-6) return false
        }
        return true
    }

    // ---- Laminas de prueba (estilo Ishihara) ----
    // Paletas: figura visible para vision normal, confusa para cada tipo.
    var figRG = [[228, 150, 55], [214, 122, 50], [232, 168, 72], [205, 128, 44]]
    var bgRG = [[122, 152, 72], [148, 166, 86], [104, 142, 64], [136, 160, 92]]
    var figBY = [[96, 122, 206], [112, 138, 216], [82, 106, 192]]
    var bgBY = [[82, 166, 124], [102, 176, 138], [72, 152, 112]]
    var figCtl = [[64, 64, 70]]
    var bgCtl = [[208, 208, 214]]

    // category: 'rg' rojo-verde, 'by' azul-amarillo, 'control' (visible para todos)
    var PLATES = [
        { digit: '8', category: 'control', fig: figCtl, bg: bgCtl },
        { digit: '6', category: 'rg', fig: figRG, bg: bgRG },
        { digit: '2', category: 'rg', fig: figRG, bg: bgRG },
        { digit: '5', category: 'by', fig: figBY, bg: bgBY },
        { digit: '9', category: 'rg', fig: figRG, bg: bgRG },
        { digit: '4', category: 'by', fig: figBY, bg: bgBY },
    ]

    // Pares de colores confundibles para la vista previa del ajuste.
    var SWATCHES = {
        rg: [
            [[200, 45, 45], [55, 142, 52]],
            [[230, 142, 34], [156, 170, 48]],
            [[122, 82, 44], [96, 104, 46]],
            [[220, 132, 150], [150, 150, 152]],
        ],
        by: [
            [[46, 86, 202], [44, 152, 122]],
            [[228, 208, 52], [228, 152, 172]],
            [[124, 64, 182], [62, 94, 200]],
        ],
    }

    function pick(palette) {
        return palette[(Math.random() * palette.length) | 0]
    }

    /*
     * Dibuja una lamina de puntos con un digito oculto en el canvas dado.
     * Devuelve el ImageData resultante (util para aplicar correccion luego).
     */
    function drawPlate(canvas, plate) {
        var ctx = canvas.getContext('2d')
        var W = canvas.width
        var H = canvas.height
        var cx = W / 2
        var cy = H / 2
        var R = Math.min(W, H) / 2 - 3

        ctx.clearRect(0, 0, W, H)

        // mascara del digito en un canvas auxiliar
        var mask = document.createElement('canvas')
        mask.width = W
        mask.height = H
        var mctx = mask.getContext('2d')
        mctx.fillStyle = '#000'
        mctx.fillRect(0, 0, W, H)
        mctx.fillStyle = '#fff'
        mctx.textAlign = 'center'
        mctx.textBaseline = 'middle'
        mctx.font = 'bold ' + Math.floor(H * 0.66) + 'px Arial, sans-serif'
        mctx.fillText(plate.digit, cx, cy + H * 0.02)
        var maskData = mctx.getImageData(0, 0, W, H).data

        function inDigit(x, y) {
            var xi = x | 0
            var yi = y | 0
            if (xi < 0 || yi < 0 || xi >= W || yi >= H) return false
            return maskData[(yi * W + xi) * 4] > 128
        }

        // Empaquetado de puntos sin solaparse, dentro del circulo.
        // Una grilla espacial mantiene la deteccion de colisiones en O(1),
        // lo que permite muchos intentos y puntos finos para un digito nitido.
        var dots = []
        var minR = Math.max(1.8, W * 0.007)
        var maxR = Math.max(3.6, W * 0.0185)
        var cellSize = maxR * 2 + 2
        var cols = Math.ceil(W / cellSize) + 1
        var rows = Math.ceil(H / cellSize) + 1
        var grid = new Array(cols * rows)
        for (var gi = 0; gi < grid.length; gi++) grid[gi] = []

        var attempts = Math.floor(((W * H) / (minR * minR)) * 1.8)
        for (var a = 0; a < attempts; a++) {
            var ang = Math.random() * Math.PI * 2
            var rad = Math.sqrt(Math.random()) * (R - maxR)
            var x = cx + Math.cos(ang) * rad
            var y = cy + Math.sin(ang) * rad
            var r = minR + Math.random() * (maxR - minR)
            var gx = Math.min(cols - 1, Math.max(0, (x / cellSize) | 0))
            var gy = Math.min(rows - 1, Math.max(0, (y / cellSize) | 0))
            var ok = true
            for (var ny = -1; ny <= 1 && ok; ny++) {
                for (var nx = -1; nx <= 1 && ok; nx++) {
                    var cxn = gx + nx
                    var cyn = gy + ny
                    if (cxn < 0 || cyn < 0 || cxn >= cols || cyn >= rows) continue
                    var cell = grid[cyn * cols + cxn]
                    for (var k = 0; k < cell.length; k++) {
                        var dx = cell[k].x - x
                        var dy = cell[k].y - y
                        var md = cell[k].r + r + 1
                        if (dx * dx + dy * dy < md * md) {
                            ok = false
                            break
                        }
                    }
                }
            }
            if (ok) {
                var dot = { x: x, y: y, r: r }
                dots.push(dot)
                grid[gy * cols + gx].push(dot)
            }
        }

        for (var i = 0; i < dots.length; i++) {
            var d = dots[i]
            var col = pick(inDigit(d.x, d.y) ? plate.fig : plate.bg)
            // variacion de brillo: impide "hacer trampa" usando luminosidad
            var j = (Math.random() - 0.5) * 36
            var cr = clamp255(col[0] + j) | 0
            var cg = clamp255(col[1] + j) | 0
            var cb = clamp255(col[2] + j) | 0
            ctx.beginPath()
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
            ctx.fillStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')'
            ctx.fill()
        }

        return ctx.getImageData(0, 0, W, H)
    }

    // ---- Nombre aproximado de un color en espanol ----
    function colorName(r, g, b) {
        var max = Math.max(r, g, b)
        var min = Math.min(r, g, b)
        var l = (max + min) / 2 / 255
        var dd = max - min
        var s = dd === 0 ? 0 : dd / (255 - Math.abs(max + min - 255))

        if (s < 0.16) {
            if (l < 0.16) return 'negro'
            if (l > 0.85) return 'blanco'
            return 'gris'
        }

        var rr = r / 255, gg = g / 255, bb = b / 255
        var mx = max / 255
        var delta = dd / 255
        var h
        if (max === r) h = ((gg - bb) / delta) % 6
        else if (max === g) h = (bb - rr) / delta + 2
        else h = (rr - gg) / delta + 4
        h *= 60
        if (h < 0) h += 360

        var name
        if (h < 15 || h >= 345) name = 'rojo'
        else if (h < 40) name = 'naranja'
        else if (h < 70) name = 'amarillo'
        else if (h < 165) name = 'verde'
        else if (h < 200) name = 'cian'
        else if (h < 255) name = 'azul'
        else if (h < 290) name = 'morado'
        else name = 'rosado'

        if ((name === 'naranja' || name === 'rojo') && l < 0.36) name = 'cafe'
        if (name === 'verde' && l < 0.28) name = 'verde oscuro'
        if (l > 0.78 && s < 0.45) name = name + ' claro'
        return name
    }

    return {
        correctionMatrix: correctionMatrix,
        transformImageData: transformImageData,
        isIdentity: isIdentity,
        drawPlate: drawPlate,
        colorName: colorName,
        PLATES: PLATES,
        SWATCHES: SWATCHES,
    }
})()
