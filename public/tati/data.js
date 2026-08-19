// Datos iniciales del plan de mejora. Se copian al almacenamiento local
// la primera vez y desde ahi se pueden editar sin tocar este archivo.

// Dias de la semana: 0 = domingo ... 6 = sabado.
const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6]
const ENTRE_SEMANA = [1, 2, 3, 4, 5]

const PILARES = [
    {
        id: 'cuerpo',
        nombre: 'Cuerpo',
        lema: 'Alimentacion y ejercicio',
        color: '#199e70',
        icono: '\u{1F331}',
    },
    {
        id: 'creatividad',
        nombre: 'Creatividad',
        lema: 'Bordar, pintar, leer',
        color: '#d95926',
        icono: '\u{1F3A8}',
    },
    {
        id: 'carrera',
        nombre: 'Carrera',
        lema: 'Hoja de vida, portafolio y contenido',
        color: '#3987e5',
        icono: '\u{1F4BC}',
    },
]

const HABITOS_INICIALES = [
    // ---- Cuerpo ----
    { pilar: 'cuerpo', nombre: 'Tomar agua', tipo: 'cantidad', meta: 8, unidad: 'vasos', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Desayuno con proteina', tipo: 'check', meta: 1, unidad: '', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Frutas y verduras', tipo: 'cantidad', meta: 3, unidad: 'porciones', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Entrenar', tipo: 'cantidad', meta: 30, unidad: 'min', dias: [1, 3, 5] },
    { pilar: 'cuerpo', nombre: 'Caminar', tipo: 'cantidad', meta: 6000, unidad: 'pasos', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Dormir 7 horas', tipo: 'check', meta: 1, unidad: '', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Dejar el mercado listo', tipo: 'check', meta: 1, unidad: '', dias: [0] },

    // ---- Creatividad ----
    { pilar: 'creatividad', nombre: 'Bordar', tipo: 'cantidad', meta: 20, unidad: 'min', dias: [2, 4, 6] },
    { pilar: 'creatividad', nombre: 'Pintar', tipo: 'cantidad', meta: 30, unidad: 'min', dias: [6, 0] },
    { pilar: 'creatividad', nombre: 'Leer', tipo: 'cantidad', meta: 15, unidad: 'paginas', dias: TODOS_LOS_DIAS },
    { pilar: 'creatividad', nombre: 'Anotar ideas en el cuaderno', tipo: 'check', meta: 1, unidad: '', dias: ENTRE_SEMANA },
    { pilar: 'creatividad', nombre: 'Una hora sin pantallas', tipo: 'check', meta: 1, unidad: '', dias: TODOS_LOS_DIAS },

    // ---- Carrera ----
    { pilar: 'carrera', nombre: 'Trabajar en la hoja de vida', tipo: 'cantidad', meta: 20, unidad: 'min', dias: [1, 3] },
    { pilar: 'carrera', nombre: 'Avanzar el portafolio', tipo: 'cantidad', meta: 30, unidad: 'min', dias: [2, 4] },
    { pilar: 'carrera', nombre: 'Crear contenido para redes', tipo: 'check', meta: 1, unidad: '', dias: [1, 4] },
    { pilar: 'carrera', nombre: 'Aprender algo nuevo', tipo: 'cantidad', meta: 20, unidad: 'min', dias: ENTRE_SEMANA },
    { pilar: 'carrera', nombre: 'Escribir a una persona de mi red', tipo: 'check', meta: 1, unidad: '', dias: [3] },
    { pilar: 'carrera', nombre: 'Revisar vacantes y postular', tipo: 'check', meta: 1, unidad: '', dias: [5] },
]

const METAS_INICIALES = [
    {
        pilar: 'carrera',
        nombre: 'Hoja de vida lista',
        pasos: [
            'Escribir el resumen profesional',
            'Actualizar la experiencia y los logros',
            'Elegir una plantilla limpia',
            'Revisar ortografia y redaccion',
            'Exportar en PDF con buen nombre de archivo',
            'Hacer la version en ingles',
        ],
    },
    {
        pilar: 'carrera',
        nombre: 'Portafolio en linea',
        pasos: [
            'Elegir la plataforma',
            'Seleccionar cinco proyectos',
            'Escribir cada caso: problema, proceso, resultado',
            'Tomar o disenar las imagenes',
            'Publicar y revisar en el celular',
            'Enlazarlo en LinkedIn y en la hoja de vida',
        ],
    },
    {
        pilar: 'carrera',
        nombre: 'Contenido para redes',
        pasos: [
            'Definir tres temas propios',
            'Armar plantillas de diseno',
            'Hacer el calendario del mes',
            'Preparar los primeros cuatro posts',
            'Programar las publicaciones',
        ],
    },
    {
        pilar: 'creatividad',
        nombre: 'Terminar el bordado que tengo empezado',
        pasos: ['Comprar los hilos que faltan', 'Definir el diseno final', 'Bordar el fondo', 'Bordar el detalle', 'Enmarcarlo'],
    },
    {
        pilar: 'cuerpo',
        nombre: 'Rutina de ejercicio sostenible',
        pasos: ['Elegir el horario fijo', 'Armar la rutina de la semana', 'Completar cuatro semanas seguidas', 'Medir como me siento'],
    },
]

const ANIMOS = [
    { valor: 1, icono: '\u{1F62B}', texto: 'Agotada' },
    { valor: 2, icono: '\u{1F614}', texto: 'Baja' },
    { valor: 3, icono: '\u{1F642}', texto: 'Normal' },
    { valor: 4, icono: '\u{1F60A}', texto: 'Bien' },
    { valor: 5, icono: '\u{1F929}', texto: 'Encendida' },
]
