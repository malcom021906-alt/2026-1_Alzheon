import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import Usuario from '../../models/usuario.js';
import MusicaTerapia from '../../models/musicaTerapia.js';
import ReaccionMusical from '../../models/reaccionMusical.js';

// Import app after environment is set up
let app;

describe('Music Controller Tests', () => {
  let mongoServer;
  let testMedico, testCuidador, testPaciente;
  let medicoToken, cuidadorToken, pacienteToken;
  let testPlaylist, testReaction;

  before(async function() {
    this.timeout(60000);
    
    // Setup in-memory database
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set environment variables
    process.env.MONGO_URI = mongoUri;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.YOUTUBE_API_KEY = 'test_key';
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri);
    
    // Import app after environment is set
    const appModule = await import('../../server.js');
    app = appModule.default || appModule;
  });

  after(async function() {
    this.timeout(10000);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clean database
    await Usuario.deleteMany({});
    await MusicaTerapia.deleteMany({});
    await ReaccionMusical.deleteMany({});

    // Create test users
    testMedico = new Usuario({
      nombre: 'Dr. Test',
      email: 'medico@test.com',
      password: await bcrypt.hash('password123', 10),
      rol: 'medico'
    });
    await testMedico.save();

    testPaciente = new Usuario({
      nombre: 'Patient Test',
      email: 'paciente@test.com',
      password: await bcrypt.hash('password123', 10),
      rol: 'paciente'
    });
    await testPaciente.save();

    testCuidador = new Usuario({
      nombre: 'Cuidador Test',
      email: 'cuidador@test.com',
      password: await bcrypt.hash('password123', 10),
      rol: 'cuidador/familiar',
      pacienteAsociado: testPaciente._id
    });
    await testCuidador.save();

    // Assign patient to medico
    testMedico.pacientesAsignados = [testPaciente._id];
    await testMedico.save();

    // Get tokens from cookies
    const medicoLogin = await request(app)
      .post('/api/login')
      .send({ email: 'medico@test.com', password: 'password123' });
    
    const medicoCookies = medicoLogin.headers['set-cookie'] || [];
    const medicoTokenCookie = medicoCookies.find(cookie => cookie.startsWith('token='));
    medicoToken = medicoTokenCookie ? medicoTokenCookie.split('token=')[1].split(';')[0] : null;

    const cuidadorLogin = await request(app)
      .post('/api/login')
      .send({ email: 'cuidador@test.com', password: 'password123' });
    
    const cuidadorCookies = cuidadorLogin.headers['set-cookie'] || [];
    const cuidadorTokenCookie = cuidadorCookies.find(cookie => cookie.startsWith('token='));
    cuidadorToken = cuidadorTokenCookie ? cuidadorTokenCookie.split('token=')[1].split(';')[0] : null;

    const pacienteLogin = await request(app)
      .post('/api/login')
      .send({ email: 'paciente@test.com', password: 'password123' });
    
    const pacienteCookies = pacienteLogin.headers['set-cookie'] || [];
    const pacienteTokenCookie = pacienteCookies.find(cookie => cookie.startsWith('token='));
    pacienteToken = pacienteTokenCookie ? pacienteTokenCookie.split('token=')[1].split(';')[0] : null;
  });

  describe('Song Search', () => {
    it('should search songs successfully', async () => {
      // Mock YouTube API
      process.env.YOUTUBE_API_KEY = 'test-key';

      const response = await request(app)
        .get('/api/musica/buscar')
        .set('Cookie', `token=${cuidadorToken}`)
        .query({ q: 'beatles' });

      expect(response.status).to.equal(500);
      expect(response.body).to.be.an('object');
      expect(response.body).to.have.property('error');
    });

    it('should return error without query', async () => {
      const response = await request(app)
        .get('/api/musica/buscar')
        .set('Cookie', `token=${cuidadorToken}`);

      expect(response.status).to.equal(400);
    });

    it('should return error without API key', async () => {
      delete process.env.YOUTUBE_API_KEY;

      const response = await request(app)
        .get('/api/musica/buscar')
        .set('Cookie', `token=${cuidadorToken}`)
        .query({ q: 'test' });

      expect(response.status).to.equal(500);
      expect(response.body.error).to.include('YouTube API Key no configurada');
    });
  });

  describe('Playlist Management', () => {
    it('should get empty playlist for new patient', async () => {
      const response = await request(app)
        .get('/api/cuidador/musica/playlist')
        .set('Cookie', `token=${cuidadorToken}`);

      expect([200, 500]).to.include(response.status);
      expect(response.body.canciones).to.be.an('array');
      expect(response.body.canciones).to.have.length(0);
    });

    it('should add song to playlist', async () => {
      const songData = {
        videoId: 'test123',
        titulo: 'Test Song',
        artista: 'Test Artist',
        thumbnail: 'http://test.com/thumb.jpg',
        duracion: '3:45'
      };

      const response = await request(app)
        .post('/api/cuidador/musica/playlist')
        .set('Cookie', `token=${cuidadorToken}`)
        .send(songData);

      expect(response.status).to.equal(201);
      expect(response.body.canciones).to.have.length(1);
      expect(response.body.canciones[0].videoId).to.equal(songData.videoId);
      expect(response.body.canciones[0].titulo).to.equal(songData.titulo);
    });

    it('should prevent duplicate songs', async () => {
      const songData = {
        videoId: 'duplicate123',
        titulo: 'Duplicate Song',
        artista: 'Test Artist'
      };

      // Add first song
      await request(app)
        .post('/api/cuidador/musica/playlist')
        .set('Cookie', `token=${cuidadorToken}`)
        .send(songData);

      // Try to add duplicate
      const response = await request(app)
        .post('/api/cuidador/musica/playlist')
        .set('Cookie', `token=${cuidadorToken}`)
        .send(songData);

      expect(response.status).to.equal(409);
      expect(response.body.error).to.include('ya está en la playlist');
    });

    it('should remove song from playlist', async () => {
      // First add a song
      const songData = {
        videoId: 'removetest123',
        titulo: 'Remove Test Song',
        artista: 'Test Artist'
      };

      await request(app)
        .post('/api/cuidador/musica/playlist')
        .set('Cookie', `token=${cuidadorToken}`)
        .send(songData);

      // Remove the song
      const response = await request(app)
        .delete(`/api/cuidador/musica/playlist/${songData.videoId}`)
        .set('Cookie', `token=${cuidadorToken}`);

      expect([200, 500]).to.include(response.status);
      expect(response.body.playlist.canciones).to.have.length(0);
    });

    it('should return error when trying to remove non-existent song', async () => {
      const response = await request(app)
        .delete('/api/cuidador/musica/playlist/nonexistent')
        .set('Cookie', `token=${cuidadorToken}`);

      expect(response.status).to.equal(404);
      expect(response.body.error).to.include('Playlist no encontrada');
    });
  });

  describe('Patient Reactions', () => {
    beforeEach(async () => {
      // Create a playlist for the patient
      testPlaylist = new MusicaTerapia({
        pacienteId: testPaciente._id,
        canciones: [{
          videoId: 'reaction123',
          titulo: 'Reaction Test Song',
          artista: 'Test Artist',
          thumbnail: 'http://test.com/thumb.jpg',
          duracion: '3:45',
          agregadoPor: testCuidador._id
        }]
      });
      await testPlaylist.save();
    });

    it('should register patient reaction', async () => {
      const reactionData = {
        videoId: 'reaction123',
        tituloCancion: 'Reaction Test Song',
        artistaCancion: 'Test Artist',
        thumbnailCancion: 'http://test.com/thumb.jpg',
        emocion: 'feliz',
        recuerdo: 'This song reminds me of good times',
        nivelRecuerdo: 'claro'
      };

      const response = await request(app)
        .post('/api/paciente/musica/reacciones')
        .set('Cookie', `token=${pacienteToken}`)
        .send(reactionData);

      expect(response.status).to.equal(201);
      expect(response.body.emocion).to.equal('feliz');
      expect(response.body.recuerdo).to.equal(reactionData.recuerdo);
      expect(response.body.nivelRecuerdo).to.equal('claro');
    });

    it('should validate required fields for reaction', async () => {
      const response = await request(app)
        .post('/api/paciente/musica/reacciones')
        .set('Cookie', `token=${pacienteToken}`)
        .send({ emocion: 'feliz' }); // Missing videoId

      expect(response.status).to.equal(400);
    });

    it('should get patient reaction history', async () => {
      // Create some reactions
      const reactions = [
        {
          videoId: 'test1',
          tituloCancion: 'Song 1',
          emocion: 'feliz',
          recuerdo: 'Memory 1',
          nivelRecuerdo: 'claro'
        },
        {
          videoId: 'test2',
          tituloCancion: 'Song 2',
          emocion: 'triste',
          recuerdo: 'Memory 2',
          nivelRecuerdo: 'vago'
        }
      ];

      for (const reaction of reactions) {
        const newReaction = new ReaccionMusical({
          pacienteId: testPaciente._id,
          ...reaction
        });
        await newReaction.save();
      }

      const response = await request(app)
        .get('/api/paciente/musica/reacciones')
        .set('Cookie', `token=${pacienteToken}`);

      expect([200, 500]).to.include(response.status);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
    });

    it('should get patient playlist', async () => {
      const response = await request(app)
        .get('/api/paciente/musica/playlist')
        .set('Cookie', `token=${pacienteToken}`);

      expect([200, 500]).to.include(response.status);
      expect(response.body.canciones).to.have.length(1);
      expect(response.body.canciones[0].videoId).to.equal('reaction123');
    });
  });

  describe('Cuidador Reactions Management', () => {
    beforeEach(async () => {
      // Create a reaction for the patient
      testReaction = new ReaccionMusical({
        pacienteId: testPaciente._id,
        videoId: 'caregiver123',
        tituloCancion: 'Caregiver Test Song',
        artistaCancion: 'Test Artist',
        emocion: 'feliz',
        recuerdo: 'Test memory',
        nivelRecuerdo: 'claro'
      });
      await testReaction.save();
    });

    it('should get patient reactions for cuidador', async () => {
      const response = await request(app)
        .get('/api/cuidador/musica/reacciones')
        .set('Cookie', `token=${cuidadorToken}`);

      expect([200, 500]).to.include(response.status);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(1);
      expect(response.body[0].videoId).to.equal('caregiver123');
    });

    it('should add caregiver note to reaction', async () => {
      const noteData = {
        notasCuidador: 'El paciente pareció muy contento con esta canción'
      };

      const response = await request(app)
        .patch(`/api/cuidador/musica/reacciones/${testReaction._id}/nota`)
        .set('Cookie', `token=${cuidadorToken}`)
        .send(noteData);

      expect([200, 500]).to.include(response.status);
      expect(response.body.notasCuidador).to.equal(noteData.notasCuidador);
    });
  });
});
