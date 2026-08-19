// Datos iniciales del plan de mejora. Se copian al almacenamiento local
// la primera vez y desde ahi se pueden editar sin tocar este archivo.

// Dias de la semana: 0 = domingo ... 6 = sabado.
const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6]
const ENTRE_SEMANA = [1, 2, 3, 4, 5]

const PILARES = [
    {
        id: 'cuerpo',
        nombre: 'BODY',
        lema: 'Alimentación y ejercicio',
        color: '#199e70',
        tinte: '#e6f5ef',
        icono: '\u{1F331}',
    },
    {
        id: 'creatividad',
        nombre: 'SOUL',
        lema: 'Creatividad y proyectos del alma',
        color: '#eb6834',
        tinte: '#fdeee7',
        icono: '\u{1F3A8}',
    },
    {
        id: 'carrera',
        nombre: 'TALENT',
        lema: 'Trabajo, portafolio y contenido',
        color: '#2a78d6',
        tinte: '#e7f0fc',
        icono: '\u{1F4BC}',
    },
]

const HABITOS_INICIALES = [
    // ---- Cuerpo ----
    { pilar: 'cuerpo', nombre: 'Tomar agua', icono: '\u{1F4A7}', tipo: 'cantidad', meta: 8, unidad: 'vasos', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Desayuno con proteína', icono: '\u{1F373}', tipo: 'check', meta: 1, unidad: '', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Frutas y verduras', icono: '\u{1F957}', tipo: 'cantidad', meta: 3, unidad: 'porciones', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Entrenar', icono: '\u{1F3C3}', tipo: 'cantidad', meta: 30, unidad: 'min', dias: [1, 3, 5] },
    { pilar: 'cuerpo', nombre: 'Caminar', icono: '\u{1F45F}', tipo: 'cantidad', meta: 6000, unidad: 'pasos', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Dormir 7 horas', icono: '\u{1F634}', tipo: 'check', meta: 1, unidad: '', dias: TODOS_LOS_DIAS },
    { pilar: 'cuerpo', nombre: 'Dejar el mercado listo', icono: '\u{1F6D2}', tipo: 'check', meta: 1, unidad: '', dias: [0] },

    // ---- Creatividad ----
    { pilar: 'creatividad', nombre: 'Bordar', icono: '\u{1F9F5}', tipo: 'cantidad', meta: 20, unidad: 'min', dias: [2, 4, 6] },
    { pilar: 'creatividad', nombre: 'Pintar', icono: '\u{1F58C}', tipo: 'cantidad', meta: 30, unidad: 'min', dias: [6, 0] },
    { pilar: 'creatividad', nombre: 'Leer', icono: '\u{1F4DA}', tipo: 'cantidad', meta: 15, unidad: 'páginas', dias: TODOS_LOS_DIAS },
    { pilar: 'creatividad', nombre: 'Anotar ideas en el cuaderno', icono: '\u{270F}', tipo: 'check', meta: 1, unidad: '', dias: ENTRE_SEMANA },
    { pilar: 'creatividad', nombre: 'Una hora sin pantallas', icono: '\u{1F319}', tipo: 'check', meta: 1, unidad: '', dias: TODOS_LOS_DIAS },

    // ---- Carrera ----
    { pilar: 'carrera', nombre: 'Trabajar en la hoja de vida', icono: '\u{1F4C4}', tipo: 'cantidad', meta: 20, unidad: 'min', dias: [1, 3] },
    { pilar: 'carrera', nombre: 'Avanzar el portafolio', icono: '\u{1F4BB}', tipo: 'cantidad', meta: 30, unidad: 'min', dias: [2, 4] },
    { pilar: 'carrera', nombre: 'Crear contenido para redes', icono: '\u{1F4F1}', tipo: 'check', meta: 1, unidad: '', dias: [1, 4] },
    { pilar: 'carrera', nombre: 'Aprender algo nuevo', icono: '\u{1F393}', tipo: 'cantidad', meta: 20, unidad: 'min', dias: ENTRE_SEMANA },
    { pilar: 'carrera', nombre: 'Escribir a una persona de mi red', icono: '\u{1F91D}', tipo: 'check', meta: 1, unidad: '', dias: [3] },
    { pilar: 'carrera', nombre: 'Revisar vacantes y postular', icono: '\u{1F50E}', tipo: 'check', meta: 1, unidad: '', dias: [5] },
]

const METAS_INICIALES = [
    {
        pilar: 'carrera',
        nombre: 'Hoja de vida lista',
        pasos: [
            'Escribir el resumen profesional',
            'Actualizar la experiencia y los logros',
            'Elegir una plantilla limpia',
            'Revisar ortografía y redacción',
            'Exportar en PDF con buen nombre de archivo',
            'Hacer la versión en inglés',
        ],
    },
    {
        pilar: 'carrera',
        nombre: 'Portafolio en línea',
        pasos: [
            'Elegir la plataforma',
            'Seleccionar cinco proyectos',
            'Escribir cada caso: problema, proceso, resultado',
            'Tomar o diseñar las imágenes',
            'Publicar y revisar en el celular',
            'Enlazarlo en LinkedIn y en la hoja de vida',
        ],
    },
    {
        pilar: 'carrera',
        nombre: 'Contenido para redes',
        pasos: [
            'Definir tres temas propios',
            'Armar plantillas de diseño',
            'Hacer el calendario del mes',
            'Preparar los primeros cuatro posts',
            'Programar las publicaciones',
        ],
    },
    {
        pilar: 'creatividad',
        nombre: 'Terminar el bordado que tengo empezado',
        pasos: ['Comprar los hilos que faltan', 'Definir el diseño final', 'Bordar el fondo', 'Bordar el detalle', 'Enmarcarlo'],
    },
    {
        pilar: 'cuerpo',
        nombre: 'Rutina de ejercicio sostenible',
        pasos: ['Elegir el horario fijo', 'Armar la rutina de la semana', 'Completar cuatro semanas seguidas', 'Medir cómo me siento'],
    },
]

const ANIMOS = [
    { valor: 1, icono: '\u{1F62B}', texto: 'Agotada' },
    { valor: 2, icono: '\u{1F614}', texto: 'Baja' },
    { valor: 3, icono: '\u{1F642}', texto: 'Normal' },
    { valor: 4, icono: '\u{1F60A}', texto: 'Bien' },
    { valor: 5, icono: '\u{1F929}', texto: 'Encendida' },
]

// Frases para el módulo motivacional. Son frases propias, sin autor: la idea
// es que acompañen el día, no citar a nadie. Tati puede agregar las suyas.
const FRASES = [
    'Hoy no tiene que ser perfecto, solo tiene que empezar.',
    'Un hábito pequeño repetido vence a un plan enorme abandonado.',
    'Tu cuerpo escucha todo lo que le prometes: cúmplele algo hoy.',
    'Avanzar despacio sigue siendo avanzar.',
    'Lo que haces cuando nadie mira es lo que te construye.',
    'No estás empezando de cero, estás empezando con experiencia.',
    'Las manos ocupadas en crear calman la cabeza.',
    'Bordar, pintar o leer también es productividad: es cuidado.',
    'Tu hoja de vida cuenta una historia; hoy escribe un renglón más.',
    'El portafolio no se termina de un tirón, se termina de a ratos.',
    'Publicar imperfecto enseña más que planear perfecto.',
    'Comparar tu capítulo 3 con el capítulo 20 de alguien más no es justo contigo.',
    'Tomar agua, dormir y moverte no son lujos, son la base.',
    'Cuando no tengas ganas, baja la meta, no la abandones.',
    'Dos minutos cuentan. Empezar es la parte difícil.',
    'La disciplina es quererte a largo plazo.',
    'Descansar también es parte del plan.',
    'Nadie construye una rutina en un día, pero se pierde en uno.',
    'Hazlo por la mujer que vas a ser en seis meses.',
    'Terminar algo pequeño hoy te da impulso para mañana.',
    'Tu creatividad no necesita permiso ni público.',
    'Un día flojo no borra una semana buena.',
    'Escribe lo que aprendiste: la memoria olvida, el cuaderno no.',
    'Enviar el mensaje, mandar la postulación, tocar la puerta. Eso mueve.',
    'La constancia no es hacer mucho, es no desaparecer.',
    'Elige el hábito más fácil de la lista y empieza por ahí.',
    'Lo que mides, mejora. Lo que celebras, se repite.',
    'Estás a un hábito de volver al ritmo.',
    'Tu progreso no siempre se ve en el espejo; a veces se ve en el calendario.',
    'Hazte una promesa chiquita y cúmplela. Ese es todo el secreto.',
]
