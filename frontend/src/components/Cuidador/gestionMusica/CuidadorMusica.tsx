import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { HiMagnifyingGlass, HiPlus, HiTrash, HiMusicalNote, HiPencilSquare, HiCheck } from 'react-icons/hi2'
import {
    searchSongs,
    fetchPlaylistCuidador,
    addSongToPlaylist,
    removeSongFromPlaylist,
    fetchReaccionesCuidador,
    addNotaCuidador,
    type ResultadoBusqueda,
    type CancionPlaylist,
    type ReaccionMusical,
    type EmocionMusical,
} from '../../../services/musicaApi'

// ─── Mapas de visualización ─────────────────────────────────────────────────

const EMOCION_LABEL: Record<EmocionMusical, string> = {
    muy_feliz: '😄 Muy Feliz',
    feliz: '🙂 Feliz',
    neutral: '😐 Neutral',
    triste: '😢 Triste',
    ansioso: '😰 Ansioso',
    sin_reaccion: '🤷 Sin reacción',
}

const EMOCION_COLOR: Record<EmocionMusical, string> = {
    muy_feliz: 'bg-green-400/30 text-green-200 border-green-400/30',
    feliz: 'bg-emerald-400/30 text-emerald-200 border-emerald-400/30',
    neutral: 'bg-gray-400/30 text-gray-200 border-gray-400/30',
    triste: 'bg-blue-400/30 text-blue-200 border-blue-400/30',
    ansioso: 'bg-orange-400/30 text-orange-200 border-orange-400/30',
    sin_reaccion: 'bg-white/10 text-white/60 border-white/20',
}

const NIVEL_LABEL: Record<string, string> = {
    ninguno: '⚬ Ninguno',
    vago: '◔ Vago',
    claro: '◑ Claro',
    muy_claro: '● Muy claro',
}

// ─── Componente principal ────────────────────────────────────────────────────

export const CuidadorMusica = () => {
    const [tab, setTab] = useState<'playlist' | 'reacciones'>('playlist')

    // Búsqueda
    const [query, setQuery] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])

    // Playlist
    const [playlist, setPlaylist] = useState<CancionPlaylist[]>([])
    const [loadingPlaylist, setLoadingPlaylist] = useState(true)
    const [agregando, setAgregando] = useState<string | null>(null) // videoId en proceso

    // Reacciones
    const [reacciones, setReacciones] = useState<ReaccionMusical[]>([])
    const [loadingReacciones, setLoadingReacciones] = useState(true)
    const [notaEditandoId, setNotaEditandoId] = useState<string | null>(null)
    const [notaTexto, setNotaTexto] = useState('')
    const [guardandoNota, setGuardandoNota] = useState(false)

    // ── Carga inicial ──────────────────────────────────────────────────────────
    useEffect(() => {
        const cargar = async () => {
            try {
                const [playlistData, reaccionesData] = await Promise.all([
                    fetchPlaylistCuidador(),
                    fetchReaccionesCuidador(),
                ])
                setPlaylist(playlistData.canciones)
                setReacciones(reaccionesData)
            } catch (error) {
                toast.error('Error al cargar la musicoterapia')
            } finally {
                setLoadingPlaylist(false)
                setLoadingReacciones(false)
            }
        }
        cargar()
    }, [])

    // ── Búsqueda con debounce ──────────────────────────────────────────────────
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        setBuscando(true)
        setResultados([])
        try {
            const data = await searchSongs(query.trim())
            setResultados(data)
            if (data.length === 0) toast.info('No se encontraron resultados')
        } catch (error: any) {
            if (error?.response?.data?.error?.includes('API Key')) {
                toast.error('Configura YOUTUBE_API_KEY en el servidor para buscar canciones')
            } else {
                toast.error('Error al buscar canciones')
            }
        } finally {
            setBuscando(false)
        }
    }

    // ── Agregar canción ────────────────────────────────────────────────────────
    const handleAgregar = async (cancion: ResultadoBusqueda) => {
        if (agregando === cancion.videoId) return
        setAgregando(cancion.videoId)
        try {
            const updatedPlaylist = await addSongToPlaylist({
                videoId: cancion.videoId,
                titulo: cancion.titulo,
                artista: cancion.artista,
                thumbnail: cancion.thumbnail,
            })
            setPlaylist(updatedPlaylist.canciones)
            toast.success(`"${cancion.titulo}" agregada a la playlist`)
        } catch (error: any) {
            if (error?.response?.status === 409) {
                toast.info('Esta canción ya está en la playlist')
            } else {
                toast.error('No se pudo agregar la canción')
            }
        } finally {
            setAgregando(null)
        }
    }

    // ── Eliminar canción ───────────────────────────────────────────────────────
    const handleEliminar = async (videoId: string, titulo: string) => {
        try {
            const updatedPlaylist = await removeSongFromPlaylist(videoId)
            setPlaylist(updatedPlaylist?.canciones ?? playlist.filter(c => c.videoId !== videoId))
            toast.success(`"${titulo}" eliminada de la playlist`)
        } catch (error) {
            toast.error('No se pudo eliminar la canción')
        }
    }

    // ── Guardar nota del cuidador ──────────────────────────────────────────────
    const handleIniciarNota = (reaccion: ReaccionMusical) => {
        setNotaEditandoId(reaccion._id)
        setNotaTexto(reaccion.notasCuidador || '')
    }

    const handleGuardarNota = async (reaccionId: string) => {
        setGuardandoNota(true)
        try {
            const actualizada = await addNotaCuidador(reaccionId, notaTexto)
            setReacciones(prev =>
                prev.map(r => (r._id === reaccionId ? actualizada : r))
            )
            toast.success('Nota guardada correctamente')
            setNotaEditandoId(null)
        } catch (error) {
            toast.error('No se pudo guardar la nota')
        } finally {
            setGuardandoNota(false)
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    const yaEnPlaylist = (videoId: string) =>
        playlist.some(c => c.videoId === videoId)

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <section>
            {/* Encabezado */}
            <div className="glass-panel px-6 py-5 rounded-2xl mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <HiMusicalNote className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Musicoterapia</h2>
                        <p className="text-sm text-white/70">Gestiona la playlist y revisa las reacciones del paciente</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    {(['playlist', 'reacciones'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={[
                                'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                                tab === t
                                    ? 'bg-white/30 text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/10',
                            ].join(' ')}
                        >
                            {t === 'playlist' ? '🎵 Playlist' : '💬 Reacciones del Paciente'}
                            {t === 'playlist' && (
                                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                    {playlist.length}
                                </span>
                            )}
                            {t === 'reacciones' && reacciones.length > 0 && (
                                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                    {reacciones.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── TAB: PLAYLIST ─────────────────── */}
            {tab === 'playlist' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Panel izquierdo: Buscador */}
                    <div className="glass-panel rounded-2xl p-5 space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <HiMagnifyingGlass /> Buscar canciones en YouTube
                        </h3>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Ej: Beethoven, Vallenatos, Boleros..."
                                className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/50"
                            />
                            <button
                                type="submit"
                                disabled={buscando || !query.trim()}
                                className="glass-button px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {buscando ? '...' : 'Buscar'}
                            </button>
                        </form>

                        {/* Resultados */}
                        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                            {buscando && (
                                <p className="text-white/60 text-sm text-center py-8">Buscando canciones...</p>
                            )}
                            {!buscando && resultados.length === 0 && (
                                <p className="text-white/40 text-sm text-center py-8">
                                    Escribe algo y presiona Buscar
                                </p>
                            )}
                            {resultados.map(r => (
                                <div
                                    key={r.videoId}
                                    className="flex items-center gap-3 rounded-xl bg-white/10 p-3 hover:bg-white/15 transition-all"
                                >
                                    <img
                                        src={r.thumbnail}
                                        alt={r.titulo}
                                        className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{r.titulo}</p>
                                        <p className="text-white/60 text-xs truncate">{r.artista}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAgregar(r)}
                                        disabled={agregando === r.videoId || yaEnPlaylist(r.videoId)}
                                        className={[
                                            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                                            yaEnPlaylist(r.videoId)
                                                ? 'bg-green-500/30 text-green-300 cursor-default'
                                                : 'bg-white/20 text-white hover:bg-white/30',
                                        ].join(' ')}
                                        title={yaEnPlaylist(r.videoId) ? 'Ya en la playlist' : 'Agregar'}
                                    >
                                        {yaEnPlaylist(r.videoId) ? (
                                            <HiCheck className="text-sm" />
                                        ) : (
                                            <HiPlus className="text-sm" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Panel derecho: Playlist actual */}
                    <div className="glass-panel rounded-2xl p-5 space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <HiMusicalNote /> Playlist del Paciente
                            <span className="ml-auto text-xs text-white/50">{playlist.length} canciones</span>
                        </h3>

                        {loadingPlaylist ? (
                            <p className="text-white/60 text-sm text-center py-8">Cargando playlist...</p>
                        ) : playlist.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-4xl mb-3">🎶</p>
                                <p className="text-white/60 text-sm">La playlist está vacía.</p>
                                <p className="text-white/40 text-xs mt-1">Busca canciones y agrégalas.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                                {playlist.map(cancion => (
                                    <div
                                        key={cancion._id}
                                        className="flex items-center gap-3 rounded-xl bg-white/10 p-3 hover:bg-white/15 transition-all group"
                                    >
                                        {cancion.thumbnail ? (
                                            <img
                                                src={cancion.thumbnail}
                                                alt={cancion.titulo}
                                                className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                                <HiMusicalNote className="text-white/40" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{cancion.titulo}</p>
                                            <p className="text-white/60 text-xs truncate">{cancion.artista}</p>
                                        </div>
                                        <button
                                            onClick={() => handleEliminar(cancion.videoId, cancion.titulo)}
                                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-all opacity-0 group-hover:opacity-100"
                                            title="Eliminar de la playlist"
                                        >
                                            <HiTrash className="text-sm" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB: REACCIONES ──────────────── */}
            {tab === 'reacciones' && (
                <div className="glass-panel rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4">
                        💬 Reacciones Musicales del Paciente
                    </h3>

                    {loadingReacciones ? (
                        <p className="text-white/60 text-sm text-center py-8">Cargando reacciones...</p>
                    ) : reacciones.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-5xl mb-3">🎧</p>
                            <p className="text-white/60 text-sm">El paciente aún no ha registrado reacciones.</p>
                            <p className="text-white/40 text-xs mt-1">
                                Las reacciones aparecerán aquí cuando el paciente escuche canciones.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reacciones.map(reaccion => (
                                <div
                                    key={reaccion._id}
                                    className="rounded-xl bg-white/10 p-4 space-y-3 hover:bg-white/15 transition-all"
                                >
                                    {/* Canción + Emoción */}
                                    <div className="flex items-start gap-3">
                                        {reaccion.thumbnailCancion && (
                                            <img
                                                src={reaccion.thumbnailCancion}
                                                alt={reaccion.tituloCancion}
                                                className="w-16 h-11 object-cover rounded-lg flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-semibold text-sm truncate">
                                                {reaccion.tituloCancion || 'Canción sin título'}
                                            </p>
                                            <p className="text-white/60 text-xs">{reaccion.artistaCancion}</p>
                                            <p className="text-white/40 text-xs mt-0.5">
                                                {new Date(reaccion.createdAt).toLocaleDateString('es-CO', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <span
                                                className={`text-xs font-semibold px-2 py-1 rounded-full border ${EMOCION_COLOR[reaccion.emocion]
                                                    }`}
                                            >
                                                {EMOCION_LABEL[reaccion.emocion]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Recuerdo y nivel */}
                                    {reaccion.recuerdo && (
                                        <div className="rounded-lg bg-white/10 p-3">
                                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                                                Recuerdo evocado
                                            </p>
                                            <p className="text-white/90 text-sm italic">"{reaccion.recuerdo}"</p>
                                            <p className="text-white/40 text-xs mt-1">
                                                Nitidez: {NIVEL_LABEL[reaccion.nivelRecuerdo] ?? reaccion.nivelRecuerdo}
                                            </p>
                                        </div>
                                    )}

                                    {/* Nota del cuidador */}
                                    {notaEditandoId === reaccion._id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={notaTexto}
                                                onChange={e => setNotaTexto(e.target.value)}
                                                placeholder="Escribe una nota de seguimiento..."
                                                rows={2}
                                                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/50 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleGuardarNota(reaccion._id)}
                                                    disabled={guardandoNota}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/30 text-green-200 text-xs font-semibold hover:bg-green-500/50 transition-all disabled:opacity-50"
                                                >
                                                    <HiCheck /> {guardandoNota ? 'Guardando...' : 'Guardar nota'}
                                                </button>
                                                <button
                                                    onClick={() => setNotaEditandoId(null)}
                                                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            {reaccion.notasCuidador ? (
                                                <p className="text-white/60 text-xs italic flex-1">
                                                    📝 Nota: {reaccion.notasCuidador}
                                                </p>
                                            ) : (
                                                <p className="text-white/30 text-xs flex-1">Sin nota del cuidador</p>
                                            )}
                                            <button
                                                onClick={() => handleIniciarNota(reaccion)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 text-xs transition-all"
                                            >
                                                <HiPencilSquare className="text-sm" />
                                                {reaccion.notasCuidador ? 'Editar' : 'Añadir nota'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}
