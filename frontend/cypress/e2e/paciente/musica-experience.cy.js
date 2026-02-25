describe('Music Experience - Paciente', () => {
  beforeEach(() => {
    // Login as paciente
    cy.visit('/login');
    cy.get('[data-cy=email]').type('paciente@test.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=login-button]').click();
    
    // Wait for login to complete
    cy.url().should('not.include', '/login');
  });

  describe('Playlist View', () => {
    beforeEach(() => {
      // Mock patient playlist
      cy.intercept('GET', '/api/paciente/musica/playlist', {
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [
            {
              _id: 'song1',
              videoId: 'test123',
              titulo: 'Test Song 1',
              artista: 'Test Artist 1',
              thumbnail: 'http://test.com/thumb1.jpg',
              duracion: '3:45',
              agregadoPor: 'cuidador123',
              fechaAgregado: new Date().toISOString()
            },
            {
              _id: 'song2',
              videoId: 'test456',
              titulo: 'Test Song 2',
              artista: 'Test Artist 2',
              thumbnail: 'http://test.com/thumb2.jpg',
              duracion: '4:20',
              agregadoPor: 'cuidador123',
              fechaAgregado: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        }
      }).as('getPlaylist');
    });

    it('should display patient playlist', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Should show playlist header
      cy.get('[data-cy=playlist-header]').should('be.visible');
      cy.get('[data-cy=playlist-header]').should('contain', 'Mi Música');
      
      // Should show songs
      cy.get('[data-cy=song-item]').should('have.length', 2);
      
      // Verify first song
      cy.get('[data-cy=song-item]').first().within(() => {
        cy.get('[data-cy=song-title]').should('contain', 'Test Song 1');
        cy.get('[data-cy=song-artist]').should('contain', 'Test Artist 1');
        cy.get('[data-cy=song-duration]').should('contain', '3:45');
        cy.get('[data-cy=song-thumbnail]').should('have.attr', 'src', 'http://test.com/thumb1.jpg');
      });
    });

    it('should show empty state when no songs', () => {
      // Mock empty playlist
      cy.intercept('GET', '/api/paciente/musica/playlist', {
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [],
          updatedAt: new Date().toISOString()
        }
      }).as('getEmptyPlaylist');
      
      cy.visit('/paciente/musica');
      cy.wait('@getEmptyPlaylist');
      
      // Should show empty state
      cy.get('[data-cy=empty-playlist]').should('be.visible');
      cy.get('[data-cy=empty-playlist]').should('contain', 'No hay canciones');
      cy.get('[data-cy=empty-playlist]').should('contain', 'Tu cuidador agregará música para ti');
    });

    it('should play songs when clicked', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Click on first song
      cy.get('[data-cy=song-item]').first().click();
      
      // Should show player
      cy.get('[data-cy=music-player]').should('be.visible');
      cy.get('[data-cy=now-playing]').should('contain', 'Test Song 1');
      cy.get('[data-cy=play-button]').should('have.attr', 'aria-label', 'Pausar');
      
      // Should show reaction prompt
      cy.get('[data-cy=reaction-prompt]').should('be.visible');
    });

    it('should control music playback', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Start playing
      cy.get('[data-cy=song-item]').first().click();
      cy.get('[data-cy=music-player]').should('be.visible');
      
      // Pause
      cy.get('[data-cy=play-button]').click();
      cy.get('[data-cy=play-button]').should('have.attr', 'aria-label', 'Reproducir');
      
      // Play again
      cy.get('[data-cy=play-button]').click();
      cy.get('[data-cy=play-button]').should('have.attr', 'aria-label', 'Pausar');
      
      // Next song
      cy.get('[data-cy=next-button]').click();
      cy.get('[data-cy=now-playing]').should('contain', 'Test Song 2');
      
      // Previous song
      cy.get('[data-cy=previous-button]').click();
      cy.get('[data-cy=now-playing]').should('contain', 'Test Song 1');
    });

    it('should show progress bar and time', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Start playing
      cy.get('[data-cy=song-item]').first().click();
      
      // Should show progress
      cy.get('[data-cy=progress-bar]').should('be.visible');
      cy.get('[data-cy=current-time]').should('be.visible');
      cy.get('[data-cy=total-time]').should('contain', '3:45');
    });
  });

  describe('Reaction Registration', () => {
    beforeEach(() => {
      // Mock playlist for reaction testing
      cy.intercept('GET', '/api/paciente/musica/playlist', {
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [
            {
              _id: 'song1',
              videoId: 'reaction123',
              titulo: 'Reaction Test Song',
              artista: 'Test Artist',
              thumbnail: 'http://test.com/thumb.jpg',
              duracion: '3:45'
            }
          ]
        }
      }).as('getPlaylist');
    });

    it('should show reaction options when song is playing', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Start playing song
      cy.get('[data-cy=song-item]').first().click();
      
      // Should show reaction options
      cy.get('[data-cy=reaction-section]').should('be.visible');
      cy.get('[data-cy=emotion-options]').should('be.visible');
      
      // Should have all emotion options
      cy.get('[data-cy=emotion-option]').should('have.length', 6);
      cy.get('[data-cy=emotion-muy_feliz]').should('exist');
      cy.get('[data-cy=emotion-feliz]').should('exist');
      cy.get('[data-cy=emotion-neutral]').should('exist');
      cy.get('[data-cy=emotion-triste]').should('exist');
      cy.get('[data-cy=emotion-ansioso]').should('exist');
      cy.get('[data-cy=emotion-sin_reaccion]').should('exist');
    });

    it('should register emotional reaction', () => {
      // Mock successful reaction submission
      cy.intercept('POST', '/api/paciente/musica/reacciones', {
        statusCode: 201,
        body: {
          _id: 'reaction123',
          pacienteId: 'patient123',
          videoId: 'reaction123',
          tituloCancion: 'Reaction Test Song',
          artistaCancion: 'Test Artist',
          emocion: 'feliz',
          recuerdo: 'This song reminds me of good times',
          nivelRecuerdo: 'claro',
          createdAt: new Date().toISOString()
        }
      }).as('submitReaction');
      
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Start playing song
      cy.get('[data-cy=song-item]').first().click();
      
      // Select emotion
      cy.get('[data-cy=emotion-feliz]').click();
      
      // Add memory
      cy.get('[data-cy=memory-textarea]').type('This song reminds me of good times');
      
      // Select memory level
      cy.get('[data-cy=memory-level]').select('claro');
      
      // Submit reaction
      cy.get('[data-cy=submit-reaction]').click();
      cy.wait('@submitReaction');
      
      // Should show success message
      cy.get('[data-cy=reaction-success]').should('be.visible');
      cy.get('[data-cy=reaction-success]').should('contain', '¡Gracias por compartir!');
      
      // Should reset form
      cy.get('[data-cy=emotion-feliz]').should('not.have.class', 'selected');
      cy.get('[data-cy=memory-textarea]').should('be.empty');
      cy.get('[data-cy=memory-level]').should('have.value', 'ninguno');
    });

    it('should validate required fields', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Start playing song
      cy.get('[data-cy=song-item]').first().click();
      
      // Try to submit without emotion
      cy.get('[data-cy=submit-reaction]').click();
      
      // Should show validation error
      cy.get('[data-cy=validation-error]').should('be.visible');
      cy.get('[data-cy=validation-error]').should('contain', 'Debes seleccionar una emoción');
      
      // Select emotion but leave memory empty (should be allowed)
      cy.get('[data-cy=emotion-feliz]').click();
      cy.get('[data-cy=submit-reaction]').click();
      
      // Should not show memory validation error (it's optional)
      cy.get('[data-cy=validation-error]').should('not.contain', 'recuerdo');
    });

    it('should allow skipping reaction', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Start playing song
      cy.get('[data-cy=song-item]').first().click();
      
      // Skip reaction
      cy.get('[data-cy=skip-reaction]').click();
      
      // Should hide reaction section
      cy.get('[data-cy=reaction-section]').should('not.exist');
      
      // Should continue playing music
      cy.get('[data-cy=music-player]').should('be.visible');
    });

    it('should show emotion descriptions on hover', () => {
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Start playing song
      cy.get('[data-cy=song-item]').first().click();
      
      // Hover over emotion option
      cy.get('[data-cy=emotion-feliz]').trigger('mouseover');
      
      // Should show tooltip
      cy.get('[data-cy=emotion-tooltip]').should('be.visible');
      cy.get('[data-cy=emotion-tooltip]').should('contain', 'Me siento feliz y contento');
      
      // Hide tooltip on mouseout
      cy.get('[data-cy=emotion-feliz]').trigger('mouseout');
      cy.get('[data-cy=emotion-tooltip]').should('not.exist');
    });
  });

  describe('Reaction History', () => {
    beforeEach(() => {
      // Mock reaction history
      cy.intercept('GET', '/api/paciente/musica/reacciones', {
        body: [
          {
            _id: 'reaction1',
            pacienteId: 'patient123',
            videoId: 'test1',
            tituloCancion: 'Memory Song 1',
            artistaCancion: 'Artist 1',
            emocion: 'feliz',
            recuerdo: 'This reminds me of my childhood',
            nivelRecuerdo: 'muy_claro',
            notasCuidador: 'Patient was smiling',
            revisadoPorMedico: false,
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          {
            _id: 'reaction2',
            pacienteId: 'patient123',
            videoId: 'test2',
            tituloCancion: 'Memory Song 2',
            artistaCancion: 'Artist 2',
            emocion: 'triste',
            recuerdo: 'This makes me feel nostalgic',
            nivelRecuerdo: 'claro',
            notasCuidador: '',
            revisadoPorMedico: false,
            createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
          }
        ]
      }).as('getReactions');
    });

    it('should display reaction history', () => {
      cy.visit('/paciente/musica/historial');
      cy.wait('@getReactions');
      
      // Should show history header
      cy.get('[data-cy=history-header]').should('be.visible');
      cy.get('[data-cy=history-header]').should('contain', 'Mis Reacciones');
      
      // Should show reactions
      cy.get('[data-cy=reaction-item]').should('have.length', 2);
      
      // Verify first reaction (newest)
      cy.get('[data-cy=reaction-item]').first().within(() => {
        cy.get('[data-cy=song-title]').should('contain', 'Memory Song 1');
        cy.get('[data-cy=emotion-badge]').should('contain', 'feliz');
        cy.get('[data-cy=memory-text]').should('contain', 'childhood');
        cy.get('[data-cy=memory-level]').should('contain', 'muy claro');
        cy.get('[data-cy=reaction-date]').should('contain', 'hace 1 día');
        cy.get('[data-cy=caregiver-note]').should('contain', 'Patient was smiling');
      });
    });

    it('should show empty state when no reactions', () => {
      // Mock empty reactions
      cy.intercept('GET', '/api/paciente/musica/reacciones', {
        body: []
      }).as('getEmptyReactions');
      
      cy.visit('/paciente/musica/historial');
      cy.wait('@getEmptyReactions');
      
      // Should show empty state
      cy.get('[data-cy=empty-history]').should('be.visible');
      cy.get('[data-cy=empty-history]').should('contain', 'No tienes reacciones registradas');
    });

    it('should filter reactions by emotion', () => {
      cy.visit('/paciente/musica/historial');
      cy.wait('@getReactions');
      
      // Filter by "feliz" emotion
      cy.get('[data-cy=emotion-filter]').select('feliz');
      
      // Should only show happy reactions
      cy.get('[data-cy=reaction-item]').should('have.length', 1);
      cy.get('[data-cy=reaction-item]').first().find('[data-cy=emotion-badge]').should('contain', 'feliz');
      
      // Filter by "triste" emotion
      cy.get('[data-cy=emotion-filter]').select('triste');
      
      // Should only show sad reactions
      cy.get('[data-cy=reaction-item]').should('have.length', 1);
      cy.get('[data-cy=reaction-item]').first().find('[data-cy=emotion-badge]').should('contain', 'triste');
    });

    it('should sort reactions by date', () => {
      cy.visit('/paciente/musica/historial');
      cy.wait('@getReactions');
      
      // Should be sorted by newest first by default
      cy.get('[data-cy=reaction-item]').first().should('contain', 'Memory Song 1');
      cy.get('[data-cy=reaction-item]').last().should('contain', 'Memory Song 2');
      
      // Sort by oldest first
      cy.get('[data-cy=sort-select]').select('oldest');
      
      // Should reverse order
      cy.get('[data-cy=reaction-item]').first().should('contain', 'Memory Song 2');
      cy.get('[data-cy=reaction-item]').last().should('contain', 'Memory Song 1');
    });
  });

  describe('Navigation and Accessibility', () => {
    it('should navigate between music sections', () => {
      cy.visit('/paciente/musica');
      
      // Go to history
      cy.get('[data-cy=history-link]').click();
      cy.url().should('include', '/historial');
      
      // Go back to playlist
      cy.get('[data-cy=playlist-link]').click();
      cy.url().should('not.include', '/historial');
    });

    it('should be keyboard navigable', () => {
      cy.visit('/paciente/musica');
      
      // Tab through elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'playlist-header');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'song-item');
      
      // Enter to play song
      cy.focused().type('{enter}');
      cy.get('[data-cy=music-player]').should('be.visible');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/paciente/musica');
      
      // Check ARIA labels
      cy.get('[data-cy=song-item]').should('have.attr', 'role', 'button');
      cy.get('[data-cy=emotion-option]').should('have.attr', 'role', 'button');
      cy.get('[data-cy=play-button]').should('have.attr', 'aria-label');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/paciente/musica');
      
      // Should adapt to mobile layout
      cy.get('[data-cy=music-header]').should('be.visible');
      cy.get('[data-cy=song-list]').should('be.visible');
      
      // Mobile player should be bottom-fixed
      cy.get('[data-cy=song-item]').first().click();
      cy.get('[data-cy=music-player]').should('have.class', 'mobile-fixed');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/paciente/musica');
      
      // Should adapt to tablet layout
      cy.get('[data-cy=music-header]').should('be.visible');
      cy.get('[data-cy=song-list]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle playlist loading errors', () => {
      // Mock error
      cy.intercept('GET', '/api/paciente/musica/playlist', {
        statusCode: 500,
        body: { error: 'Error loading playlist' }
      }).as('playlistError');
      
      cy.visit('/paciente/musica');
      cy.wait('@playlistError');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'No se pudo cargar tu música');
    });

    it('should handle reaction submission errors', () => {
      // Mock error
      cy.intercept('POST', '/api/paciente/musica/reacciones', {
        statusCode: 400,
        body: { error: 'Invalid emotion' }
      }).as('reactionError');
      
      cy.visit('/paciente/musica');
      cy.wait('@getPlaylist');
      
      // Try to submit reaction
      cy.get('[data-cy=song-item]').first().click();
      cy.get('[data-cy=emotion-feliz]').click();
      cy.get('[data-cy=submit-reaction]').click();
      cy.wait('@reactionError');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'No se pudo guardar tu reacción');
    });
  });
});
