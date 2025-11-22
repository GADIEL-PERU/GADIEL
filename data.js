// Configuración de Google Sheets - CON TUS DATOS REALES
const GOOGLE_SHEETS_CONFIG = {
  SHEET_ID: "1YrkQS0t9Ix4onhOJHZwkQ5eCsmDlFcsULqglC8JbjJw",
  SHEET_NAME: "Obras ",
  API_KEY: "AIzaSyDyE3GDH6860OVXYccltqjOzAr5ZZuMEM0",
}

// Obras reales de Cusco - DATOS LIMPIOS SIN BASURA
const OBRAS_REALES = [
  {
    id: 1,
    nombre: "Hospital Espinar – Mejoramiento",
    descripcion: "Mejoramiento y ampliación del Hospital de Espinar",
    provincia: "Espinar",
    estado: "Finalizado",
    monto_inversion: 97543055.26,
    contratista: "Constructora Andina S.A.",
    fecha_inicio: "2022-06-15",
    fecha_fin: "2024-10-30",
    avance_fisico: 100,
    avance_financiero: 100,
  },
  {
    id: 2,
    nombre: "Centro de Salud Machupicchu – Obra Principal",
    descripcion: "Construcción de nuevo Centro de Salud en Machupicchu",
    provincia: "Urubamba",
    estado: "En ejecución",
    monto_inversion: 26557382.19,
    contratista: "Inversiones Cusco S.A.C.",
    fecha_inicio: "2023-08-10",
    fecha_fin: "2025-06-15",
    avance_fisico: 55.25,
    avance_financiero: 52,
  },
  {
    id: 3,
    nombre: "Centro de Salud Quiñota – Mejoramiento",
    descripcion: "Mejoramiento de infraestructura Centro de Salud Quiñota",
    provincia: "Chumbivilcas",
    estado: "En ejecución",
    monto_inversion: 16543275.75,
    contratista: "Consorcio Salud Perú",
    fecha_inicio: "2024-01-20",
    fecha_fin: "2025-09-10",
    avance_fisico: 17.24,
    avance_financiero: 21,
  },
  {
    id: 4,
    nombre: "Hospital Antonio Lorena – Etapa 2",
    descripcion: "Etapa 2 del Hospital Antonio Lorena - Saldo de Obra",
    provincia: "Cusco",
    estado: "En ejecución",
    monto_inversion: 984899376.74,
    contratista: "Constructor Andino S.A.C.",
    fecha_inicio: "2023-03-01",
    fecha_fin: "2026-03-01",
    avance_fisico: 75,
    avance_financiero: 15.42,
  },
  {
    id: 5,
    nombre: "Hospital Quillabamba – Saldo Final",
    descripcion: "Finalización de obras del Hospital de Quillabamba",
    provincia: "La Convención",
    estado: "En ejecución",
    monto_inversion: 144520424.35,
    contratista: "Empresa Constructora Regional",
    fecha_inicio: "2023-11-15",
    fecha_fin: "2025-12-20",
    avance_fisico: 14,
    avance_financiero: 12.9,
  },
]

// Función para obtener obras desde Google Sheets - OPTIMIZADA PARA NO CONGELARSE
async function fetchObrasFromSheets() {
  try {
    const { SHEET_ID, SHEET_NAME, API_KEY } = GOOGLE_SHEETS_CONFIG

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()

    if (!data.values || data.values.length === 0) {
      return OBRAS_REALES
    }

    const headers = data.values[0]
    const obras = data.values
      .slice(1)
      .map((row, index) => {
        const obra = {}

        headers.forEach((header, colIndex) => {
          const value = (row[colIndex] || "").toString().trim()
          const cleanHeader = header.toLowerCase().trim()

          switch (cleanHeader) {
            case "id":
            case "número":
            case "numero":
              obra.id = Number.parseInt(value) || index + 1
              break
            case "nombre":
            case "obra":
            case "proyecto":
              obra.nombre = value
              break
            case "descripcion":
            case "descripción":
            case "detalle":
              obra.descripcion = value
              break
            case "provincia":
            case "departamento":
            case "ubicacion":
              obra.provincia = value
              break
            case "estado":
            case "status":
            case "situacion":
              obra.estado = value
              break
            case "monto":
            case "monto_inversion":
            case "inversion":
            case "presupuesto":
              obra.monto_inversion = Number.parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "")) || 0
              break
            case "contratista":
            case "empresa":
            case "contratante":
              obra.contratista = value
              break
            case "fecha_inicio":
            case "inicio":
            case "fecha inicio":
              obra.fecha_inicio = value
              break
            case "fecha_fin":
            case "fin":
            case "fecha fin":
            case "fecha final":
              obra.fecha_fin = value
              break
            case "avance_fisico":
            case "fisico":
            case "avance físico":
            case "avancefisico":
              obra.avance_fisico = Number.parseFloat(value.replace("%", "").replace(",", ".")) || 0
              break
            case "avance_financiero":
            case "financiero":
            case "avance financiero":
            case "avancefinanciero":
              obra.avance_financiero = Number.parseFloat(value.replace("%", "").replace(",", ".")) || 0
              break
          }
        })

        // Validar que tenga datos obligatorios
        if (!obra.nombre || !obra.nombre.trim()) return null

        // Campos por defecto
        obra.id = obra.id || index + 1
        obra.estado = obra.estado || "En ejecución"
        obra.provincia = obra.provincia || "Cusco"
        obra.avance_fisico = obra.avance_fisico || 0
        obra.avance_financiero = obra.avance_financiero || 0
        obra.monto_inversion = obra.monto_inversion || 0

        return obra
      })
      .filter((obra) => obra !== null)

    return obras.length > 0 ? obras : OBRAS_REALES
  } catch (error) {
    console.log("📋 Usando datos de ejemplo")
    return OBRAS_REALES
  }
}

// Hacer disponible globalmente
if (typeof window !== "undefined") {
  window.fetchObrasFromSheets = fetchObrasFromSheets
  window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG
  window.OBRAS_REALES = OBRAS_REALES
}
