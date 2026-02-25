describe('Music Management - Cuidador', () => {
  beforeEach(() => {
    // Login as cuidador
    cy.visit('/login');
    cy.get('[data-cy=email]').type('cuidador@test.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=login-button]').click();
    
    // Wait for login to complete
    cy.url().should('not.include', '/login');
  });

  describe('Song Search', () => {
    it('should search for songs successfully', () => {
      cy.visit('/cuidador/musica');
      
      // Get search input and type query
      cy.get('[data-cy=search-input]').type('beatles');
      cy.get('[data-cy=search-button]').click();
      
      // Wait for results
      cy.get('[data-cy=search-results]').should('be.visible');
      cy.get('[data-cy=song-item]').should('have.length.greaterThan', 0);
      
      // Verify result structure
      cy.get('[data-cy=song-item]').first().within(() => {
        cy.get('[data-cy=song-title]').should('exist');
        cy.get('[data-cy=song-artist]').should('exist');
        cy.get('[data-cy=song-thumbnail]').should('exist');
      });
    });

    it('should show error for empty search', () => {
      cy.visit('/cuidador/musica');
      
      // Try to search without query
      cy.get('[data-cy=search-button]').click();
      
      // Should show error message
      cy.get('[data-cy=search-error]').should('be.visible');
      cy.get('[data-cy=search-error]').should('contain', 'término de búsqueda');
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/musica/buscar*', {
        statusCode: 500,
        body: { error: 'Error al buscar canciones' }
      }).as('searchError');
      
      cy.visit('/cuidador/musica');
      cy.get('[data-cy=search-input]').type('test');
      cy.get('[data-cy=search-button]').click();
      
      cy.wait('@searchError');
      cy.get('[data-cy=error-message]').should('be.visible');
    });
  });

  describe('Playlist Management', () => {
    beforeEach(() => {
      // Mock empty playlist
      cy.intercept('GET', '/api/cuidador/musica/playlist', {
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [],
          updatedAt: new Date().toISOString()
        }
      }).as('getPlaylist');
    });

    it('should display empty playlist initially', () => {
      cy.visit('/cuidador/musica');
      cy.wait('@getPlaylist');
      
      cy.get('[data-cy=empty-playlist]').should('be.visible');
      cy.get('[data-cy=empty-playlist]').should('contain', 'No hay canciones');
    });

    it('should add song to playlist', () => {
      // Mock search results
      cy.intercept('GET', '/api/musica/buscar*', {
        body: [
          {
            videoId: 'test123',
            titulo: 'Test Song',
            artista: 'Test Artist',
            thumbnail: 'http://test.com/thumb.jpg',
            descripcion: 'Test description'
          }
        ]
      }).as('searchResults');
      
      // Mock add to playlist
      cy.intercept('POST', '/api/cuidador/musica/playlist', {
        statusCode: 201,
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [
            {
              _id: 'song123',
              videoId: 'test123',
              titulo: 'Test Song',
              artista: 'Test Artist',
              thumbnail: 'http://test.com/thumb.jpg',
              duracion: '3:45',
              agregadoPor: 'cuidador123',
              fechaAgregado: new Date().toISOString()
            }
          ]
        }
      }).as('addToPlaylist');
      
      cy.visit('/cuidador/musica');
      cy.wait('@getPlaylist');
      
      // Search for song
      cy.get('[data-cy=search-input]').type('test');
      cy.get('[data-cy=search-button]').click();
      cy.wait('@searchResults');
      
      // Add first song to playlist
      cy.get('[data-cy=add-to-playlist]').first().click();
      cy.wait('@addToPlaylist');
      
      // Verify song was added
      cy.get('[data-cy=playlist-songs]').should('contain', 'Test Song');
      cy.get('[data-cy=playlist-songs]').should('contain', 'Test Artist');
    });

    it('should prevent duplicate songs', () => {
      // Mock playlist with existing song
      cy.intercept('GET', '/api/cuidador/musica/playlist', {
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [
            {
              _id: 'song123',
              videoId: 'duplicate123',
              titulo: 'Duplicate Song',
              artista: 'Test Artist'
            }
          ]
        }
      }).as('getPlaylistWithSong');
      
      // Mock duplicate error
      cy.intercept('POST', '/api/cuidador/musica/playlist', {
        statusCode: 409,
        body: { error: 'Esta canción ya está en la playlist' }
      }).as('duplicateError');
      
      cy.visit('/cuidador/musica');
      cy.wait('@getPlaylistWithSong');
      
      // Try to add duplicate song
      cy.get('[data-cy=search-input]').type('duplicate');
      cy.get('[data-cy=search-button]').click();
      cy.get('[data-cy=add-to-playlist]').first().click();
      cy.wait('@duplicateError');
      
      // Should show error message
      cy.get('[data-cy=duplicate-error]').should('be.visible');
      cy.get('[data-cy=duplicate-error]').should('contain', 'ya está en la playlist');
    });

    it('should remove song from playlist', () => {
      // Mock playlist with songs
      cy.intercept('GET', '/api/cuidador/musica/playlist', {
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [
            {
              _id: 'song123',
              videoId: 'removetest123',
              titulo: 'Remove Test Song',
              artista: 'Test Artist'
            }
          ]
        }
      }).as('getPlaylistWithSong');
      
      // Mock remove song
      cy.intercept('DELETE', '/api/cuidador/musica/playlist/removetest123', {
        body: {
          message: 'Canción eliminada correctamente',
          playlist: {
            _id: 'playlist123',
            pacienteId: 'patient123',
            canciones: []
          }
        }
      }).as('removeSong');
      
      cy.visit('/cuidador/musica');
      cy.wait('@getPlaylistWithSong');
      
      // Remove song
      cy.get('[data-cy=remove-song]').click();
      cy.wait('@removeSong');
      
      // Verify song was removed
      cy.get('[data-cy=empty-playlist]').should('be.visible');
    });

    it('should show confirmation dialog before removing song', () => {
      // Mock playlist with songs
      cy.intercept('GET', '/api/cuidador/musica/playlist', {
        body: {
          _id: 'playlist123',
          pacienteId: 'patient123',
          canciones: [
            {
              _id: 'song123',
              videoId: 'confirm123',
              titulo: 'Confirm Test Song',
              artista: 'Test Artist'
            }
          ]
        }
      }).as('getPlaylistWithSong');
      
      cy.visit('/cuidador/musica');
      cy.wait('@getPlaylistWithSong');
      
      // Click remove button
      cy.get('[data-cy=remove-song]').click();
      
      // Should show confirmation dialog
      cy.get('[data-cy=confirm-dialog]').should('be.visible');
      cy.get('[data-cy=confirm-dialog]').should('contain', '¿Estás seguro?');
      
      // Cancel should close dialog
      cy.get('[data-cy=cancel-remove]').click();
      cy.get('[data-cy=confirm-dialog]').should('not.exist');
      
      // Confirm should proceed with removal
      cy.get('[data-cy=remove-song]').click();
      cy.get('[data-cy=confirm-remove]').click();
    });
  });

  describe('Patient Reactions View', () => {
    beforeEach(() => {
      // Mock patient reactions
      cy.intercept('GET', '/api/cuidador/musica/reacciones', {
        body: [
          {
            _id: 'reaction1',
            pacienteId: 'patient123',
            videoId: 'test1',
            tituloCancion: 'Test Song 1',
            artistaCancion: 'Test Artist 1',
            emocion: 'feliz',
            recuerdo: 'This reminds me of good times',
            nivelRecuerdo: 'claro',
            notasCuidador: '',
            revisadoPorMedico: false,
            createdAt: new Date().toISOString()
          },
          {
            _id: 'reaction2',
            pacienteId: 'patient123',
            videoId: 'test2',
            tituloCancion: 'Test Song 2',
            artistaCancion: 'Test Artist 2',
            emocion: 'triste',
            recuerdo: 'This makes me feel nostalgic',
            nivelRecuerdo: 'vago',
            notasCuidador: 'Patient seemed emotional',
            revisadoPorMedico: false,
            createdAt: new Date().toISOString()
          }
        ]
      }).as('getReactions');
    });

    it('should display patient reactions', () => {
      cy.visit('/cuidador/musica/reacciones');
      cy.wait('@getReactions');
      
      // Should show reactions
      cy.get('[data-cy=reaction-item]').should('have.length', 2);
      
      // Verify first reaction
      cy.get('[data-cy=reaction-item]').first().within(() => {
        cy.get('[data-cy=song-title]').should('contain', 'Test Song 1');
        cy.get('[data-cy=emotion-badge]').should('contain', 'feliz');
        cy.get('[data-cy=memory-text]').should('contain', 'good times');
        cy.get('[data-cy=memory-level]').should('contain', 'claro');
      });
    });

    it('should add caregiver note to reaction', () => {
      // Mock update reaction
      cy.intercept('PATCH', '/api/cuidador/musica/reacciones/reaction1/nota', {
        body: {
          _id: 'reaction1',
          notasCuidador: 'El paciente pareció muy contento'
        }
      }).as('addNote');
      
      cy.visit('/cuidador/musica/reacciones');
      cy.wait('@getReactions');
      
      // Add note to first reaction
      cy.get('[data-cy=add-note]').first().click();
      cy.get('[data-cy=note-textarea]').type('El paciente pareció muy contento');
      cy.get('[data-cy=save-note]').click();
      cy.wait('@addNote');
      
      // Verify note was added
      cy.get('[data-cy=caregiver-note]').first().should('contain', 'El paciente pareció muy contento');
    });

    it('should filter reactions by emotion', () => {
      cy.visit('/cuidador/musica/reacciones');
      cy.wait('@getReactions');
      
      // Filter by "feliz" emotion
      cy.get('[data-cy=emotion-filter]').select('feliz');
      
      // Should only show happy reactions
      cy.get('[data-cy=reaction-item]').should('have.length', 1);
      cy.get('[data-cy=reaction-item]').first().find('[data-cy=emotion-badge]').should('contain', 'feliz');
    });

    it('should sort reactions by date', () => {
      cy.visit('/cuidador/musica/reacciones');
      cy.wait('@getReactions');
      
      // Sort by newest first
      cy.get('[data-cy=sort-select]').select('newest');
      
      // Verify order (newest should be first)
      cy.get('[data-cy=reaction-item]').first().should('contain', 'Test Song 1');
      
      // Sort by oldest first
      cy.get('[data-cy=sort-select]').select('oldest');
      
      // Verify order (oldest should be first)
      cy.get('[data-cy=reaction-item]').first().should('contain', 'Test Song 2');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/cuidador/musica');
      
      // Should adapt to mobile layout
      cy.get('[data-cy=music-header]').should('be.visible');
      cy.get('[data-cy=search-section]').should('be.visible');
      cy.get('[data-cy=playlist-section]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/cuidador/musica');
      
      // Should adapt to tablet layout
      cy.get('[data-cy=music-header]').should('be.visible');
      cy.get('[data-cy=search-section]').should('be.visible');
      cy.get('[data-cy=playlist-section]').should('be.visible');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during search', () => {
      // Mock delayed search
      cy.intercept('GET', '/api/musica/buscar*', {
        delay: 1000,
        body: []
      }).as('delayedSearch');
      
      cy.visit('/cuidador/musica');
      cy.get('[data-cy=search-input]').type('test');
      cy.get('[data-cy=search-button]').click();
      
      // Should show loading state
      cy.get('[data-cy=search-loading]').should('be.visible');
      
      cy.wait('@delayedSearch');
      cy.get('[data-cy=search-loading]').should('not.exist');
    });

    it('should show loading state when adding songs', () => {
      // Mock delayed add to playlist
      cy.intercept('POST', '/api/cuidador/musica/playlist', {
        delay: 1000,
        statusCode: 201,
        body: { canciones: [] }
      }).as('delayedAdd');
      
      cy.visit('/cuidador/musica');
      cy.get('[data-cy=search-input]').type('test');
      cy.get('[data-cy=search-button]').click();
      
      // Add song (mock search result first)
      cy.intercept('GET', '/api/musica/buscar*', {
        body: [{ videoId: 'test', titulo: 'Test' }]
      }).as('quickSearch');
      
      cy.wait('@quickSearch');
      cy.get('[data-cy=add-to-playlist]').first().click();
      
      // Should show loading state
      cy.get('[data-cy=add-loading]').should('be.visible');
      
      cy.wait('@delayedAdd');
      cy.get('[data-cy=add-loading]').should('not.exist');
    });
  });
});
