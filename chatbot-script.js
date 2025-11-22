// GaDiel Assistant - Chatbot Oficial de GaDiel Analytics
class GaDielAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.isListening = false;
        this.knowledgeBase = this.initializeKnowledgeBase();
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.init();
    }

    init() {
        this.createChatbotElements();
        this.bindEvents();
        this.loadChatHistory();
        
        // Configuración de reconocimiento de voz
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'es-ES';
        }

        console.log("🤖 GaDiel Assistant inicializado correctamente");
    }

    initializeKnowledgeBase() {
        return {
            // Información sobre PRONIS
            pronis: {
                definicion: "El PRONIS (Programa Nacional de Inversiones en Salud) es un programa del Estado Peruano que se encarga de gestionar, planificar y ejecutar proyectos de inversión en infraestructura y equipamiento de salud a nivel nacional.",
                funciones: [
                    "Planificar y ejecutar proyectos de infraestructura de salud",
                    "Gestionar recursos para construcción y mejoramiento de establecimientos",
                    "Supervisar el avance físico y financiero de las obras",
                    "Coordinar con gobiernos regionales y locales",
                    "Asegurar la calidad y cumplimiento de estándares en obras de salud"
                ],
                estados: {
                    "Finalizado": "Obras que han completado el 100% de su ejecución física y financiera",
                    "En ejecución": "Obras que están siendo construidas o mejoradas actualmente",
                    "Paralizado": "Obras que temporalmente han detenido sus actividades por diversas razones"
                }
            },
            
            // Información sobre Power BI
            powerbi: {
                definicion: "Power BI es una plataforma de inteligencia empresarial de Microsoft que permite crear dashboards interactivos, reportes y visualizaciones de datos para análisis y toma de decisiones.",
                componentes: {
                    "SPI": "Schedule Performance Index (Índice de Desempeño del Cronograma) - Mide eficiencia en el tiempo",
                    "CPI": "Cost Performance Index (Índice de Desempeño del Costo) - Mide eficiencia en costos",
                    "EV": "Earned Value (Valor Ganado) - Trabajo ejecutado valorado monetariamente",
                    "PV": "Planned Value (Valor Planificado) - Trabajo que debería estar ejecutado según el cronograma",
                    "AC": "Actual Cost (Costo Actual) - Dinero realmente gastado en el proyecto"
                },
                interpretacion: {
                    "SPI > 1": "Proyecto adelantado al cronograma",
                    "SPI = 1": "Proyecto a tiempo",
                    "SPI < 1": "Proyecto atrasado",
                    "CPI > 1": "Proyecto dentro del presupuesto",
                    "CPI = 1": "Proyecto justo en presupuesto",
                    "CPI < 1": "Proyecto excediendo presupuesto"
                }
            },

            // Navegación de GaDiel
            navegacion: {
                "inicio": "Página principal con información general sobre la plataforma y el equipo",
                "obras": "Sección que muestra el listado completo de obras del PRONIS en Cusco con filtros y búsqueda",
                "dashboards": "Visualizaciones interactivas en Power BI con métricas y KPIs",
                "contacto": "Información de contacto y horarios de atención"
            },

            // Términos de ingeniería civil
            ingenieria: {
                "avance fisico": "Porcentaje del trabajo físico completado según lo planificado",
                "avance financiero": "Porcentaje del presupuesto ejecutado en relación a lo planificado",
                "contratista": "Empresa o persona responsable de ejecutar la obra según el contrato",
                "saldo de obra": "Trabajo pendiente por ejecutar en un proyecto",
                "modificatoria": "Cambios al proyecto original autorizados por la entidad competente",
                " expediente tecnico": "Documento técnico que contiene el diseño, especificaciones y presupuesto de la obra"
            },

            // Información sobre la plataforma GaDiel
            gadiel: {
                proposito: "GaDiel es una plataforma de transparencia que permite visualizar el avance de las obras del PRONIS en Cusco mediante dashboards interactivos en Power BI",
                beneficios: [
                    "Transparencia en el uso de recursos públicos",
                    "Seguimiento en tiempo real del avance de obras",
                    "Análisis de eficiencia en tiempo y costos",
                    "Acceso público a información de proyectos de salud",
                    "Herramienta para toma de decisiones basada en datos"
                ]
            }
        };
    }

    createChatbotElements() {
        // Crear botón flotante
        const floatBtn = document.createElement('button');
        floatBtn.className = 'chatbot-float-btn';
        floatBtn.innerHTML = '<i class="fas fa-comments"></i>';
        floatBtn.title = 'Abrir GaDiel Assistant';
        document.body.appendChild(floatBtn);
        this.floatBtn = floatBtn;

        // Crear contenedor del chatbot
        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.innerHTML = this.getChatbotHTML();
        document.body.appendChild(container);
        this.container = container;

        // Crear tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'chatbot-tooltip';
        tooltip.innerHTML = '¿Necesitas ayuda? ¡Pregúntame!';
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;

        // Configurar elementos de referencia
        this.setupElementReferences();
    }

    getChatbotHTML() {
        return `
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <div class="chatbot-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div>
                        <div class="chatbot-title">GaDiel Assistant</div>
                        <div class="chatbot-subtitle">Asistente Oficial GaDiel Analytics</div>
                    </div>
                </div>
                <button class="chatbot-close" title="Cerrar chat">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="chatbot-messages" id="chatbotMessages">
                <!-- Los mensajes se cargan dinámicamente -->
            </div>
            
            <div class="chatbot-attachments">
                <button class="attachment-btn" id="audioBtn" title="Enviar mensaje de voz">
                    <i class="fas fa-microphone"></i>
                </button>
                <button class="attachment-btn" id="fileBtn" title="Adjuntar archivo">
                    <i class="fas fa-paperclip"></i>
                </button>
                <input type="file" id="fileInput" style="display: none;" accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.doc,.docx">
            </div>
            
            <div class="chatbot-input-container">
                <div class="chatbot-input-wrapper">
                    <textarea 
                        class="chatbot-input" 
                        id="chatbotInput"
                        placeholder="Escribe tu pregunta..."
                        rows="1"
                    ></textarea>
                    <button class="chatbot-send-btn" id="sendBtn" title="Enviar mensaje">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
    }

    setupElementReferences() {
        const elements = {
            chatbotMessages: document.getElementById('chatbotMessages'),
            chatbotInput: document.getElementById('chatbotInput'),
            sendBtn: document.getElementById('sendBtn'),
            audioBtn: document.getElementById('audioBtn'),
            fileBtn: document.getElementById('fileBtn'),
            fileInput: document.getElementById('fileInput')
        };

        Object.keys(elements).forEach(key => {
            this[key] = elements[key];
        });
    }

    bindEvents() {
        // Botón flotante
        this.floatBtn.addEventListener('click', () => this.toggleChat());

        // Cerrar chatbot
        this.container.querySelector('.chatbot-close').addEventListener('click', () => this.closeChat());

        // Enviar mensaje
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.chatbotInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Botones de adjuntos
        this.audioBtn.addEventListener('click', () => this.toggleRecording());
        this.fileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Eventos de reconocimiento de voz
        if (this.speechRecognition) {
            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatbotInput.value = transcript;
                this.sendMessage();
            };

            this.speechRecognition.onerror = (event) => {
                console.error('Error de reconocimiento de voz:', event.error);
                this.stopRecording();
                this.showMessage('Lo siento, hubo un error al procesar el audio. Por favor, intenta de nuevo.', 'bot');
            };

            this.speechRecognition.onend = () => {
                this.stopRecording();
            };
        }

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target) && !this.floatBtn.contains(e.target)) {
                // No cerrar automáticamente, solo mostrar tooltip
                this.showTooltip();
            }
        });

        // Tooltip events
        this.floatBtn.addEventListener('mouseenter', () => this.showTooltip());
        this.floatBtn.addEventListener('mouseleave', () => this.hideTooltip());
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }

    openChat() {
        this.container.classList.add('active');
        this.floatBtn.classList.add('active');
        this.hideTooltip();
        
        // Mostrar mensaje de bienvenida si es la primera vez
        if (this.messages.length === 0) {
            setTimeout(() => this.showWelcomeMessage(), 500);
        }
        
        this.scrollToBottom();
        this.chatbotInput.focus();
    }

    closeChat() {
        this.container.classList.remove('active');
        this.floatBtn.classList.remove('active');
        this.isOpen = false;
    }

    showWelcomeMessage() {
        const welcomeText = `¡Hola! Soy GaDiel Assistant 🤝
Estoy aquí para ayudarte a explorar las obras del PRONIS en Cusco, entender los dashboards en Power BI y resolver dudas sobre eficiencia, costos, plazos o indicadores.
Puedes enviarme texto, audio o archivos.
Si necesitas apoyo humano directo, puedes llamar al 982 598 288.
¿En qué te puedo ayudar hoy?`;

        this.showMessage(welcomeText, 'bot');
        
        // Agregar acciones rápidas
        setTimeout(() => {
            this.addQuickActions([
                '¿Qué es PRONIS?',
                '¿Cómo usar los dashboards?',
                '¿Qué significa SPI y CPI?',
                '¿Cómo buscar obras?',
                'Estados de las obras'
            ]);
        }, 1000);
    }

    sendMessage() {
        const message = this.chatbotInput.value.trim();
        if (!message || this.isTyping) return;

        // Mostrar mensaje del usuario
        this.showMessage(message, 'user');
        this.chatbotInput.value = '';
        this.autoResizeTextarea();

        // Procesar mensaje
        this.processMessage(message);
    }

    async processMessage(message) {
        this.showTyping();
        
        try {
            // Simular tiempo de procesamiento
            await this.delay(800);
            
            const response = await this.generateResponse(message);
            this.hideTyping();
            this.showMessage(response, 'bot');
            
        } catch (error) {
            console.error('Error procesando mensaje:', error);
            this.hideTyping();
            this.showMessage('Lo siento, hubo un error procesando tu mensaje. ¿Podrías intentar de nuevo?', 'bot');
        }
    }

    async generateResponse(message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        // Respuestas predefinidas para seguridad
        if (this.containsSecurityKeywords(normalizedMessage)) {
            return this.getSecurityResponse();
        }
        
        // Buscar en la base de conocimiento
        const response = this.searchKnowledgeBase(normalizedMessage);
        if (response) {
            return response;
        }
        
        // Respuestas por contexto de la página
        const pageContextResponse = this.getPageContextResponse(normalizedMessage);
        if (pageContextResponse) {
            return pageContextResponse;
        }
        
        // Respuesta por defecto
        return this.getDefaultResponse(normalizedMessage);
    }

    containsSecurityKeywords(message) {
        const securityKeywords = [
            'codigo', 'código', 'script', 'api key', 'apikey', 'token', 'password', 
            'contraseña', 'route', 'ruta', 'backend', 'database', 'base de datos',
            'internal', 'interno', 'private', 'privado', 'source', 'fuente',
            'developer', 'desarrollador', 'commit', 'git', 'repository', 'repo'
        ];
        
        return securityKeywords.some(keyword => message.includes(keyword));
    }

    getSecurityResponse() {
        return `Por motivos de seguridad, no puedo mostrar el código interno de esta plataforma.
Pero puedo ayudarte explicando cómo funciona o guiándote paso a paso.

¿Hay algo específico de las obras del PRONIS en Cusco que te gustaría saber?`;
    }

    searchKnowledgeBase(message) {
        // Buscar definiciones
        if (message.includes('que es') || message.includes('qué es') || message.includes('definicion')) {
            if (message.includes('pronis')) {
                return `**¿Qué es PRONIS?**

El PRONIS (Programa Nacional de Inversiones en Salud) es un programa del Estado Peruano que se encarga de gestionar, planificar y ejecutar proyectos de inversión en infraestructura y equipamiento de salud a nivel nacional.

**Principales funciones:**
• Planificar y ejecutar proyectos de infraestructura de salud
• Gestionar recursos para construcción y mejoramiento de establecimientos  
• Supervisar el avance físico y financiero de las obras
• Coordinar con gobiernos regionales y locales
• Asegurar la calidad y cumplimiento de estándares

¿En qué obra específica te gustaría profundizar?`;
            }
            
            if (message.includes('power bi') || message.includes('powerbi')) {
                return `**¿Qué es Power BI?**

Power BI es una plataforma de inteligencia empresarial de Microsoft que permite crear dashboards interactivos, reportes y visualizaciones de datos para análisis y toma de decisiones.

**En GaDiel utilizamos Power BI para:**
• Visualizar el avance de obras en tiempo real
• Mostrar métricas de eficiencia (SPI, CPI)
• Analizar costos vs presupuesto
• Generar reportes automáticos
• Facilitar la toma de decisiones

Los dashboards se actualizan automáticamente con los datos más recientes del PRONIS.`;
            }
        }

        // Buscar información sobre métricas
        if (message.includes('spi') || message.includes('cpi') || message.includes('metricas')) {
            return `**Métricas importantes en los dashboards:**

**SPI (Schedule Performance Index):**
• SPI > 1: Proyecto adelantado al cronograma
• SPI = 1: Proyecto a tiempo  
• SPI < 1: Proyecto atrasado

**CPI (Cost Performance Index):**
• CPI > 1: Proyecto dentro del presupuesto
• CPI = 1: Proyecto justo en presupuesto
• CPI < 1: Proyecto excediendo presupuesto

**Otros indicadores:**
• EV (Earned Value): Trabajo ejecutado valorado monetariamente
• PV (Planned Value): Trabajo planificado según cronograma
• AC (Actual Cost): Costo real gastado

¿Te gustaría ver estas métricas en algún proyecto específico?`;
        }

        // Buscar información sobre estados de obras
        if (message.includes('estado') || message.includes('finalizado') || message.includes('ejecucion') || message.includes('paralizado')) {
            return `**Estados de las obras PRONIS:**

**🏁 Finalizado:** 
Obras que han completado el 100% de su ejecución física y financiera

**⚡ En ejecución:** 
Obras que están siendo construidas o mejoradas actualmente

**⏸️ Paralizado:** 
Obras que temporalmente han detenido sus actividades por diversas razones

Puedes filtrar las obras por estado en la sección "Obras PRONIS Cusco" para ver el progreso detallado de cada una.`;
        }

        // Buscar ayuda con navegación
        if (message.includes('como navegar') || message.includes('donde esta') || message.includes('como usar')) {
            return `**Navegación en GaDiel:**

**🏠 Inicio:** Información general sobre la plataforma y el equipo

**🏗️ Obras PRONIS Cusco:** 
• Lista completa de obras con filtros
• Búsqueda por nombre o contratista
• Filtros por provincia y estado
• Ver detalles completos de cada obra

**📊 Dashboards Power BI:**
• Visualizaciones interactivas
• Métricas en tiempo real (SPI, CPI, etc.)
• Gráficos de avance físico y financiero

**📞 Contacto:** Información de contacto y horarios

¿En qué sección específica necesitas ayuda?`;
        }

        return null;
    }

    getPageContextResponse(message) {
        // Obtener contexto actual de la página
        const currentSection = this.getCurrentSection();
        
        if (message.includes('obras') || message.includes('proyectos')) {
            return this.getObrasResponse();
        }
        
        if (message.includes('dashboard') || message.includes('power bi')) {
            return this.getDashboardResponse();
        }
        
        return null;
    }

    getObrasResponse() {
        return `**Sección "Obras PRONIS Cusco":**

Aquí puedes explorar todas las obras de salud en Cusco con:

• **Búsqueda:** Busca por nombre de obra o contratista
• **Filtros:** Por provincia (Espinar, Cusco, La Convención, etc.) y estado
• **Información detallada:** Clic en "Ver Detalles" de cualquier obra
• **Métricas:** Inversión, avance físico y financiero

**Funciones disponibles:**
- Haz clic en el nombre de la obra para ver más detalles
- Usa los filtros para encontrar obras específicas
- Revisa el porcentaje de avance y fechas de finalización

¿Qué obra específica te interesa conocer en detalle?`;
    }

    getDashboardResponse() {
        return `**Dashboards Power BI en GaDiel:**

Los dashboards muestran visualizaciones interactivas con:

• **Avance físico vs financiero** de todas las obras
• **Distribución por provincias** del Cusco
• **Indicadores de eficiencia** (SPI, CPI, etc.)
• **Análisis de presupuestos** planificados vs ejecutados

**Cómo usarlos:**
- Haz clic en cualquier gráfico para filtrar datos
- Usa los controles para cambiar vistas
- Los datos se actualizan automáticamente

¿Te gustaría que te explique algún indicador específico?`;
    }

    getDefaultResponse(message) {
        const responses = [
            `Entiendo tu consulta. Para ayudarte mejor, puedes preguntarme sobre:

• **Obras del PRONIS** en Cusco
• **Dashboards de Power BI** y sus métricas  
• **Estados de las obras** (finalizado, en ejecución, paralizado)
• **Métricas SPI y CPI** y cómo interpretarlas
• **Cómo navegar** en la plataforma GaDiel

¿En qué área específica necesitas información?`,

            `Gracias por tu mensaje. Estoy aquí para ayudarte con:

📋 **Información sobre PRONIS**
📊 **Dashboards y métricas**
🏗️ **Estado de obras específicas**
🔍 **Cómo buscar y filtrar obras**
📈 **Interpretación de indicadores**

¿Qué información necesitas específicamente?`,

            `Puedo ayudarte con información sobre las obras del PRONIS en Cusco y el uso de los dashboards. 

¿Hay algo específico que te gustaría saber sobre:
- Alguna obra en particular
- Las métricas de Power BI
- Cómo interpretar los datos
- El funcionamiento de la plataforma

¿En qué puedo asistirte?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showMessage(text, sender) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;
        
        const avatarEl = document.createElement('div');
        avatarEl.className = 'message-avatar';
        avatarEl.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        
        // Convertir markdown básico a HTML
        const formattedText = this.formatMessage(text);
        contentEl.innerHTML = formattedText;
        
        const timeEl = document.createElement('div');
        timeEl.className = 'message-time';
        timeEl.textContent = this.getCurrentTime();
        
        messageEl.appendChild(avatarEl);
        const contentWrapper = document.createElement('div');
        contentWrapper.appendChild(contentEl);
        contentWrapper.appendChild(timeEl);
        messageEl.appendChild(contentWrapper);
        
        this.chatbotMessages.appendChild(messageEl);
        
        // Agregar a historial
        this.messages.push({ text, sender, time: new Date() });
        this.saveChatHistory();
        
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Convertir **texto** a <strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convertir líneas que empiecen con • a listas
        text = text.replace(/• (.*)/g, '• $1');
        
        // Convertir saltos de línea a <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    showTyping() {
        this.isTyping = true;
        const typingEl = document.createElement('div');
        typingEl.className = 'message bot';
        typingEl.id = 'typingIndicator';
        typingEl.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatbotMessages.appendChild(typingEl);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        const typingEl = document.getElementById('typingIndicator');
        if (typingEl) {
            typingEl.remove();
        }
    }

    addQuickActions(actions) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'quick-actions';
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'quick-action-btn';
            btn.textContent = action;
            btn.addEventListener('click', () => {
                this.chatbotInput.value = action;
                this.sendMessage();
            });
            actionsEl.appendChild(btn);
        });
        
        const messageEl = document.createElement('div');
        messageEl.className = 'message bot';
        messageEl.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div style="margin-bottom: 10px; font-size: 13px; opacity: 0.8;">Preguntas frecuentes:</div>
            </div>
        `;
        
        messageEl.querySelector('.message-content').appendChild(actionsEl);
        this.chatbotMessages.appendChild(messageEl);
        this.scrollToBottom();
    }

    toggleRecording() {
        if (!this.speechRecognition) {
            this.showMessage('Lo siento, tu navegador no soporta reconocimiento de voz.', 'bot');
            return;
        }

        if (this.isListening) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.isListening = true;
        this.audioBtn.innerHTML = '<i class="fas fa-stop"></i>';
        this.audioBtn.style.background = '#e74c3c';
        this.audioBtn.title = 'Detener grabación';
        
        try {
            this.speechRecognition.start();
        } catch (error) {
            console.error('Error iniciando reconocimiento:', error);
            this.stopRecording();
        }
    }

    stopRecording() {
        this.isListening = false;
        this.audioBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        this.audioBtn.style.background = '';
        this.audioBtn.title = 'Enviar mensaje de voz';
        
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showMessage('El archivo es demasiado grande. Máximo 10MB permitido.', 'bot');
            return;
        }

        // Mostrar indicador de carga
        const uploadMessage = this.showFileUploadMessage(file.name);

        // Simular procesamiento
        setTimeout(() => {
            this.processFile(file);
            uploadMessage.remove();
        }, 2000);
    }

    showFileUploadMessage(filename) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user';
        messageEl.innerHTML = `
            <div class="message-avatar"><i class="fas fa-user"></i></div>
            <div class="message-content">
                <div class="file-uploading">
                    <div class="file-upload-progress"></div>
                    <span>Procesando ${filename}...</span>
                </div>
            </div>
        `;
        
        this.chatbotMessages.appendChild(messageEl);
        this.scrollToBottom();
        return messageEl;
    }

    processFile(file) {
        const fileType = file.type;
        const fileName = file.name;

        let response = `He recibido el archivo **${fileName}**.`;

        if (fileType.startsWith('image/')) {
            response += `\n\n📷 **Análisis de imagen:**\nPuedo ayudarte a interpretar gráficos, reportes o documentos visuales relacionados con las obras del PRONIS.\n\n¿Qué información específica necesitas sobre esta imagen?`;
        } else if (fileType === 'application/pdf') {
            response += `\n\n📄 **Análisis de PDF:**\nPuedo revisar documentos técnicos, reportes de avance, expedientes de obras o cualquier documentación relacionada con PRONIS.\n\n¿Qué información necesitas extraer o analizar de este documento?`;
        } else if (fileType.includes('sheet') || fileType.includes('excel')) {
            response += `\n\n📊 **Análisis de Excel:**\nPuedo ayudarte a interpretar datos de obras, presupuestos, cronogramas o cualquier hoja de cálculo relacionada con proyectos de salud.\n\n¿Qué análisis específico necesitas de estos datos?`;
        } else {
            response += `\n\n📁 **Procesamiento de archivo:**\nNo puedo procesar directamente este tipo de archivo, pero puedo ayudarte con la información relacionada al contenido.\n\n¿Podrías describirme qué información contiene y qué necesitas saber?`;
        }

        response += `\n\n💡 **Nota:** Para preservar la seguridad del sistema, no puedo mostrar código interno, pero sí puedo ayudarte con información sobre las obras del PRONIS, dashboards de Power BI y análisis de datos públicos.`;

        this.showMessage(response, 'bot');
    }

    getCurrentSection() {
        const activeSection = document.querySelector('.section.active');
        return activeSection ? activeSection.id : 'inicio';
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
        });
    }

    autoResizeTextarea() {
        const textarea = this.chatbotInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    showTooltip() {
        this.tooltip.classList.add('show');
        setTimeout(() => {
            this.tooltip.classList.remove('show');
        }, 3000);
    }

    hideTooltip() {
        this.tooltip.classList.remove('show');
    }

    saveChatHistory() {
        try {
            localStorage.setItem('gadiel_chat_history', JSON.stringify(this.messages.slice(-50))); // Mantener solo últimos 50 mensajes
        } catch (error) {
            console.log('No se pudo guardar historial de chat');
        }
    }

    loadChatHistory() {
        try {
            const history = localStorage.getItem('gadiel_chat_history');
            if (history) {
                this.messages = JSON.parse(history);
                // No mostrar historial automáticamente para evitar saturación
            }
        } catch (error) {
            console.log('No se pudo cargar historial de chat');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método público para interacción externa
    openWithMessage(message) {
        if (!this.isOpen) {
            this.openChat();
        }
        if (message) {
            setTimeout(() => {
                this.chatbotInput.value = message;
                this.sendMessage();
            }, 500);
        }
    }
}

// Inicializar el chatbot cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.gadielAssistant = new GaDielAssistant();
});

// Exponer métodos globales para uso externo
window.GaDielAssistant = {
    open: () => window.gadielAssistant?.openWithMessage(),
    openWithMessage: (message) => window.gadielAssistant?.openWithMessage(message),
    close: () => window.gadielAssistant?.closeChat()
};