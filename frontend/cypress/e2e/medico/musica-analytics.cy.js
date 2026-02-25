describe('Music Analytics - Médico', () => {
  beforeEach(() => {
    // Login as medico
    cy.visit('/login');
    cy.get('[data-cy=email]').type('medico@test.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=login-button]').click();
    
    // Wait for login to complete
    cy.url().should('not.include', '/login');
  });

  describe('Patient Selection', () => {
    beforeEach(() => {
      // Mock assigned patients
      cy.intercept('GET', '/api/medico/pacientes', {
        body: [
          {
            _id: 'patient1',
            nombre: 'Juan Pérez',
            email: 'juan@test.com',
            ultimoAcceso: new Date().toISOString()
          },
          {
            _id: 'patient2',
            nombre: 'María García',
            email: 'maria@test.com',
            ultimoAcceso: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }).as('getPatients');
    });

    it('should display list of assigned patients', () => {
      cy.visit('/medico/musica');
      cy.wait('@getPatients');
      
      // Should show patient selection
      cy.get('[data-cy=patient-selection]').should('be.visible');
      cy.get('[data-cy=patient-list]').should('be.visible');
      
      // Should show patients
      cy.get('[data-cy=patient-item]').should('have.length', 2);
      
      // Verify first patient
      cy.get('[data-cy=patient-item]').first().within(() => {
        cy.get('[data-cy=patient-name]').should('contain', 'Juan Pérez');
        cy.get('[data-cy=patient-email]').should('contain', 'juan@test.com');
        cy.get('[data-cy=last-access]').should('contain', 'hace unos segundos');
      });
    });

    it('should select patient to view analytics', () => {
      cy.visit('/medico/musica');
      cy.wait('@getPatients');
      
      // Select first patient
      cy.get('[data-cy=patient-item]').first().click();
      
      // Should load patient analytics
      cy.url().should('include', '/paciente/patient1');
      cy.get('[data-cy=analytics-header]').should('be.visible');
    });

    it('should show empty state when no patients assigned', () => {
      // Mock empty patient list
      cy.intercept('GET', '/api/medico/pacientes', {
        body: []
      }).as('getEmptyPatients');
      
      cy.visit('/medico/musica');
      cy.wait('@getEmptyPatients');
      
      // Should show empty state
      cy.get('[data-cy=empty-patients]').should('be.visible');
      cy.get('[data-cy=empty-patients]').should('contain', 'No tienes pacientes asignados');
    });
  });

  describe('Music Analytics Dashboard', () => {
    beforeEach(() => {
      // Mock patient with music reactions
      cy.intercept('GET', '/api/medico/pacientes/patient1/musica/reacciones', {
        body: {
          reacciones: [
            {
              _id: 'reaction1',
              pacienteId: 'patient1',
              videoId: 'song1',
              tituloCancion: 'Happy Song',
              artistaCancion: 'Happy Artist',
              emocion: 'feliz',
              recuerdo: 'This makes me feel good',
              nivelRecuerdo: 'claro',
              notasCuidador: 'Patient was smiling',
              revisadoPorMedico: false,
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              _id: 'reaction2',
              pacienteId: 'patient1',
              videoId: 'song2',
              tituloCancion: 'Sad Song',
              artistaCancion: 'Sad Artist',
              emocion: 'triste',
              recuerdo: 'This reminds me of loss',
              nivelRecuerdo: 'muy_claro',
              notasCuidador: '',
              revisadoPorMedico: false,
              createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
              _id: 'reaction3',
              pacienteId: 'patient1',
              videoId: 'song3',
              tituloCancion: 'Neutral Song',
              artistaCancion: 'Neutral Artist',
              emocion: 'feliz',
              recuerdo: 'I like this song',
              nivelRecuerdo: 'vago',
              notasCuidador: '',
              revisadoPorMedico: true,
              createdAt: new Date(Date.now() - 259200000).toISOString()
            }
          ],
          estadisticas: {
            totalReacciones: 3,
            cancionesUnicas: 3,
            emocionMasFrecuente: 'feliz',
            conteoPorEmocion: {
              muy_feliz: 0,
              feliz: 2,
              neutral: 0,
              triste: 1,
              ansioso: 0,
              sin_reaccion: 0
            },
            conteoPorNivelRecuerdo: {
              ninguno: 0,
              vago: 1,
              claro: 1,
              muy_claro: 1
            },
            promedioSemanal: 0.8
          }
        }
      }).as('getAnalytics');
    });

    it('should display comprehensive analytics dashboard', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getAnalytics');
      
      // Should show patient info
      cy.get('[data-cy=patient-info]').should('be.visible');
      cy.get('[data-cy=patient-name]').should('contain', 'Juan Pérez');
      
      // Should show statistics cards
      cy.get('[data-cy=stats-cards]').should('be.visible');
      cy.get('[data-cy=stat-card]').should('have.length', 4);
      
      // Verify key statistics
      cy.get('[data-cy=total-reactions]').should('contain', '3');
      cy.get('[data-cy=unique-songs]').should('contain', '3');
      cy.get('[data-cy=frequent-emotion]').should('contain', 'feliz');
      cy.get('[data-cy=weekly-average]').should('contain', '0.8');
    });

    it('should display emotion distribution chart', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getAnalytics');
      
      // Should show emotion chart
      cy.get('[data-cy=emotion-chart]').should('be.visible');
      cy.get('[data-cy=chart-title]').should('contain', 'Distribución de Emociones');
      
      // Should have chart bars
      cy.get('[data-cy=emotion-bar]').should('have.length', 6);
      
      // Verify happy emotion (most frequent)
      cy.get('[data-cy=emotion-bar-feliz]').should('be.visible');
      cy.get('[data-cy=emotion-bar-feliz]').should('contain', '2');
      
      // Verify sad emotion
      cy.get('[data-cy=emotion-bar-triste]').should('be.visible');
      cy.get('[data-cy=emotion-bar-triste]').should('contain', '1');
    });

    it('should display memory level distribution', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getAnalytics');
      
      // Should show memory chart
      cy.get('[data-cy=memory-chart]').should('be.visible');
      cy.get('[data-cy=chart-title]').should('contain', 'Niveles de Recuerdo');
      
      // Should have memory level bars
      cy.get('[data-cy=memory-bar]').should('have.length', 4);
      
      // Verify memory levels
      cy.get('[data-cy=memory-bar-claro]').should('contain', '1');
      cy.get('[data-cy=memory-bar-muy_claro]').should('contain', '1');
      cy.get('[data-cy=memory-bar-vago]').should('contain', '1');
    });

    it('should display reaction timeline', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getAnalytics');
      
      // Should show timeline
      cy.get('[data-cy=reaction-timeline]').should('be.visible');
      cy.get('[data-cy=timeline-title]').should('contain', 'Línea de Tiempo de Reacciones');
      
      // Should show reaction items
      cy.get('[data-cy=timeline-item]').should('have.length', 3);
      
      // Verify first (newest) reaction
      cy.get('[data-cy=timeline-item]').first().within(() => {
        cy.get('[data-cy=song-title]').should('contain', 'Happy Song');
        cy.get('[data-cy=emotion-badge]').should('contain', 'feliz');
        cy.get('[data-cy=reaction-date]').should('contain', 'hace 1 día');
        cy.get('[data-cy=caregiver-note]').should('contain', 'Patient was smiling');
        cy.get('[data-cy=reviewed-status]').should('contain', 'No revisado');
      });
    });

    it('should allow filtering reactions by date range', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getAnalytics');
      
      // Open date filter
      cy.get('[data-cy=date-filter]').click();
      
      // Select last week
      cy.get('[data-cy=filter-last-week]').click();
      
      // Should apply filter
      cy.get('[data-cy=active-filter]').should('contain', 'Última semana');
      
      // Should show filtered results
      cy.get('[data-cy=timeline-item]').should('have.length.lessThan', 3);
    });

    it('should allow filtering by emotion', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getAnalytics');
      
      // Filter by "feliz" emotion
      cy.get('[data-cy=emotion-filter]').select('feliz');
      
      // Should show only happy reactions
      cy.get('[data-cy=timeline-item]').should('have.length', 2);
      cy.get('[data-cy=timeline-item]').each(($item) => {
        cy.wrap($item).find('[data-cy=emotion-badge]').should('contain', 'feliz');
      });
    });

    it('should allow sorting reactions', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getAnalytics');
      
      // Sort by oldest first
      cy.get('[data-cy=sort-select]').select('oldest');
      
      // Should reverse order
      cy.get('[data-cy=timeline-item]').first().should('contain', 'Neutral Song');
      cy.get('[data-cy=timeline-item]').last().should('contain', 'Happy Song');
    });
  });

  describe('Reaction Review', () => {
    beforeEach(() => {
      // Mock reactions needing review
      cy.intercept('GET', '/api/medico/pacientes/patient1/musica/reacciones', {
        body: {
          reacciones: [
            {
              _id: 'reaction1',
              pacienteId: 'patient1',
              videoId: 'song1',
              tituloCancion: 'Review Song',
              artistaCancion: 'Review Artist',
              emocion: 'ansioso',
              recuerdo: 'This makes me anxious',
              nivelRecuerdo: 'claro',
              notasCuidador: 'Patient seemed uncomfortable',
              revisadoPorMedico: false,
              createdAt: new Date().toISOString()
            }
          ],
          estadisticas: {
            totalReacciones: 1,
            cancionesUnicas: 1,
            emocionMasFrecuente: 'ansioso',
            conteoPorEmocion: { ansioso: 1 },
            conteoPorNivelRecuerdo: { claro: 1 },
            promedioSemanal: 0.2
          }
        }
      }).as('getReactionsForReview');
    });

    it('should mark reactions as reviewed', () => {
      // Mock review endpoint
      cy.intercept('PATCH', '/api/medico/pacientes/patient1/musica/reacciones/reaction1/revisar', {
        body: {
          _id: 'reaction1',
          revisadoPorMedico: true
        }
      }).as('markReviewed');
      
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getReactionsForReview');
      
      // Mark reaction as reviewed
      cy.get('[data-cy=mark-reviewed]').click();
      cy.wait('@markReviewed');
      
      // Should update status
      cy.get('[data-cy=reviewed-status]').should('contain', 'Revisado');
      cy.get('[data-cy=mark-reviewed]').should('not.exist');
    });

    it('should add medical notes to reactions', () => {
      // Mock add note endpoint
      cy.intercept('PATCH', '/api/medico/pacientes/patient1/musica/reacciones/reaction1/nota-medica', {
        body: {
          _id: 'reaction1',
          notaMedica: 'Paciente muestra respuesta emocional positiva a estímulos musicales'
        }
      }).as('addMedicalNote');
      
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getReactionsForReview');
      
      // Add medical note
      cy.get('[data-cy=add-medical-note]').click();
      cy.get('[data-cy=medical-note-textarea]').type('Paciente muestra respuesta emocional positiva a estímulos musicales');
      cy.get('[data-cy=save-medical-note]').click();
      cy.wait('@addMedicalNote');
      
      // Should show note
      cy.get('[data-cy=medical-note]').should('contain', 'Paciente muestra respuesta emocional positiva');
    });

    it('should show reactions needing review prominently', () => {
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getReactionsForReview');
      
      // Should highlight unreviewed reactions
      cy.get('[data-cy=unreviewed-indicator]').should('be.visible');
      cy.get('[data-cy=unreviewed-badge]').should('contain', 'Pendiente de revisión');
    });
  });

  describe('Export and Reports', () => {
    beforeEach(() => {
      // Mock comprehensive data for export
      cy.intercept('GET', '/api/medico/pacientes/patient1/musica/reacciones', {
        body: {
          reacciones: [
            {
              _id: 'reaction1',
              videoId: 'song1',
              tituloCancion: 'Export Test Song',
              emocion: 'feliz',
              nivelRecuerdo: 'claro',
              createdAt: new Date().toISOString()
            }
          ],
          estadisticas: {
            totalReacciones: 1,
            cancionesUnicas: 1,
            emocionMasFrecuente: 'feliz',
            conteoPorEmocion: { feliz: 1 },
            conteoPorNivelRecuerdo: { claro: 1 },
            promedioSemanal: 0.3
          }
        }
      }).as('getExportData');
    });

    it('should export analytics to PDF', () => {
      // Mock PDF generation
      cy.intercept('GET', '/api/medico/pacientes/patient1/musica/export/pdf', {
        statusCode: 200,
        headers: { 'content-type': 'application/pdf' },
        body: new ArrayBuffer(1000)
      }).as('exportPDF');
      
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getExportData');
      
      // Export PDF
      cy.get('[data-cy=export-pdf]').click();
      cy.wait('@exportPDF');
      
      // Should show success message
      cy.get('[data-cy=export-success]').should('be.visible');
      cy.get('[data-cy=export-success]').should('contain', 'Reporte PDF generado');
    });

    it('should export analytics to CSV', () => {
      // Mock CSV generation
      cy.intercept('GET', '/api/medico/pacientes/patient1/musica/export/csv', {
        statusCode: 200,
        headers: { 'content-type': 'text/csv' },
        body: 'Fecha,Canción,Emoción,Recuerdo,Nivel\n2024-01-01,Export Test Song,feliz,Test memory,claro\n'
      }).as('exportCSV');
      
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getExportData');
      
      // Export CSV
      cy.get('[data-cy=export-csv]').click();
      cy.wait('@exportCSV');
      
      // Should show success message
      cy.get('[data-cy=export-success]').should('be.visible');
      cy.get('[data-cy=export-success]').should('contain', 'Datos CSV exportados');
    });

    it('should generate comprehensive report', () => {
      // Mock comprehensive report
      cy.intercept('POST', '/api/medico/pacientes/patient1/musica/reporte', {
        body: {
          reportId: 'report123',
          downloadUrl: '/api/reports/report123/download'
        }
      }).as('generateReport');
      
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@getExportData');
      
      // Generate comprehensive report
      cy.get('[data-cy=generate-report]').click();
      
      // Should show report options
      cy.get('[data-cy=report-modal]').should('be.visible');
      
      // Select options and generate
      cy.get('[data-cy=include-charts]').check();
      cy.get('[data-cy=include-timeline]').check();
      cy.get('[data-cy=confirm-report]').click();
      cy.wait('@generateReport');
      
      // Should show success
      cy.get('[data-cy=report-success]').should('be.visible');
    });
  });

  describe('Comparative Analysis', () => {
    beforeEach(() => {
      // Mock multiple patients for comparison
      cy.intercept('GET', '/api/medico/pacientes', {
        body: [
          { _id: 'patient1', nombre: 'Juan Pérez' },
          { _id: 'patient2', nombre: 'María García' }
        ]
      }).as('getPatients');
      
      // Mock comparison data
      cy.intercept('POST', '/api/medico/musica/comparar', {
        body: {
          pacientes: [
            {
              pacienteId: 'patient1',
              nombre: 'Juan Pérez',
              estadisticas: {
                totalReacciones: 5,
                emocionMasFrecuente: 'feliz',
                promedioSemanal: 1.2
              }
            },
            {
              pacienteId: 'patient2',
              nombre: 'María García',
              estadisticas: {
                totalReacciones: 3,
                emocionMasFrecuente: 'neutral',
                promedioSemanal: 0.8
              }
            }
          ]
        }
      }).as('getComparison');
    });

    it('should compare multiple patients', () => {
      cy.visit('/medico/musica/comparar');
      cy.wait('@getPatients');
      
      // Select patients to compare
      cy.get('[data-cy=patient-checkbox-patient1]').check();
      cy.get('[data-cy=patient-checkbox-patient2]').check();
      
      // Generate comparison
      cy.get('[data-cy=compare-patients]').click();
      cy.wait('@getComparison');
      
      // Should show comparison results
      cy.get('[data-cy=comparison-results]').should('be.visible');
      cy.get('[data-cy=comparison-chart]').should('be.visible');
      
      // Should show patient comparisons
      cy.get('[data-cy=patient-comparison]').should('have.length', 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle patient loading errors', () => {
      // Mock error
      cy.intercept('GET', '/api/medico/pacientes', {
        statusCode: 500,
        body: { error: 'Error loading patients' }
      }).as('patientsError');
      
      cy.visit('/medico/musica');
      cy.wait('@patientsError');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'No se pudieron cargar los pacientes');
    });

    it('should handle analytics loading errors', () => {
      // Mock error
      cy.intercept('GET', '/api/medico/pacientes/patient1/musica/reacciones', {
        statusCode: 500,
        body: { error: 'Error loading analytics' }
      }).as('analyticsError');
      
      cy.visit('/medico/musica/paciente/patient1');
      cy.wait('@analyticsError');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'No se pudieron cargar las analíticas');
    });

    it('should handle export errors', () => {
      // Mock export error
      cy.intercept('GET', '/api/medico/pacientes/patient1/musica/export/pdf', {
        statusCode: 500,
        body: { error: 'Export failed' }
      }).as('exportError');
      
      cy.visit('/medico/musica/paciente/patient1');
      
      // Try to export
      cy.get('[data-cy=export-pdf]').click();
      cy.wait('@exportError');
      
      // Should show error message
      cy.get('[data-cy=export-error]').should('be.visible');
      cy.get('[data-cy=export-error]').should('contain', 'No se pudo generar el reporte');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/medico/musica');
      
      // Should adapt to mobile layout
      cy.get('[data-cy=analytics-header]').should('be.visible');
      cy.get('[data-cy=patient-selection]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/medico/musica');
      
      // Should adapt to tablet layout
      cy.get('[data-cy=analytics-header]').should('be.visible');
      cy.get('[data-cy=patient-selection]').should('be.visible');
    });
  });
});
