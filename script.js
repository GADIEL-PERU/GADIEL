class PRONISApp {
  constructor() {
    this.cleanCorruptedLocalStorage()

    this.currentSection = "inicio"
    this.obras = []
    this.filteredObras = []
    this.dashboards = []
    this.isLoading = false
    this.sliders = []
    this.currentSlideIndex = 0
    this.syncInterval = null
    this.renderDebounce = null
    this.filterDebounce = null
    this.modalOpen = false
    this.init()
  }

  cleanCorruptedLocalStorage() {
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          if (
            !key.toLowerCase().includes("gadiel") &&
            !key.toLowerCase().includes("pronis") &&
            !key.toLowerCase().includes("obras")
          ) {
            keysToRemove.push(key)
          }
        }
      }
      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key)
        } catch (e) {}
      })
      console.log("localStorage limpiado")
    } catch (error) {
      console.log("No se pudo limpiar localStorage")
    }
  }

  init() {
    this.setupEventListeners()
    this.showSection("inicio")
    this.loadDashboards()
    this.initSlider()
    this.setupGlobalEventListeners()
    console.log("PRONIS App Lista")
  }

  setupGlobalEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modalOpen) this.closeModal()
    })

    document.addEventListener("click", (e) => {
      if (this.modalOpen && e.target.id === "modalOverlay") this.closeModal()
    })
  }

  setupEventListeners() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn")
    const mobileNav = document.getElementById("mobileNav")

    if (mobileMenuBtn && mobileNav) {
      mobileMenuBtn.addEventListener("click", () => {
        mobileNav.classList.toggle("active")
        this.updateMenuIcon()
      })
    }

    const navButtons = document.querySelectorAll(".nav-btn, .mobile-nav-btn, .footer-link")
    navButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const section = btn.getAttribute("data-section")
        if (section) {
          this.showSection(section)
          if (mobileNav) {
            mobileNav.classList.remove("active")
            this.updateMenuIcon()
          }
        }
      })
    })

    const searchInput = document.getElementById("searchInput")
    const provinciaFilter = document.getElementById("provinciaFilter")
    const estadoFilter = document.getElementById("estadoFilter")

    if (searchInput) {
      searchInput.setAttribute("autocomplete", "off")
      searchInput.addEventListener("input", () => this.debouncedFilterObras())
    }
    if (provinciaFilter) provinciaFilter.addEventListener("change", () => this.debouncedFilterObras())
    if (estadoFilter) estadoFilter.addEventListener("change", () => this.debouncedFilterObras())

    this.setupQuestionsAccordion()
  }

  debouncedFilterObras() {
    if (this.filterDebounce) clearTimeout(this.filterDebounce)
    this.filterDebounce = setTimeout(() => this.filterObras(), 150)
  }

  setupQuestionsAccordion() {
    const questions = document.querySelectorAll(".questions__answer")
    questions.forEach((question) => {
      question.addEventListener("click", () => {
        const answer = question.querySelector(".questions__show")
        const arrow = question.querySelector(".questions__arrow")
        answer.classList.toggle("active")
        arrow.classList.toggle("rotate")
      })
    })
  }

  initSlider() {
    this.sliders = [...document.querySelectorAll(".testimony__body")]
    const buttonNext = document.querySelector("#next")
    const buttonBefore = document.querySelector("#before")
    this.indicators = [...document.querySelectorAll(".testimony__indicator")]

    if (buttonNext && buttonBefore && this.sliders.length > 0) {
      buttonNext.addEventListener("click", () => this.nextSlide())
      buttonBefore.addEventListener("click", () => this.previousSlide())
      this.indicators.forEach((indicator, index) => {
        indicator.addEventListener("click", () => this.goToSlide(index))
      })
      this.updateSlider()
    }
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.sliders.length
    this.updateSlider()
  }

  previousSlide() {
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.sliders.length) % this.sliders.length
    this.updateSlider()
  }

  goToSlide(index) {
    this.currentSlideIndex = index
    this.updateSlider()
  }

  updateSlider() {
    this.sliders.forEach((slider) => slider.classList.remove("testimony__body--show"))
    if (this.sliders[this.currentSlideIndex]) {
      this.sliders[this.currentSlideIndex].classList.add("testimony__body--show")
    }
    if (this.indicators?.length > 0) {
      this.indicators.forEach((indicator, index) => {
        indicator.classList.toggle("active", index === this.currentSlideIndex)
      })
    }
  }
     updateMenuIcon() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn")
    const mobileNav = document.getElementById("mobileNav")
    if (mobileMenuBtn && mobileNav) {
      const icon = mobileMenuBtn.querySelector("i")
      if (icon) {
        icon.className = mobileNav.classList.contains("active") ? "fas fa-times" : "fas fa-bars"
      }
    }
  }

  showSection(sectionId) {
    console.log("🔀 Cambiando a sección:", sectionId)

    if (sectionId === "obras") {
      this.loadObras()
    } else {
      this.stopAutoSync()
    }

    document.querySelectorAll(".section").forEach((section) =>
      section.classList.remove("active")
    )
    document
      .querySelectorAll(".nav-btn, .mobile-nav-btn")
      .forEach((btn) => btn.classList.remove("active"))

    const targetSection = document.getElementById(sectionId)
    if (targetSection) {
      targetSection.classList.add("active")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    document.querySelectorAll(`[data-section="${sectionId}"]`).forEach((btn) =>
      btn.classList.add("active")
    )

    this.currentSection = sectionId
  }

  async loadObras() {
    if (this.isLoading) return

    this.isLoading = true
    const loadingSpinner = document.getElementById("loadingSpinner")
    if (loadingSpinner) loadingSpinner.classList.add("show")

    try {
      console.log("🔄 Cargando obras...")
      this.obras = await window.fetchObrasFromSheets()
      console.log("✅ Datos cargados:", this.obras.length)

      this.cleanDuplicateObras()
      this.filteredObras = [...this.obras]
      this.renderObras()
      this.populateFilters()
      this.startAutoSync()
    } catch (error) {
      console.error("❌ Error:", error)
      this.showError("No se pudieron cargar los datos. Verifica la conexión.")
    } finally {
      this.isLoading = false
      if (loadingSpinner) loadingSpinner.classList.remove("show")
    }
  }

  showError(message) {
    const tableBody = document.getElementById("obrasTableBody")
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-red-600">
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p>${message}</p>
            <button onclick="app.loadObras()" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
              Reintentar
            </button>
          </td>
        </tr>
      `
    }
  }

  cleanDuplicateObras() {
    const uniqueObras = []
    const seenIds = new Set()

    this.obras.forEach((obra) => {
      if (!seenIds.has(obra.id)) {
        uniqueObras.push(obra)
        seenIds.add(obra.id)
      }
    })

    this.obras = uniqueObras
  }

  startAutoSync() {
    this.stopAutoSync()
    this.syncInterval = setInterval(async () => {
      try {
        console.log("🔄 Sincronización automática...")
        const nuevasObras = await window.fetchObrasFromSheets()

        if (nuevasObras && nuevasObras.length > 0) {
          this.obras = nuevasObras
          this.cleanDuplicateObras()
          this.filterObras()
          this.populateFilters()
          console.log("✅ Datos actualizados:", this.obras.length)
        }
      } catch (error) {
        console.log("⚠️ Error en sincronización")
      }
    }, 30000)
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  populateFilters() {
    const provinciaFilter = document.getElementById("provinciaFilter")
    const estadoFilter = document.getElementById("estadoFilter")

    if (provinciaFilter && this.obras.length > 0) {
      const provincias = [
        "Todas",
        ...new Set(this.obras.map((o) => o.provincia).filter((p) => p)),
      ]
      provinciaFilter.innerHTML = provincias
        .map((p) => `<option value="${p}">${p}</option>`)
        .join("")
    }

    if (estadoFilter && this.obras.length > 0) {
      const estados = ["Todos", ...new Set(this.obras.map((o) => o.estado).filter((e) => e))]
      estadoFilter.innerHTML = estados
        .map((e) => `<option value="${e}">${e}</option>`)
        .join("")
    }
  }

  filterObras() {
    const searchTerm =
      document.getElementById("searchInput")?.value.toLowerCase().trim() || ""
    const provinciaFilter =
      document.getElementById("provinciaFilter")?.value || "Todas"
    const estadoFilter =
      document.getElementById("estadoFilter")?.value || "Todos"

    this.filteredObras = this.obras.filter((obra) => {
      const matchesSearch =
        !searchTerm ||
        (obra.nombre && obra.nombre.toLowerCase().includes(searchTerm)) ||
        (obra.contratista && obra.contratista.toLowerCase().includes(searchTerm))

      const matchesProvincia =
        provinciaFilter === "Todas" || obra.provincia === provinciaFilter
      const matchesEstado = estadoFilter === "Todos" || obra.estado === estadoFilter

      return matchesSearch && matchesProvincia && matchesEstado
    })

    this.renderObras()
  }

  renderObras() {
    const tableBody = document.getElementById("obrasTableBody")
    const resultsNumber = document.getElementById("resultsNumber")
    const totalObras = document.getElementById("totalObras")

    if (resultsNumber) resultsNumber.textContent = this.filteredObras.length
    if (totalObras) totalObras.textContent = this.obras.length

    if (tableBody) {
      if (this.filteredObras.length === 0) {
        tableBody.innerHTML = this.getNoResultsHTML()
      } else {
        tableBody.innerHTML = this.filteredObras
          .map((obra) => this.getObraRowHTML(obra))
          .join("")
      }
    }
  }

  getNoResultsHTML() {
    return `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          <i class="fas fa-search text-2xl mb-2 text-gray-400"></i>
          <p>No se encontraron obras con los filtros aplicados</p>
        </td>
      </tr>
    `
  }
    getObraRowHTML(obra) {
    return `
      <tr>
        <td>
          <div class="font-medium text-gray-900">${obra.nombre || "Sin nombre"}</div>
          <div class="text-sm text-gray-500">${obra.contratista || "Sin contratista"}</div>
        </td>
        <td>
          <div class="flex items-center gap-2 text-gray-700">
            <i class="fas fa-map-marker-alt text-blue-600 text-sm"></i>
            ${obra.provincia || "No especificado"}
          </div>
        </td>
        <td>
          <span class="estado-badge ${this.getEstadoClass(obra.estado)}">
            ${obra.estado || "No especificado"}
          </span>
        </td>
        <td class="text-gray-700 font-medium">
          S/ ${
            obra.monto_inversion
              ? (obra.monto_inversion / 1000000).toFixed(1) + "M"
              : "N/A"
          }
        </td>
        <td>
          <div class="progress-container">
            <div class="progress-item">
              <div class="progress-labels">
                <span>Físico</span>
                <span>${obra.avance_fisico || 0}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill progress-fisico"
                     style="width: ${obra.avance_fisico || 0}%"></div>
              </div>
            </div>
            <div class="progress-item">
              <div class="progress-labels">
                <span>Financiero</span>
                <span>${obra.avance_financiero || 0}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill progress-financiero"
                     style="width: ${obra.avance_financiero || 0}%"></div>
              </div>
            </div>
          </div>
        </td>
        <td>
          <button class="action-btn" onclick="app.showObraDetail(${obra.id})">
            <i class="fas fa-eye mr-1"></i>
            Ver Detalle
          </button>
        </td>
      </tr>
    `
  }

  showObraDetail(obraId) {
    console.log("🔍 Mostrando detalle:", obraId)

    const obra = this.obras.find((o) => o.id === obraId)
    if (!obra) return alert("Obra no encontrada")

    const modalOverlay = document.getElementById("modalOverlay")
    const modalContent = document.getElementById("modalContent")

    modalContent.innerHTML = this.getModalHTML(obra)

    modalOverlay.style.display = "flex"
    document.body.classList.add("modal-open")
    this.modalOpen = true

    requestAnimationFrame(() => {
      modalOverlay.classList.add("show")
    })
  }

  getModalHTML(obra) {
    return `
      <div class="modal-header">
        <button class="modal-close-btn" onclick="app.closeModal()">
          <i class="fas fa-times"></i>
        </button>
        <h3 class="modal-title">${obra.nombre || "Sin nombre"}</h3>
        <p class="modal-description">${obra.descripcion || "Sin descripción disponible"}</p>
      </div>

      <div class="modal-body">
        <div class="info-grid">

          <div class="info-item blue">
            <i class="fas fa-map-marker-alt info-icon"></i>
            <div>
              <p class="info-label">Provincia</p>
              <p class="info-value">${obra.provincia || "No especificado"}</p>
            </div>
          </div>

          <div class="info-item green">
            <i class="fas fa-dollar-sign info-icon"></i>
            <div>
              <p class="info-label">Inversión Total</p>
              <p class="info-value">S/ ${
                obra.monto_inversion
                  ? obra.monto_inversion.toLocaleString("es-PE")
                  : "No disponible"
              }</p>
            </div>
          </div>

          <div class="info-item purple">
            <i class="fas fa-building info-icon"></i>
            <div>
              <p class="info-label">Contratista</p>
              <p class="info-value">${obra.contratista || "No especificado"}</p>
            </div>
          </div>

          <div class="info-item orange">
            <i class="fas fa-calendar info-icon"></i>
            <div>
              <p class="info-label">Período de Ejecución</p>
              <p class="info-value">
                ${this.formatDate(obra.fecha_inicio)} -
                ${this.formatDate(obra.fecha_fin)}
              </p>
            </div>
          </div>

        </div>

        <div class="progress-section">
          <h4 class="progress-title">Avance del Proyecto</h4>

          <div class="progress-large">
            <div class="progress-labels-large">
              <span>Avance Físico</span>
              <span>${obra.avance_fisico || 0}%</span>
            </div>
            <div class="progress-bar-large">
              <div class="progress-fill-large progress-fisico"
                   style="width: ${obra.avance_fisico || 0}%"></div>
            </div>
          </div>

          <div class="progress-large">
            <div class="progress-labels-large">
              <span>Avance Financiero</span>
              <span>${obra.avance_financiero || 0}%</span>
            </div>
            <div class="progress-bar-large">
              <div class="progress-fill-large progress-financiero"
                   style="width: ${obra.avance_financiero || 0}%"></div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-action-btn" onclick="app.closeModal()">
            <i class="fas fa-times mr-2"></i> Cerrar
          </button>
        </div>
      </div>
    `
  }

  closeModal() {
    const modalOverlay = document.getElementById("modalOverlay")
    modalOverlay.classList.remove("show")
    document.body.classList.remove("modal-open")
    setTimeout(() => {
      modalOverlay.style.display = "none"
      this.modalOpen = false
    }, 300)
  }

  formatDate(dateString) {
    if (!dateString) return "No especificado"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  getEstadoClass(estado) {
    const classes = {
      "En ejecución": "estado-ejecucion",
      "En proceso": "estado-ejecucion",
      Finalizado: "estado-finalizado",
      Terminado: "estado-finalizado",
      Detenido: "estado-detenido",
      Paralizado: "estado-detenido",
    }
    return classes[estado] || "estado-ejecucion"
  }


  /*  
  ============================================================
  ⭐⭐⭐⭐⭐  AQUÍ VA LO QUE ME PEDISTE: TUS DASHBOARDS CORREGIDOS
  ============================================================
  */
  loadDashboards() {
    this.dashboards = [
      // 1️⃣ Dashboard PRINCIPAL
      {
        id: 1,
        titulo: "DASHBOARD PRINCIPAL",
        descripcion: "Dashboard principal con visión general de las obras PRONIS",
        iframe_url:
          "https://app.powerbi.com/view?r=eyJrIjoiNzk4NmQ2OGMtZDM5NS00OGI2LWIyNTctMjMzMDY1ODZjMjg4IiwidCI6IjBlMGNiMDYwLTA5YWQtNDlmNS1hMDA1LTY4YjliNDlhYTFmNiIsImMiOjR9&pageName=842c8bacf2c66411f38c",
        activo: true,
        orden: 1,
      },

      // 2️⃣ Dashboard SECUNDARIO (1)
      {
        id: 2,
        titulo: "DASHBOARD SECUNDARIO (1)",
        descripcion: "Dashboard Panorama General",
        iframe_url:
          "https://app.powerbi.com/reportEmbed?reportId=31b25613-d149-47e7-a689-9fb4d0ae35a0&autoAuth=true&ctid=0e0cb060-09ad-49f5-a005-68b9b49aa1f6&actionBarEnabled=true",
        activo: true,
        orden: 2,
      },

      // 3️⃣ Dashboard 3
      {
        id: 3,
        titulo: "DASHBOARD 3",
        descripcion: "Evaluación del desempeño por empresa contratista",
        iframe_url:
          "https://app.powerbi.com/view?r=eyJrIjoiOTQ0M2YyZDItODdjYi00NGYyLWE3ZGEtMGM5M2E5ODc2YWFjIiwidCI6IjBlMGNiMDYwLTA5YWQtNDlmNS1hMDA1LTY4YjliNDlhYTFmNiIsImMiOjR9",
        activo: true,
        orden: 3,
      },

      // 4️⃣ IMAGEN 1
      {
        id: 4,
        titulo: "Análisis complementario del panorama general",
        descripcion: "Dashboard basado en imagen",
        iframe_url: null,
        image: "assets/img/dashboard4.jpeg",
        activo: true,
        orden: 4,
      },

      // 5️⃣ IMAGEN 2
      {
        id: 5,
        titulo: "Dashboard Imagen 5",
        descripcion: "Vista ejecutiva con indicadores estratégicos",
        iframe_url: null,
        image: "assets/img/dashboard5.jpeg",
        activo: true,
        orden: 5,
      },

      // 6️⃣ IMAGEN 3
      {
        id: 6,
        titulo: "Dashboard Imagen 6",
        descripcion: "Análisis ejecutivo complementario",
        iframe_url: null,
        image: "assets/img/dashboard6.jpeg",
        activo: true,
        orden: 6,
      },
    ]

    this.renderDashboards()
  }
    renderDashboards() {
    const dashboardsGrid = document.getElementById("dashboardsGrid")
    if (!dashboardsGrid) return

    const dashboardsActivos = this.dashboards.filter((d) => d.activo !== false)

    if (dashboardsActivos.length === 0) {
      dashboardsGrid.innerHTML = this.getNoDashboardsHTML()
    } else {
      const dashboardsOrdenados = [...dashboardsActivos].sort(
        (a, b) => (a.orden || 0) - (b.orden || 0)
      )

      dashboardsGrid.innerHTML = dashboardsOrdenados
        .map(
          (dashboard, index) => `
          <div class="dashboard-card" style="animation-delay: ${index * 0.1}s">
            <div class="dashboard-header">
              <div class="dashboard-header-content">
                <div class="dashboard-title-section">
                  <i class="fas fa-chart-bar dashboard-icon"></i>
                  <div class="dashboard-text">
                    <h3>${dashboard.titulo}</h3>
                    <p>${dashboard.descripcion}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="dashboard-body">
              ${this.renderDashboardContent(dashboard)}
            </div>
          </div>
        `
        )
        .join("")
    }
  }

  renderDashboardContent(dashboard) {
    // 1️⃣ Caso: Dashboard con iframe (Power BI)
    if (
      dashboard.iframe_url &&
      dashboard.iframe_url.trim() !== "" &&
      dashboard.iframe_url.includes("powerbi.com")
    ) {
      return `
        <div class="dashboard-iframe-container" id="dashboard-${dashboard.id}">
          <iframe
            src="${dashboard.iframe_url}"
            class="dashboard-iframe"
            allowfullscreen="true"
            loading="lazy"
            frameborder="0"
          ></iframe>
        </div>
      `
    }

    // 2️⃣ Caso: Dashboard basado en IMAGEN 
    if (dashboard.image) {
      return `
        <div class="dashboard-image-container">
          <img src="${dashboard.image}" alt="${dashboard.titulo}" class="dashboard-image">
        </div>
      `
    }

    // 3️⃣ Error / sin datos
    return this.getDashboardErrorHTML()
  }

  getNoDashboardsHTML() {
    return `
      <div class="dashboard-card">
        <div class="dashboard-header">
          <div class="dashboard-header-content">
            <div class="dashboard-title-section">
              <i class="fas fa-chart-bar dashboard-icon"></i>
              <div class="dashboard-text">
                <h3>No hay dashboards configurados</h3>
                <p>Los dashboards estarán disponibles próximamente</p>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-body">
          <div class="dashboard-content">
            <div class="dashboard-placeholder">
              <i class="fas fa-chart-bar dashboard-placeholder-icon"></i>
              <p class="dashboard-placeholder-text">Dashboards en preparación</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  getDashboardErrorHTML() {
    return `
      <div class="dashboard-content">
        <div class="dashboard-placeholder">
          <i class="fas fa-exclamation-triangle dashboard-placeholder-icon"></i>
          <p class="dashboard-placeholder-text">Dashboard no disponible</p>
        </div>
      </div>
    `
  }

  openDashboardFullscreen(dashboardId) {
    const dashboard = this.dashboards.find((d) => d.id === dashboardId)
    if (!dashboard || !dashboard.iframe_url) return

    const fullscreenContainer = document.createElement("div")
    fullscreenContainer.className = "dashboard-fullscreen"
    fullscreenContainer.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: white; z-index: 10000;
      display: flex; flex-direction: column;
    `

    const header = document.createElement("div")
    header.style.cssText = `
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white; padding: 1rem 2rem;
      display: flex; justify-content: space-between; align-items: center;
    `

    header.innerHTML = `
      <div>
        <h3 style="margin:0; font-size:1.5rem;">${dashboard.titulo}</h3>
        <p style="margin:0.25rem 0 0; opacity:0.9;">${dashboard.descripcion}</p>
      </div>
      <button onclick="app.closeFullscreen()"
        style="background:rgba(255,255,255,0.2); border:none;
               color:white; padding:0.7rem 1.2rem;
               border-radius:0.5rem; cursor:pointer;">
        <i class="fas fa-times"></i> Cerrar
      </button>
    `

    const iframe = document.createElement("iframe")
    iframe.src = dashboard.iframe_url
    iframe.style.cssText = "flex:1; width:100%; height:100%; border:none;"
    iframe.allowFullscreen = true

    fullscreenContainer.appendChild(header)
    fullscreenContainer.appendChild(iframe)
    document.body.appendChild(fullscreenContainer)
    document.body.style.overflow = "hidden"
  }

  closeFullscreen() {
    const fullscreenContainer = document.querySelector(".dashboard-fullscreen")
    if (fullscreenContainer) {
      fullscreenContainer.remove()
      document.body.style.overflow = ""
    }
  }
}

/* ============================================================
   🔚 FINAL: INICIALIZACIÓN COMPLETA
   ============================================================ */

let app
document.addEventListener("DOMContentLoaded", () => {
  app = new PRONISApp()
  console.log("🚀 PRONIS App Lista - Optimizada SIN CONGELACIÓN")
})

function openDashboardNewTab(id) {
  const dashboards = window.app?.dashboards || []
  const dashboard = dashboards.find((d) => d.id === id)
  if (dashboard && dashboard.iframe_url) {
    window.open(dashboard.iframe_url, "_blank", "noopener,noreferrer")
  }
}

function forceSync() {
  if (app && app.currentSection === "obras") {
    app.loadObras()
  }
}
