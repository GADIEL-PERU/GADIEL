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
      console.log("✅ localStorage limpiado")
    } catch (error) {
      console.log("⚠️ No se pudo limpiar localStorage")
    }
  }

  init() {
    this.setupEventListeners()
    this.showSection("inicio")
    this.loadDashboards()
    this.initSlider()
    this.setupGlobalEventListeners()
    console.log("🚀 App Inicializada")
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
    console.log("➡ Cambiando a sección:", sectionId)

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
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
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

      const matchesEstado = estadoFilt
