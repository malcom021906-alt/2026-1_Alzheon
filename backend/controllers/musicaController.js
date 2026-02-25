import axios from 'axios';
import Usuario from '../models/usuario.js';
import MusicaTerapia from '../models/musicaTerapia.js';
import ReaccionMusical from '../models/reaccionMusical.js';

// ─────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────

/**
 * Obtiene el pacienteId asociado a un cuidador autenticado.
 * Lanza un error si no tiene paciente asociado.
 */
const getPacienteIdDeCuidador = async (cuidadorId) => {
    const cuidador = await Usuario.findById(cuidadorId);
    if (!cuidador || cuidador.rol !== 'cuidador/familiar') {
        throw { status: 403, message: 'No autorizado' };
    }
    if (!cuidador.pacienteAsociado) {
        throw { status: 404, message: 'No tienes un paciente asociado' };
    }
    return cuidador.pacienteAsociado;
};

/**
 * Obtiene o crea la playlist de un paciente.
 */
const getOrCreatePlaylist = async (pacienteId) => {
    let playlist = await MusicaTerapia.findOne({ pacienteId });
    if (!playlist) {
        playlist = new MusicaTerapia({ pacienteId, canciones: [] });
        await playlist.save();
    }
    return playlist;
};

// ─────────────────────────────────────────────
// BÚSQUEDA — CUIDADOR
// ─────────────────────────────────────────────

/**
 * GET /api/musica/buscar?q=<query>
 * Busca canciones/videos en YouTube Data API v3.
 */
export const buscarCanciones = async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Debes proporcionar un término de búsqueda' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'YouTube API Key no configurada en el servidor' });
    }

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: `${q} música`,
                type: 'video',
                videoCategoryId: '10', // categoría "Music"
                maxResults: 12,
                key: apiKey,
                relevanceLanguage: 'es',
                safeSearch: 'strict'
            }
        });

        const resultados = response.data.items.map(item => ({
            videoId: item.id.videoId,
            titulo: item.snippet.title,
            artista: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url || '',
            descripcion: item.snippet.description
        }));

        res.json(resultados);
    } catch (error) {
        const errorData = error.response?.data?.error;
        console.error('Error buscando en YouTube:', errorData || error.message);

        if (errorData?.message?.includes('API key')) {
            return res.status(500).json({ error: 'Configuración de servidor incompleta: YouTube API Key inválida o no configurada.' });
        }

        res.status(500).json({ error: 'Error al buscar canciones en YouTube' });
    }
};

// ─────────────────────────────────────────────
// GESTIÓN DE PLAYLIST — CUIDADOR
// ─────────────────────────────────────────────

/**
 * GET /api/cuidador/musica/playlist
 * Retorna la playlist del paciente asociado al cuidador.
 */
export const getPlaylist = async (req, res) => {
    try {
        const pacienteId = await getPacienteIdDeCuidador(req.usuario._id);
        const playlist = await getOrCreatePlaylist(pacienteId);
        res.json(playlist);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

/**
 * POST /api/cuidador/musica/playlist
 * Agrega una canción a la playlist del paciente.
 * Body: { videoId, titulo, artista, thumbnail, duracion }
 */
export const agregarCancion = async (req, res) => {
    try {
        const pacienteId = await getPacienteIdDeCuidador(req.usuario._id);
        const { videoId, titulo, artista, thumbnail, duracion } = req.body;

        if (!videoId || !titulo) {
            return res.status(400).json({ error: 'videoId y titulo son requeridos' });
        }

        const playlist = await getOrCreatePlaylist(pacienteId);

        // Evitar duplicados por videoId
        const yaExiste = playlist.canciones.some(c => c.videoId === videoId);
        if (yaExiste) {
            return res.status(409).json({ error: 'Esta canción ya está en la playlist' });
        }

        playlist.canciones.push({
            videoId,
            titulo,
            artista: artista || 'Desconocido',
            thumbnail: thumbnail || '',
            duracion: duracion || '',
            agregadoPor: req.usuario._id
        });

        await playlist.save();
        res.status(201).json(playlist);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

/**
 * DELETE /api/cuidador/musica/playlist/:videoId
 * Elimina una canción de la playlist del paciente.
 */
export const eliminarCancion = async (req, res) => {
    try {
        const pacienteId = await getPacienteIdDeCuidador(req.usuario._id);
        const { videoId } = req.params;

        const playlist = await MusicaTerapia.findOne({ pacienteId });
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }

        const longitudAntes = playlist.canciones.length;
        playlist.canciones = playlist.canciones.filter(c => c.videoId !== videoId);

        if (playlist.canciones.length === longitudAntes) {
            return res.status(404).json({ error: 'Canción no encontrada en la playlist' });
        }

        await playlist.save();
        res.json({ message: 'Canción eliminada correctamente', playlist });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────
// REACCIONES — CUIDADOR
// ─────────────────────────────────────────────

/**
 * GET /api/cuidador/musica/reacciones
 * Retorna todas las reacciones del paciente asociado.
 */
export const getReaccionesPaciente = async (req, res) => {
    try {
        const pacienteId = await getPacienteIdDeCuidador(req.usuario._id);

        const reacciones = await ReaccionMusical.find({ pacienteId })
            .sort({ createdAt: -1 });

        res.json(reacciones);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

/**
 * PATCH /api/cuidador/musica/reacciones/:reaccionId/nota
 * Permite al cuidador añadir o editar una nota sobre una reacción del paciente.
 * Body: { notasCuidador }
 */
export const agregarNotaCuidador = async (req, res) => {
    try {
        const pacienteId = await getPacienteIdDeCuidador(req.usuario._id);
        const { reaccionId } = req.params;
        const { notasCuidador } = req.body;

        const reaccion = await ReaccionMusical.findById(reaccionId);
        if (!reaccion) {
            return res.status(404).json({ error: 'Reacción no encontrada' });
        }

        // Verificar que la reacción pertenece al paciente del cuidador
        if (reaccion.pacienteId.toString() !== pacienteId.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para editar esta reacción' });
        }

        reaccion.notasCuidador = notasCuidador || '';
        await reaccion.save();

        res.json(reaccion);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────
// PLAYLIST Y REACCIONES — PACIENTE
// ─────────────────────────────────────────────

/**
 * GET /api/paciente/musica/playlist
 * Retorna la playlist del paciente autenticado.
 */
export const getPlaylistPaciente = async (req, res) => {
    try {
        const pacienteId = req.usuario._id;
        const playlist = await getOrCreatePlaylist(pacienteId);
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/paciente/musica/reacciones
 * Registra la reacción del paciente a una canción.
 * Body: { videoId, tituloCancion, artistaCancion, thumbnailCancion, emocion, recuerdo, nivelRecuerdo }
 */
export const registrarReaccion = async (req, res) => {
    try {
        const pacienteId = req.usuario._id;
        const {
            videoId,
            tituloCancion,
            artistaCancion,
            thumbnailCancion,
            emocion,
            recuerdo,
            nivelRecuerdo
        } = req.body;

        if (!videoId || !emocion) {
            return res.status(400).json({ error: 'videoId y emocion son requeridos' });
        }

        const nuevaReaccion = new ReaccionMusical({
            pacienteId,
            videoId,
            tituloCancion: tituloCancion || '',
            artistaCancion: artistaCancion || '',
            thumbnailCancion: thumbnailCancion || '',
            emocion,
            recuerdo: recuerdo || '',
            nivelRecuerdo: nivelRecuerdo || 'ninguno'
        });

        await nuevaReaccion.save();
        res.status(201).json(nuevaReaccion);
    } catch (error) {
        console.error('Error registrando reacción:', error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * GET /api/paciente/musica/reacciones
 * Retorna el historial de reacciones del paciente autenticado.
 */
export const getMisReacciones = async (req, res) => {
    try {
        const pacienteId = req.usuario._id;
        const reacciones = await ReaccionMusical.find({ pacienteId })
            .sort({ createdAt: -1 });
        res.json(reacciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────
// ANÁLISIS — MÉDICO
// ─────────────────────────────────────────────

/**
 * GET /api/medico/pacientes/:pacienteId/musica/reacciones
 * Retorna las reacciones musicales de un paciente con estadísticas agregadas.
 */
export const getReaccionesParaMedico = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        // Verificar que el médico tiene acceso al paciente
        const medico = await Usuario.findById(req.usuario._id);
        if (!medico || medico.rol !== 'medico') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const tieneAcceso = medico.pacientesAsignados.some(
            id => id.toString() === pacienteId
        );
        if (!tieneAcceso) {
            return res.status(403).json({ error: 'Este paciente no está asignado a tu cuenta' });
        }

        const reacciones = await ReaccionMusical.find({ pacienteId })
            .sort({ createdAt: -1 });

        // ── Estadísticas agregadas ──
        const totalReacciones = reacciones.length;

        // Conteo de emociones
        const conteoPorEmocion = {};
        reacciones.forEach(r => {
            conteoPorEmocion[r.emocion] = (conteoPorEmocion[r.emocion] || 0) + 1;
        });

        // Emoción más frecuente
        let emocionMasFrecuente = null;
        let maxConteo = 0;
        Object.entries(conteoPorEmocion).forEach(([emocion, conteo]) => {
            if (conteo > maxConteo) {
                maxConteo = conteo;
                emocionMasFrecuente = emocion;
            }
        });

        // Distribución de nivel de recuerdo
        const conteoPorNivelRecuerdo = {};
        reacciones.forEach(r => {
            conteoPorNivelRecuerdo[r.nivelRecuerdo] = (conteoPorNivelRecuerdo[r.nivelRecuerdo] || 0) + 1;
        });

        // Canciones únicas escuchadas
        const cancionesUnicas = [...new Set(reacciones.map(r => r.videoId))].length;

        // Promedio de reacciones por semana (últimas 4 semanas)
        const hace4Semanas = new Date();
        hace4Semanas.setDate(hace4Semanas.getDate() - 28);
        const reaccionesRecientes = reacciones.filter(r => new Date(r.createdAt) >= hace4Semanas);
        const promedioSemanal = (reaccionesRecientes.length / 4).toFixed(1);

        res.json({
            reacciones,
            estadisticas: {
                totalReacciones,
                cancionesUnicas,
                emocionMasFrecuente,
                conteoPorEmocion,
                conteoPorNivelRecuerdo,
                promedioSemanal: parseFloat(promedioSemanal)
            }
        });
    } catch (error) {
        console.error('Error obteniendo reacciones para médico:', error);
        res.status(500).json({ error: error.message });
    }
};