
import { InvitationUIBundle } from "@/types/new_invitation";


const uiES: InvitationUIBundle = {
  cover: {
    countdown: { days: "días", hours: "horas", minutes: "minutos", seconds: "segundos" },
    datePrefix: ""
  },
  labels: {
    food: "Comidas",
    lodging: "Hospedaje",
    activities: "Actividades",
    cards: "Tarjetas de regalo",
    seeGifts: "Ver regalos",
    DiscoverGifts: "Descubre nuestra mesa de regalos",
  },
  locked: {
    p1: "Nos alegra mucho que seas parte de este evento tan especial.",
    p2: "Esta invitación es exclusiva para ti. Ingresa tu código de invitado para continuar y disfrutar de esta experiencia única.",
    title: "Invitación Privada",
    access: "ACCEDER",
    placeholder: "Código de invitado"
  },
  buttons: {
    confirm: "CONFIRMAR",
    details: "Detalles",
    directions: "¿Cómo llegar?",
    inspiration: "¿Necesitas inspiración?"
  },
  confirm: {
    cta: "CONFIRMAR",
    hello: "¡Hola",
    passes1: "Tienes",
    passes2: "pases disponibles para ti y tus acompañantes",
    decline: "No podré asistir",
    howMany: "¿Cuántos pases vas a utilizar?",
    yourName: "Escribe tu nombre y quienes te acompañan",
    declinedMsg: "Lamentamos no poder contar con tu asistencia, esperamos pronto poder celebrar juntos",
    drawerTitle: "Confirmar asistencia",
    changeAnswer: "Cambiar respuesta",
    addToCalendar: "Agrega el evento a tu calendario",
    declinedTitle: "Confirmar asistencia",
    confirmedTitle: "Confirmar asistencia",
    changeAnswerBtn: "Cambiar respuesta",
    addToCalendarBtn: "Add to Calendar",
    confirmedMsgBold: "¡Tu asistencia ha sido confirmada! Esperamos verte y celebrar juntos muy pronto.",
    thanks: "Estamos felices de que nos puedas acompañar",
    closed_hi: "Hola",
    closed_happy: "Estamos muy contentos de que formes parte de este momento",
    closed_invitation: "Tu invitación contempla tu asistencia y la de",
    closed_companion: "acompañantes",
    closed_notgoing: "Por favor indica si alguno de ellos no podrá asistir",
    confirmed: "¡Ya ha confirmado!",
    not_going: "No asistirá",
    dont_forget:"No olvides agregar el nombre de algunos de tus acompañantes",
    add_companion: "Agregar acompañante",
    open_add_name:"Por favor agrega tu nombre y el de las personas que te acompañan.",
    open_hi:"Hola, estamos muy contentos de que formes parte de este momento.",
    digital_pass: "Pase digital",
    digital_name: "Nombre",
    digital_table: "Mesa"
  },
  controlBar: {
    editResponse: "Editar respuesta",
    updateStatus: "Actualizar estado",
    digitalPass: "Pase digital",
    photoWall: "Photo Wall",
    askLia: "¿Dudas?",
    whatsappConfirmMessage: "¡Hola! Confirmo mi asistencia."
  },
  liaGuest: {
    close: "Cerrar",
    introLine: "Soy Lia. Puedo ayudarte a resolver tus dudas.",
    connectionError: "Hubo un error al conectarme. Intenta de nuevo.",
    prompts: [
      "¿A qué hora y dónde empieza la ceremonia?",
      "¿Dónde es la recepción y cómo llego?",
      "¿Cuál es el itinerario del día?",
      "¿Cuál es el dresscode?",
      "¿Hay mesa de regalos?",
      "¿Hay avisos importantes que deba saber?",
      "¿Hay lugares recomendados para hospedarse?",
      "¿Cuándo es el evento?"
    ]
  },
  camera: {
    noName: "No podemos identificar tu nombre. Contacta al organizador del evento.",
    tooEarly: "La cámara estará disponible el día del evento",
    unavailable: "El Photo Wall ya no está disponible",
    discard: "Descartar",
    sendToWall: "Enviar al Wall",
    shotsRemaining: "shots restantes",
    switchCamera: "Cambiar cámara",
    permissionDenied: "Permiso de cámara denegado. Habilítalo en la configuración de tu dispositivo.",
    maxPhotosReached: "Ya subiste el máximo de {max} fotos",
    uploadFromGallery: "Subir desde galería",
    takePhoto: "Tomar foto",
    viewPhotoWall: "Ver Photo Wall"
  }
};

export default uiES;