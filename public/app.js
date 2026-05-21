/*
 * app.js - Interfaz y flujo de VisionColor.
 * Pantallas: inicio -> prueba -> ajuste -> camara.
 */
(function () {
    'use strict'

    var PROFILE_KEY = 'cv-profile'

    // ---------- Estado ----------
    var profile = loadProfile()
    var currentScreen = 'screen-home'

    var testState = { i: 0, answers: [] }
    var adjust = { type: 'deutan', severity: 0.6 }
    var previewBase = { category: null, img: null }

    var camera = {
        stream: null,
        facing: 'environment',
        running: false,
        correcting: true,
        raf: 0,
        matrix: null,
        proc: document.createElement('canvas'),
    }

    // ---------- Utilidades ----------
    function $(id) {
        return document.getElementById(id)
    }
    function clamp255(v) {
        return v < 0 ? 0 : v > 255 ? 255 : v
    }
    function rgbStr(c) {
        return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'
    }
    function applyMatrix(m, r, g, b) {
        return [
            clamp255(m[0] * r + m[1] * g + m[2] * b),
            clamp255(m[3] * r + m[4] * g + m[5] * b),
            clamp255(m[6] * r + m[7] * g + m[8] * b),
        ]
    }
    function categoryOf(type) {
        return type === 'tritan' ? 'by' : 'rg'
    }
    function severityLabel(s) {
        return s < 0.5 ? 'leve' : s < 0.72 ? 'moderada' : 'fuerte'
    }

    function loadProfile() {
        try {
            var raw = localStorage.getItem(PROFILE_KEY)
            if (!raw) return null
            var p = JSON.parse(raw)
            if (typeof p.type === 'string' && typeof p.severity === 'number') return p
        } catch (e) {}
        return null
    }
    function saveProfile(p) {
        profile = p
        try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
        } catch (e) {}
    }

    // ---------- Navegacion ----------
    function showScreen(id) {
        if (currentScreen === 'screen-camera' && id !== 'screen-camera') {
            stopCamera()
        }
        var screens = document.querySelectorAll('.screen')
        for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active')
        $(id).classList.add('active')
        currentScreen = id
        if (id === 'screen-home') refreshHome()
    }

    function refreshHome() {
        var card = $('profile-card')
        if (profile && profile.type !== 'none') {
            card.classList.remove('hidden')
            $('profile-text').textContent =
                typeNamePlain(profile.type) +
                ' - intensidad ' +
                Math.round(profile.severity * 100) +
                '%'
        } else if (profile && profile.type === 'none') {
            card.classList.remove('hidden')
            $('profile-text').textContent = 'Sin correccion de color'
        } else {
            card.classList.add('hidden')
        }
    }

    function typeNamePlain(type) {
        if (type === 'tritan') return 'Azul-amarillo (tritan)'
        if (type === 'protan') return 'Rojo-verde (protan)'
        if (type === 'deutan') return 'Rojo-verde (deutan)'
        return 'Ninguno'
    }

    // ---------- Prueba de vision ----------
    function buildKeypad() {
        var kp = $('keypad')
        kp.innerHTML = ''
        for (var n = 0; n <= 9; n++) {
            var b = document.createElement('button')
            b.className = 'key'
            b.textContent = String(n)
            b.dataset.val = String(n)
            kp.appendChild(b)
        }
        kp.addEventListener('click', function (e) {
            var t = e.target
            if (t.classList.contains('key')) answerTest(t.dataset.val)
        })
    }

    function startTest() {
        testState = { i: 0, answers: [] }
        showScreen('screen-test')
        renderPlate()
    }

    function renderPlate() {
        var plate = CV.PLATES[testState.i]
        var canvas = $('plate')
        CV.drawPlate(canvas, plate)
        canvas.classList.remove('plate-anim')
        void canvas.offsetWidth
        canvas.classList.add('plate-anim')

        var total = CV.PLATES.length
        var step = testState.i + 1
        $('test-progress').textContent = step + ' / ' + total
        $('test-bar').style.width = (step / total) * 100 + '%'
    }

    function answerTest(value) {
        testState.answers.push(value)
        testState.i++
        if (testState.i >= CV.PLATES.length) {
            finishTest()
        } else {
            renderPlate()
        }
    }

    function finishTest() {
        var rgFail = 0
        var byFail = 0
        var rgTotal = 0
        var byTotal = 0
        var controlFail = 0
        for (var i = 0; i < CV.PLATES.length; i++) {
            var plate = CV.PLATES[i]
            var correct = testState.answers[i] === plate.digit
            if (plate.category === 'rg') rgTotal++
            else if (plate.category === 'by') byTotal++
            if (!correct) {
                if (plate.category === 'rg') rgFail++
                else if (plate.category === 'by') byFail++
                else if (plate.category === 'control') controlFail++
            }
        }

        var rgRatio = rgTotal ? rgFail / rgTotal : 0
        var byRatio = byTotal ? byFail / byTotal : 0

        var type = 'none'
        var severity = 0
        if (rgFail > 0 && rgRatio >= byRatio) {
            type = 'deutan'
            severity = 0.35 + 0.55 * rgRatio
        } else if (byFail > 0) {
            type = 'tritan'
            severity = 0.35 + 0.55 * byRatio
        }
        if (severity > 0.95) severity = 0.95

        var note =
            controlFail > 0
                ? ' Nota: no acertaste la lamina de control, que casi todos ' +
                  'distinguen; para un resultado mas fiable repite la prueba ' +
                  'con buena luz y mirando la pantalla de frente.'
                : ''

        var msg
        if (type === 'none') {
            msg =
                'No detectamos una dificultad clara para distinguir colores. ' +
                'Aun asi puedes activar y ajustar la correccion manualmente.'
        } else if (type === 'tritan') {
            msg =
                'Detectamos dificultad para distinguir tonos azul-amarillo ' +
                '(intensidad ' +
                severityLabel(severity) +
                '). Ajustala abajo: cuando quede bien veras el numero en la vista previa.'
        } else {
            msg =
                'Detectamos dificultad para distinguir tonos rojo-verde ' +
                '(intensidad ' +
                severityLabel(severity) +
                '). Ajustala abajo: cuando quede bien veras el numero en la vista previa.'
        }

        adjust.type = type
        adjust.severity = severity
        openAdjust(msg + note)
    }

    // ---------- Ajuste manual ----------
    function openAdjust(message) {
        $('adjust-result').textContent = message
        previewBase = { category: null, img: null }
        syncTypeButtons()
        $('severity').value = Math.round(adjust.severity * 100)
        renderAdjust()
        showScreen('screen-adjust')
    }

    function syncTypeButtons() {
        var btns = document.querySelectorAll('.type-btn')
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle(
                'selected',
                btns[i].dataset.type === adjust.type
            )
        }
    }

    function plateForCategory(cat) {
        for (var i = 0; i < CV.PLATES.length; i++) {
            if (CV.PLATES[i].category === cat) return CV.PLATES[i]
        }
        return CV.PLATES[1]
    }

    function renderAdjust() {
        var disabled = adjust.type === 'none'
        $('severity').disabled = disabled
        $('severity-value').textContent = disabled
            ? 'sin correccion'
            : Math.round(adjust.severity * 100) + '%'

        var cat = categoryOf(adjust.type)
        var canvas = $('preview-plate')
        if (previewBase.category !== cat || !previewBase.img) {
            previewBase = {
                category: cat,
                img: CV.drawPlate(canvas, plateForCategory(cat)),
            }
        }

        var m = CV.correctionMatrix(adjust.type, adjust.severity)
        var ctx = canvas.getContext('2d')
        var copy = ctx.createImageData(canvas.width, canvas.height)
        copy.data.set(previewBase.img.data)
        CV.transformImageData(copy, m)
        ctx.putImageData(copy, 0, 0)

        renderSwatches(m, cat)
    }

    function renderSwatches(m, cat) {
        var list = $('swatch-list')
        list.innerHTML = ''
        var pairs = CV.SWATCHES[cat]
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i]
            var row = document.createElement('div')
            row.className = 'swatch-pair'
            for (var j = 0; j < 2; j++) {
                var c = pair[j]
                var out = applyMatrix(m, c[0], c[1], c[2])
                var span = document.createElement('span')
                span.style.background = rgbStr(out)
                row.appendChild(span)
            }
            list.appendChild(row)
        }
    }

    function bindAdjust() {
        $('type-grid').addEventListener('click', function (e) {
            var btn = e.target.closest ? e.target.closest('.type-btn') : null
            if (!btn) return
            adjust.type = btn.dataset.type
            if (adjust.type === 'none') adjust.severity = 0
            else if (adjust.severity <= 0) adjust.severity = 0.6
            syncTypeButtons()
            $('severity').value = Math.round(adjust.severity * 100)
            renderAdjust()
        })

        $('severity').addEventListener('input', function () {
            adjust.severity = parseInt(this.value, 10) / 100
            renderAdjust()
        })

        $('btn-save').addEventListener('click', function () {
            saveProfile({ type: adjust.type, severity: adjust.severity })
            openCamera()
        })
    }

    // ---------- Camara ----------
    function openCamera() {
        showScreen('screen-camera')
        camera.correcting = true
        updateCameraUi()
        camera.matrix = profile
            ? CV.correctionMatrix(profile.type, profile.severity)
            : null
        startCamera()
        var hint = $('camera-hint')
        hint.style.opacity = '1'
        setTimeout(function () {
            hint.style.opacity = '0'
        }, 4200)
    }

    function showCameraError(text) {
        var el = $('camera-error')
        el.textContent = text
        el.classList.remove('hidden')
    }

    function startCamera() {
        $('camera-error').classList.add('hidden')

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showCameraError(
                'La camara requiere una conexion segura (HTTPS). ' +
                    'Abre la app desde su direccion https:// o desde localhost.'
            )
            return
        }

        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: { ideal: camera.facing },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            })
            .then(function (stream) {
                camera.stream = stream
                var video = $('video')
                video.srcObject = stream
                return video.play()
            })
            .then(function () {
                camera.running = true
                cancelAnimationFrame(camera.raf)
                cameraLoop()
            })
            .catch(function (err) {
                if (err && err.name === 'NotAllowedError') {
                    showCameraError(
                        'Permiso de camara denegado. Habilita la camara para esta ' +
                            'pagina en los ajustes del navegador e intenta de nuevo.'
                    )
                } else {
                    showCameraError(
                        'No se pudo abrir la camara. Verifica que ningun otro ' +
                            'programa la este usando.'
                    )
                }
            })
    }

    function stopCamera() {
        camera.running = false
        cancelAnimationFrame(camera.raf)
        if (camera.stream) {
            camera.stream.getTracks().forEach(function (t) {
                t.stop()
            })
            camera.stream = null
        }
        $('video').srcObject = null
    }

    function cameraLoop() {
        if (!camera.running) return
        var video = $('video')
        if (video.readyState >= 2 && video.videoWidth) {
            var vw = video.videoWidth
            var vh = video.videoHeight
            var pw = Math.min(480, vw)
            var ph = Math.round((pw * vh) / vw)
            var view = $('view')
            var proc = camera.proc
            if (proc.width !== pw) {
                proc.width = pw
                proc.height = ph
                view.width = pw
                view.height = ph
            }
            var pctx = proc.getContext('2d')
            var vctx = view.getContext('2d')
            pctx.drawImage(video, 0, 0, pw, ph)

            if (camera.correcting && camera.matrix && !CV.isIdentity(camera.matrix)) {
                var img = pctx.getImageData(0, 0, pw, ph)
                CV.transformImageData(img, camera.matrix)
                vctx.putImageData(img, 0, 0)
            } else {
                vctx.drawImage(proc, 0, 0)
            }
        }
        camera.raf = requestAnimationFrame(cameraLoop)
    }

    function updateCameraUi() {
        var corrected = camera.correcting
        $('camera-mode').textContent = corrected ? 'Corregido' : 'Original'
        var btn = $('btn-compare')
        btn.textContent = corrected ? 'Ver original' : 'Ver corregido'
        btn.classList.toggle('active', !corrected)
    }

    function flipCamera() {
        camera.facing = camera.facing === 'environment' ? 'user' : 'environment'
        stopCamera()
        startCamera()
    }

    // Toca la pantalla -> nombre del color real en ese punto.
    function pickColorAt(clientX, clientY) {
        var view = $('view')
        var proc = camera.proc
        if (!proc.width) return
        var rect = view.getBoundingClientRect()
        // el canvas usa object-fit: cover -> recalcular escala y recorte
        var scale = Math.max(rect.width / proc.width, rect.height / proc.height)
        var dispW = proc.width * scale
        var dispH = proc.height * scale
        var sx = (clientX - rect.left - (rect.width - dispW) / 2) / scale
        var sy = (clientY - rect.top - (rect.height - dispH) / 2) / scale
        sx = Math.round(sx)
        sy = Math.round(sy)
        if (sx < 0 || sy < 0 || sx >= proc.width || sy >= proc.height) return

        // promedio de un area pequena para mayor estabilidad
        var x0 = Math.max(0, sx - 2)
        var y0 = Math.max(0, sy - 2)
        var w = Math.min(5, proc.width - x0)
        var h = Math.min(5, proc.height - y0)
        var data = proc.getContext('2d').getImageData(x0, y0, w, h).data
        var r = 0, g = 0, b = 0
        var count = data.length / 4
        for (var i = 0; i < data.length; i += 4) {
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
        }
        r = r / count
        g = g / count
        b = b / count

        var name = CV.colorName(r, g, b)
        $('pick-swatch').style.background = rgbStr([r, g, b])
        $('pick-name').textContent = name
        var label = $('pick-label')
        label.classList.remove('hidden')
        clearTimeout(pickColorAt._t)
        pickColorAt._t = setTimeout(function () {
            label.classList.add('hidden')
        }, 2600)
    }

    function bindCamera() {
        $('btn-compare').addEventListener('click', function () {
            camera.correcting = !camera.correcting
            updateCameraUi()
        })
        $('btn-flip').addEventListener('click', flipCamera)
        $('btn-recalibrate').addEventListener('click', startTest)
        $('view').addEventListener('click', function (e) {
            pickColorAt(e.clientX, e.clientY)
        })
    }

    // ---------- Arranque ----------
    function bindGlobal() {
        var goers = document.querySelectorAll('[data-go]')
        for (var i = 0; i < goers.length; i++) {
            goers[i].addEventListener('click', function () {
                showScreen('screen-' + this.dataset.go)
            })
        }
        $('btn-calibrate').addEventListener('click', startTest)
        $('btn-open-camera').addEventListener('click', openCamera)
        $('btn-no-number').addEventListener('click', function () {
            answerTest('none')
        })
    }

    function init() {
        buildKeypad()
        bindGlobal()
        bindAdjust()
        bindCamera()
        refreshHome()

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('sw.js').catch(function () {})
            })
        }
    }

    init()
})()
