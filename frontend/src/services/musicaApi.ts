import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5500'

export const musicaApiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CancionPlaylist {
    _id: string
    videoId: string
    titulo: string
    artista: string
    thumbnail: string
    duracion: string
    agregadoPor: string
    fechaAgregado: string
}

export interface Playlist {
    _id: string
    pacienteId: string
    canciones: CancionPlaylist[]
    updatedAt: string
}

export type EmocionMusical =
    | 'muy_feliz'
    | 'feliz'
    | 'neutral'
    | 'triste'
    | 'ansioso'
    | 'sin_reaccion'

export type NivelRecuerdo = 'ninguno' | 'vago' | 'claro' | 'muy_claro'

export interface ReaccionMusical {
    _id: string
    pacienteId: string
    videoId: string
    tituloCancion: string
    artistaCancion: string
    thumbnailCancion: string
    emocion: EmocionMusical
    recuerdo: string
    nivelRecuerdo: NivelRecuerdo
    notasCuidador: string
    revisadoPorMedico: boolean
    createdAt: string
    updatedAt: string
}

export interface ResultadoBusqueda {
    videoId: string
    titulo: string
    artista: string
    thumbnail: string
    descripcion: string
}

export interface EstadisticasMusica {
    totalReacciones: number
    cancionesUnicas: number
    emocionMasFrecuente: EmocionMusical | null
    conteoPorEmocion: Record<EmocionMusical, number>
    conteoPorNivelRecuerdo: Record<NivelRecuerdo, number>
    promedioSemanal: number
}

export interface ReaccionesConEstadisticas {
    reacciones: ReaccionMusical[]
    estadisticas: EstadisticasMusica
}

// ─── Cuidador — Búsqueda ──────────────────────────────────────────────────────

/** Busca canciones/videos en YouTube a través del backend */
export const searchSongs = async (query: string): Promise<ResultadoBusqueda[]> => {
    const { data } = await musicaApiClient.get('/api/musica/buscar', {
        params: { q: query },
    })
    return data
}

// ─── Cuidador — Gestión de Playlist ──────────────────────────────────────────

/** Obtiene la playlist del paciente asociado al cuidador */
export const fetchPlaylistCuidador = async (): Promise<Playlist> => {
    const { data } = await musicaApiClient.get('/api/cuidador/musica/playlist')
    return data
}

/** Agrega una canción a la playlist del paciente */
export const addSongToPlaylist = async (
    cancion: Omit<ResultadoBusqueda, 'descripcion'> & { duracion?: string }
): Promise<Playlist> => {
    const { data } = await musicaApiClient.post('/api/cuidador/musica/playlist', cancion)
    return data
}

/** Elimina una canción de la playlist del paciente */
export const removeSongFromPlaylist = async (videoId: string): Promise<Playlist> => {
    const { data } = await musicaApiClient.delete(`/api/cuidador/musica/playlist/${videoId}`)
    return data.playlist
}

// ─── Cuidador — Reacciones del Paciente ──────────────────────────────────────

/** Obtiene todas las reacciones del paciente asociado */
export const fetchReaccionesCuidador = async (): Promise<ReaccionMusical[]> => {
    const { data } = await musicaApiClient.get('/api/cuidador/musica/reacciones')
    return data
}

/** Agrega o edita la nota del cuidador en una reacción */
export const addNotaCuidador = async (
    reaccionId: string,
    notasCuidador: string
): Promise<ReaccionMusical> => {
    const { data } = await musicaApiClient.patch(
        `/api/cuidador/musica/reacciones/${reaccionId}/nota`,
        { notasCuidador }
    )
    return data
}

// ─── Paciente ─────────────────────────────────────────────────────────────────

/** Obtiene la playlist del paciente autenticado */
export const fetchPlaylistPaciente = async (): Promise<Playlist> => {
    const { data } = await musicaApiClient.get('/api/paciente/musica/playlist')
    return data
}

/** El paciente registra su reacción emocional a una canción */
export const submitReaccion = async (payload: {
    videoId: string
    tituloCancion: string
    artistaCancion: string
    thumbnailCancion: string
    emocion: EmocionMusical
    recuerdo: string
    nivelRecuerdo: NivelRecuerdo
}): Promise<ReaccionMusical> => {
    const { data } = await musicaApiClient.post('/api/paciente/musica/reacciones', payload)
    return data
}

/** Obtiene el historial de reacciones del paciente autenticado */
export const fetchReaccionesPaciente = async (): Promise<ReaccionMusical[]> => {
    const { data } = await musicaApiClient.get('/api/paciente/musica/reacciones')
    return data
}

// ─── Médico ───────────────────────────────────────────────────────────────────

/** Obtiene reacciones de un paciente específico con estadísticas (médico) */
export const fetchReaccionesParaMedico = async (
    pacienteId: string
): Promise<ReaccionesConEstadisticas> => {
    const { data } = await musicaApiClient.get(
        `/api/medico/pacientes/${pacienteId}/musica/reacciones`
    )
    return data
}
