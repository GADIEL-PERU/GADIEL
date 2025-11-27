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
    } catch (error) {}
  }

  init() {
    this.setupEventListeners()
    this.showSection("inicio")
    this.loadDashboards()
    this.initSlider()
    this.setupGlobalEventListeners()
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
        icon.className = mobileNav.classList.contains("active")
          ? "fas fa-times"
          : "fas fa-bars"
      }
    }
  }

  showSection(sectionId) {
    if (sectionId === "obras") this.loadObras()
    else this.stopAutoSync()

    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"))
    document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach((b) => b.classList.remove("active"))

    const targetSection = document.getElementById(sectionId)
    if (targetSection) {
      targetSection.classList.add("active")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    document.querySelectorAll(`[data-section="${sectionId}"]`)
      .forEach((btn) => btn.classList.add("active"))

    this.currentSection = sectionId
  }

  async loadObras() {
    if (this.isLoading) return

    this.isLoading = true
    const loadingSpinner = document.getElementById("loadingSpinner")
    if (loadingSpinner) loadingSpinner.classList.add("show")

    try {
      this.obras = await window.fetchObrasFromSheets()
      this.cleanDuplicateObras()
      this.filteredObras = [...this.obras]
      this.renderObras()
      this.populateFilters()
      this.startAutoSync()
    } catch (e) {
      this.showError("No se pudieron cargar los datos")
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
            <p>${message}</p>
          </td>
        </tr>`
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
        const nuevasObras = await window.fetchObrasFromSheets()
        if (nuevasObras?.length > 0) {
          this.obras = nuevasObras
          this.cleanDuplicateObras()
          this.filterObras()
          this.populateFilters()
        }
      } catch (error) {}
    }, 30000)
  }

  stopAutoSync() {
    if (this.syncInterval) clearInterval(this.syncInterval)
    this.syncInterval = null
  }

  populateFilters() {
    const provinciaFilter = document.getElementById("provinciaFilter")
    const estadoFilter = document.getElementById("estadoFilter")

    if (provinciaFilter && this.obras.length > 0) {
      const provincias = ["Todas", ...new Set(this.obras.map((o) => o.provincia))]
      provinciaFilter.innerHTML =
        provincias.map((p) => `<option value="${p}">${p}</option>`).join("")
    }

    if (estadoFilter && this.obras.length > 0) {
      const estados = ["Todos", ...new Set(this.obras.map((o) => o.estado))]
      estadoFilter.innerHTML =
        estados.map((e) => `<option value="${e}">${e}</option>`).join("")
    }
  }

  filterObras() {
    const searchTerm =
      document.getElementById("searchInput")?.value.toLowerCase().trim() || ""
    const provinciaFilter = document.getElementById("provinciaFilter")?.value || "Todas"
    const estadoFilter = document.getElementById("estadoFilter")?.value || "Todos"

    this.filteredObras = this.obras.filter((obra) => {
      const matchesSearch =
        !searchTerm ||
        obra.nombre?.toLowerCase().includes(searchTerm) ||
        obra.contratista?.toLowerCase().includes(searchTerm)

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

    if (!tableBody) return

    if (this.filteredObras.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-gray-500">
            <p>No se encontraron obras</p>
          </td>
        </tr>`
    } else {
      tableBody.innerHTML = this.filteredObras
        .map((obra) => this.getObraRowHTML(obra))
        .join("")
    }
  }

  getObraRowHTML(obra) {
    return `
      <tr>
        <td>
          <div class="font-medium text-gray-900">${obra.nombre || "Sin nombre"}</div>
          <div class="text-sm text-gray-500">${obra.contratista || ""}</div>
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
          S/ ${(obra.monto_inversion / 1000000)?.toFixed(1)}M
        </td>
        <td>
          <button class="action-btn" onclick="app.showObraDetail(${obra.id})">
            <i class="fas fa-eye mr-1"></i> Ver Detalle
          </button>
        </td>
      </tr>`
  }

  getEstadoClass(estado) {
    const classes = {
      "En ejecución": "estado-ejecucion",
      Finalizado: "estado-finalizado",
      Detenido: "estado-detenido",
      "En proceso": "estado-ejecucion",
      Paralizado: "estado-detenido",
    }
    return classes[estado] || "estado-ejecucion"
  }

  /* ---------------------------------------------------------------------- */
  /* --------------------   DASHBOARDS POWER BI   ------------------------- */
  /* ---------------------------------------------------------------------- */

  loadDashboards() {
    this.dashboards = [
      {
        id: 1,
        titulo: "DASHBOARD PRINCIPAL",
        descripcion: "Vista general consolidada del desempeño financiero y físico",
        iframe_url:
          "https://app.powerbi.com/view?r=eyJrIjoiNzk4NmQ2OGMtZDM5NS00OGI2LWIyNTctMjMzMDY1ODZjMjg4IiwidCI6IjBlMGNiMDYwLTA5YWQtNDlmNS1hMDA1LTY4YjliNDlhYTFmNiIsImMiOjR9&pageName=842c8bacf2c66411f38c",
        activo: true,
        orden: 1,
      },
      {
        id: 2,
        titulo: "DASHBOARD SECUNDARIO (1)",
        descripcion: "Análisis financiero detallado por obra",
        iframe_url:
          "https://app.powerbi.com/reportEmbed?reportId=31b25613-d149-47e7-a689-9fb4d0ae35a0&autoAuth=true&ctid=0e0cb060-09ad-49f5-a005-68b9b49aa1f6&actionBarEnabled=true",
        activo: true,
        orden: 2,
      },
      {
        id: 3,
        titulo: "DASHBOARD 3",
        descripcion: "Seguimiento comparativo del avance físico vs financiero",
        iframe_url:
          "https://app.powerbi.com/view?r=eyJrIjoiOTQ0M2YyZDItODdjYi00NGYyLWE3ZGEtMGM5M2E5ODc2YWFjIiwidCI6IjBlMGNiMDYwLTA5YWQtNDlmNS1hMDA1LTY4YjliNDlhYTFmNiIsImMiOjR9",
        activo: true,
        orden: 3,
      },

      /* ----- DASHBOARDS EN IMAGEN (SIN IFRAME) ----- */
      {
        id: 4,
        titulo: "Dashboard Imagen 4",
        descripcion: "Visualización de panel financiero",
        iframe_url: null,
        image: "assets/img/dashboard4.jpeg",
        activo: true,
        orden: 4,
      },
      {
        id: 5,
        titulo: "Dashboard Imagen 5",
        descripcion: "Visualización de presupuesto y variación",
        iframe_url: null,
        image: "assets/img/dashboard5.jpeg",
        activo: true,
        orden: 5,
      },
      {
        id: 6,
        titulo: "Dashboard Imagen 6",
        descripcion: "Avance real vs planificado",
        iframe_url: null,
        image: "assets/img/dashboard6.jpeg",
        activo: true,
        orden: 6,
      }
    ]

    this.renderDashboards()
  }

  renderDashboards() {
    const dashboardsGrid = document.getElementById("dashboardsGrid")
    if (!dashboardsGrid) return

    const activos = this.dashboards.filter((d) => d.activo !== false)
    const ordenados = [...activos].sort((a, b) => (a.orden || 0) - (b.orden || 0))

    dashboardsGrid.innerHTML = ordenados
      .map(
        (dashboard) => `
      <div class="dashboard-card">
        <div class="dashboard-header">
          <div class="dashboard-title-section">
            <i class="fas fa-chart-bar dashboard-icon"></i>
            <div class="dashboard-text">
              <h3>${dashboard.titulo}</h3>
              <p>${dashboard.descripcion}</p>
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

  renderDashboardContent(dashboard) {
    const isValidUrl =
      dashboard.iframe_url &&
      dashboard.iframe_url.trim() !== "" &&
      dashboard.iframe_url.includes("powerbi.com")

    if (isValidUrl) {
      return `
        <div class="dashboard-iframe-container">
          <iframe src="${dashboard.iframe_url}" class="dashboard-iframe" allowfullscreen="true" loading="lazy"></iframe>
        </div>
      `
    }

    if (dashboard.image) {
      return `
        <div class="dashboard-image-container">
          <img src="${dashboard.image}" class="dashboard-image" alt="${dashboard.titulo}">
        </div>
      `
    }

    return `
      <div class="dashboard-placeholder">
        <p>Dashboard no disponible</p>
      </div>
    `
  }

  showObraDetail(obraId) {
    const obra = this.obras.find((o) => o.id === obraId)
    if (!obra) return alert("Obra no encontrada")

    const modalOverlay = document.getElementById("modalOverlay")
    const modalContent = document.getElementById("modalContent")

    modalContent.innerHTML = `
      <h3>${obra.nombre}</h3>
      <p>${obra.descripcion || "Sin descripción"}</p>
    `

    modalOverlay.style.display = "flex"
    document.body.classList.add("modal-open")
    this.modalOpen = true

    requestAnimationFrame(() => modalOverlay.classList.add("show"))
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
}

let app
document.addEventListener("DOMContentLoaded", () => {
  app = new PRONISApp()
})
