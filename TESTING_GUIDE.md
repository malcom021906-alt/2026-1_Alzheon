# Guía de Pruebas para la Funcionalidad de Música

Este documento describe cómo ejecutar las pruebas creadas para la funcionalidad de música en el proyecto Alzheon.

## 📋 Resumen de Pruebas

### Backend Tests
- **Cucumber Tests**: Pruebas de integración end-to-end
- **Unit Tests**: Pruebas unitarias con Mocha/Chai
- **Coverage**: Búsqueda de canciones, gestión de playlists, reacciones, analíticas

### Frontend Tests
- **Cypress E2E**: Pruebas de interfaz de usuario completas
- **Coverage**: Gestión de música (cuidador), experiencia musical (paciente), analíticas (médico)

## 🚀 Ejecutar Pruebas

### Backend

#### Pruebas Unitarias
```bash
# Todas las pruebas unitarias
npm run test:unit

# Solo pruebas de música
npm run test:unit:musica
```

#### Pruebas Cucumber (Integración)
```bash
# Todas las pruebas Cucumber
npm run test:cucumber

# Solo pruebas de música
npm run test:musica
```

#### Todas las pruebas del backend
```bash
npm run test
```

### Frontend

#### Pruebas E2E con Cypress
```bash
# Todas las pruebas de música
npm run test:musica

# Pruebas por rol
npm run test:musica:cuidador
npm run test:musica:paciente
npm run test:musica:medico

# Abrir Cypress en modo interactivo
npm run cypress:open
```

## 📁 Estructura de Archivos de Prueba

### Backend
```
backend/
├── features/
│   ├── musica.feature                    # Escenarios Cucumber
│   └── step_definitions/
│       └── musica.steps.cjs              # Implementación de pasos
└── tests/
    └── musica/
        └── musicaController.test.js      # Pruebas unitarias
```

### Frontend
```
frontend/
└── cypress/
    └── e2e/
        ├── cuidador/
        │   └── musica-management.cy.js    # Pruebas cuidador
        ├── paciente/
        │   └── musica-experience.cy.js    # Pruebas paciente
        └── medico/
            └── musica-analytics.cy.js     # Pruebas médico
```

## 🧪 Escenarios de Prueba Cubiertos

### Backend

#### Búsqueda de Canciones
- ✅ Búsqueda exitosa con query válido
- ✅ Error con query vacío
- ✅ Error sin API key de YouTube

#### Gestión de Playlists (Cuidador)
- ✅ Obtener playlist vacía inicialmente
- ✅ Agregar canción a playlist
- ✅ Prevenir canciones duplicadas
- ✅ Eliminar canción de playlist
- ✅ Error al eliminar canción inexistente

#### Reacciones del Paciente
- ✅ Registrar reacción emocional
- ✅ Validar campos requeridos
- ✅ Obtener historial de reacciones
- ✅ Obtener playlist del paciente

#### Gestión de Reacciones (Cuidador)
- ✅ Ver reacciones de paciente asociado
- ✅ Agregar notas de cuidador
- ✅ Prevenir acceso a pacientes no asociados

#### Analíticas (Médico)
- ✅ Obtener reacciones con estadísticas
- ✅ Prevenir acceso a pacientes no asignados
- ✅ Validar autorización de médico

### Frontend

#### Cuidador - Gestión de Música
- ✅ Búsqueda de canciones
- ✅ Gestión de playlist (agregar/eliminar)
- ✅ Prevención de duplicados
- ✅ Vista de reacciones del paciente
- ✅ Agregar notas de cuidador
- ✅ Filtrado y ordenamiento
- ✅ Estados de carga y errores

#### Paciente - Experiencia Musical
- ✅ Visualización de playlist
- ✅ Reproducción de música
- ✅ Registro de reacciones emocionales
- ✅ Historial de reacciones
- ✅ Navegación y accesibilidad
- ✅ Diseño responsivo

#### Médico - Analíticas de Música
- ✅ Selección de pacientes
- ✅ Dashboard de analíticas
- ✅ Gráficos de distribución emocional
- ✅ Línea de tiempo de reacciones
- ✅ Revisión de reacciones
- ✅ Exportación de reportes
- ✅ Análisis comparativo

## 🔧 Configuración del Entorno

### Variables de Entorno (Backend)
```env
YOUTUBE_API_KEY=tu_api_key_youtube
MONGODB_URI=mongodb://localhost:27017/alzheon_test
JWT_SECRET=tu_jwt_secret
```

### Datos de Prueba
Las pruebas utilizan usuarios de prueba con los siguientes datos:
- **Cuidador**: `cuidador@test.com` / `password123`
- **Paciente**: `paciente@test.com` / `password123`
- **Médico**: `medico@test.com` / `password123`

## 📊 Reportes y Resultados

### Backend
- Las pruebas unitarias generan reportes en consola
- Las pruebas Cucumber muestran resultados escalonados
- Cobertura de código recomendada: >80%

### Frontend
- Cypress genera videos de las pruebas
- Screenshots automáticos en caso de fallos
- Reportes HTML detallados

## 🐛 Depuración

### Backend
```bash
# Ejecutar pruebas con debug
DEBUG=* npm run test:unit:musica

# Ejecutar un escenario específico
npm run test:musica -- --name "Búsqueda de canciones"
```

### Frontend
```bash
# Ejecutar pruebas en modo headed (visible)
npm run test:musica -- --headed

# Ejecutar una prueba específica
npm run cypress:run --spec "cypress/e2e/cuidador/musica-management.cy.js"
```

## 🔄 Integración Continua

### GitHub Actions (Ejemplo)
```yaml
name: Music Tests
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm run test:musica
  
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run test:musica
```

## 📝 Mejores Prácticas

1. **Ejecutar pruebas localmente** antes de hacer push
2. **Mantener datos de prueba consistentes**
3. **Limpiar base de datos después de cada prueba**
4. **Usar asserts descriptivos** para facilitar depuración
5. **Documentar nuevos escenarios** en esta guía

## 🚨 Consideraciones Importantes

- Las pruebas de YouTube API requieren una API key válida
- Las pruebas de base de datos usan MongoDB Memory Server
- Las pruebas E2E requieren que el backend esté corriendo
- Algunas pruebas pueden necesitar configuración adicional según el entorno

## 📞 Soporte

Si encuentras problemas con las pruebas:
1. Revisa la configuración del entorno
2. Verifica que las dependencias estén instaladas
3. Consulta los logs de error detallados
4. Revisa la documentación de Cypress y Cucumber

---

**Última actualización**: $(date)  
**Versión**: 1.0.0  
**Autor**: Sistema de Pruebas Automatizadas Alzheon
