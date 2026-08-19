/* Archivo de fotos: las imágenes viven en IndexedDB (localStorage no da para
   binarios) y se comprimen antes de guardarlas para no llenar el teléfono. */

const FOTOS_DB = 'tati-fotos'
const FOTOS_STORE = 'fotos'
let promesaDB = null

function abrirDB() {
    if (promesaDB) return promesaDB
    promesaDB = new Promise((resolver, rechazar) => {
        if (!('indexedDB' in window)) return rechazar(new Error('Este navegador no permite guardar fotos.'))
        const pedido = indexedDB.open(FOTOS_DB, 1)
        pedido.onupgradeneeded = () => {
            const db = pedido.result
            if (!db.objectStoreNames.contains(FOTOS_STORE)) {
                const almacen = db.createObjectStore(FOTOS_STORE, { keyPath: 'id' })
                almacen.createIndex('dia', 'dia')
            }
        }
        pedido.onsuccess = () => resolver(pedido.result)
        pedido.onerror = () => rechazar(pedido.error)
    })
    return promesaDB
}

function transaccion(modo) {
    return abrirDB().then((db) => db.transaction(FOTOS_STORE, modo).objectStore(FOTOS_STORE))
}
function comoPromesa(pedido) {
    return new Promise((resolver, rechazar) => {
        pedido.onsuccess = () => resolver(pedido.result)
        pedido.onerror = () => rechazar(pedido.error)
    })
}

// Reduce la imagen a un lado máximo y la vuelve JPEG: una foto de celular
// pasa de varios MB a unos 200 KB.
function comprimirImagen(archivo, ladoMaximo) {
    const maximo = ladoMaximo || 1400
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader()
        lector.onerror = () => rechazar(new Error('No se pudo leer la imagen.'))
        lector.onload = () => {
            const img = new Image()
            img.onerror = () => rechazar(new Error('Ese archivo no es una imagen válida.'))
            img.onload = () => {
                const escala = Math.min(1, maximo / Math.max(img.width, img.height))
                const lienzo = document.createElement('canvas')
                lienzo.width = Math.round(img.width * escala)
                lienzo.height = Math.round(img.height * escala)
                lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
                lienzo.toBlob(
                    (blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo procesar la imagen.'))),
                    'image/jpeg',
                    0.82
                )
            }
            img.src = String(lector.result)
        }
        lector.readAsDataURL(archivo)
    })
}

function guardarFoto(foto) {
    return transaccion('readwrite').then((almacen) => comoPromesa(almacen.put(foto)))
}
function listarFotos() {
    return transaccion('readonly')
        .then((almacen) => comoPromesa(almacen.getAll()))
        .then((lista) => lista.sort((a, b) => (a.dia === b.dia ? b.creado - a.creado : b.dia.localeCompare(a.dia))))
}
function fotosDelDia(dia) {
    return transaccion('readonly').then((almacen) => comoPromesa(almacen.index('dia').getAll(dia)))
}
function borrarFoto(id) {
    return transaccion('readwrite').then((almacen) => comoPromesa(almacen.delete(id)))
}
