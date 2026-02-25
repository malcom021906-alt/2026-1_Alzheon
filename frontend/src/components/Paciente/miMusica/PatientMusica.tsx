import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { HiMusicalNote, HiPlay, HiArrowLeft } from 'react-icons/hi2'
import {
    fetchPlaylistPaciente,
    fetchReaccionesPaciente,
    submitReaccion,
    type CancionPlaylist,
    type ReaccionMusical,
    type EmocionMusical,
    type NivelRecuerdo,
} from '../../../services/musicaApi'

// ─── Mapas de opciones para el paciente ─────────────────────────────────────

const OPCIONES_EMOCION: { valor: EmocionMusical; emoji: string; etiqueta: string; color: string }[] = [
    { valor: 'muy_feliz', emoji: '😄', etiqueta: 'Muy Feliz', color: 'bg-green-400/30 border-green-400/50 text-green-100' },
    { valor: 'feliz', emoji: '🙂', etiqueta: 'Feliz', color: 'bg-emerald-400/30 border-emerald-400/50 text-emerald-100' },
    { valor: 'neutral', emoji: '😐', etiqueta: 'Neutral', color: 'bg-gray-400/30 border-gray-400/50 text-gray-100' },
    { valor: 'triste', emoji: '😢', etiqueta: 'Triste', color: 'bg-blue-400/30 border-blue-400/50 text-blue-100' },
    { valor: 'ansioso', emoji: '😰', etiqueta: 'Ansioso', color: 'bg-orange-400/30 border-orange-400/50 text-orange-100' },
    { valor: 'sin_reaccion', emoji: '🤷', etiqueta: 'Sin reacción', color: 'bg-white/10 border-white/20 text-white/60' },
]

const OPCIONES_RECUERDO: { valor: NivelRecuerdo; etiqueta: string }[] = [
    { valor: 'ninguno', etiqueta: 'Ningún recuerdo' },
    { valor: 'vago', etiqueta: 'Recuerdo vago' },
    { valor: 'claro', etiqueta: 'Recuerdo claro' },
    { valor: 'muy_claro', etiqueta: 'Recuerdo muy claro' },
]

// ─── Componente principal ────────────────────────────────────────────────────

export const PatientMusica = () => {
    const [canciones, setCanciones] = useState<CancionPlaylist[]>([])
    const [reacciones, setReacciones] = useState<ReaccionMusical[]>([])
    const [loading, setLoading] = useState(true)
    const [cancionSeleccionada, setCancionSeleccionada] = useState<CancionPlaylist | null>(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)

    // Formulario de reacción
    const [emocionElegida, setEmocionElegida] = useState<EmocionMusical | null>(null)
    const [recuerdo, setRecuerdo] = useState('')
    const [nivelRecuerdo, setNivelRecuerdo] = useState<NivelRecuerdo>('ninguno')
    const [enviando, setEnviando] = useState(false)
    const [reaccionGuardada, setReaccionGuardada] = useState(false)

    // ── Carga inicial ──────────────────────────────────────────────────────────
    useEffect(() => {
        const cargar = async () => {
            try {
                const [playlistData, reaccionesData] = await Promise.all([
                    fetchPlaylistPaciente(),
                    fetchReaccionesPaciente(),
                ])
                setCanciones(playlistData.canciones)
                setReacciones(reaccionesData)
            } catch (error) {
                toast.error('No se pudo cargar tu música')
            } finally {
                setLoading(false)
            }
        }
        cargar()
    }, [])

    // ── Seleccionar canción para reproducir ──────────────────────────────────
    const handleSeleccionar = (cancion: CancionPlaylist) => {
        setCancionSeleccionada(cancion)
        setMostrarFormulario(false)
        setEmocionElegida(null)
        setRecuerdo('')
        setNivelRecuerdo('ninguno')
        setReaccionGuardada(false)
    }

    // ── Volver a la lista ─────────────────────────────────────────────────────
    const handleVolver = () => {
        setCancionSeleccionada(null)
        setMostrarFormulario(false)
        setReaccionGuardada(false)
    }

    // ── Guardar reacción ──────────────────────────────────────────────────────
    const handleGuardarReaccion = async () => {
        if (!cancionSeleccionada || !emocionElegida) {
            toast.error('Por favor selecciona cómo te sentiste')
            return
        }
        setEnviando(true)
        try {
            await submitReaccion({
                videoId: cancionSeleccionada.videoId,
                tituloCancion: cancionSeleccionada.titulo,
                artistaCancion: cancionSeleccionada.artista,
                thumbnailCancion: cancionSeleccionada.thumbnail,
                emocion: emocionElegida,
                recuerdo,
                nivelRecuerdo,
            })
            toast.success('¡Gracias! Tu reacción fue guardada 💙')
            setReaccionGuardada(true)
            setMostrarFormulario(false)
            // Recargar historial
            const nuevasReacciones = await fetchReaccionesPaciente()
            setReacciones(nuevasReacciones)
        } catch (error) {
            toast.error('No se pudo guardar tu reacción, intenta nuevamente')
        } finally {
            setEnviando(false)
        }
    }

    // ── Render: lista de canciones ────────────────────────────────────────────
    if (!cancionSeleccionada) {
        return (
            <section>
                {/* Encabezado */}
                <div className="glass-panel px-6 py-5 rounded-2xl mb-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <HiMusicalNote className="text-white text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Mi Música</h2>
                        <p className="text-sm text-white/70">
                            Escucha las canciones que tu cuidador preparó para ti
                        </p>
                    </div>
                </div>

                {/* Lista */}
                {loading ? (
                    <p className="text-white/60 text-center py-16">Cargando tu música...</p>
                ) : canciones.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center">
                        <p className="text-5xl mb-4">🎶</p>
                        <p className="text-white font-semibold text-lg">Aún no hay canciones</p>
                        <p className="text-white/60 text-sm mt-2">
                            Tu cuidador añadirá canciones especiales para ti pronto.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {canciones.map(cancion => (
                            <button
                                key={cancion._id}
                                onClick={() => handleSeleccionar(cancion)}
                                className="glass-panel rounded-2xl p-4 text-left hover:bg-white/20 transition-all duration-200 group"
                            >
                                {/* Thumbnail */}
                                <div className="relative mb-3">
                                    {cancion.thumbnail ? (
                                        <img
                                            src={cancion.thumbnail}
                                            alt={cancion.titulo}
                                            className="w-full h-36 object-cover rounded-xl"
                                        />
                                    ) : (
                                        <div className="w-full h-36 bg-white/10 rounded-xl flex items-center justify-center">
                                            <HiMusicalNote className="text-white/40 text-3xl" />
                                        </div>
                                    )}
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <HiPlay className="text-white text-2xl ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-white font-semibold text-sm leading-snug line-clamp-2">
                                    {cancion.titulo}
                                </p>
                                <p className="text-white/60 text-xs mt-1">{cancion.artista}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Historial de reacciones */}
                {!loading && reacciones.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span>📜</span> Mis recuerdos musicales
                        </h3>
                        <div className="space-y-4">
                            {reacciones.map(reaccion => (
                                <div key={reaccion._id} className="glass-panel rounded-2xl p-4 flex gap-4">
                                    <img
                                        src={reaccion.thumbnailCancion}
                                        alt={reaccion.tituloCancion}
                                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-white font-semibold text-sm truncate">
                                                {reaccion.tituloCancion}
                                            </p>
                                            <span className="text-xs text-white/40">
                                                {new Date(reaccion.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-lg">
                                                {OPCIONES_EMOCION.find(o => o.valor === reaccion.emocion)?.emoji}
                                            </span>
                                            <p className="text-white/70 text-xs italic">
                                                "{reaccion.recuerdo || 'Sin comentarios'}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        )
    }

    // ── Render: reproductor ──────────────────────────────────────────────────
    return (
        <section>
            {/* Botón volver */}
            <button
                onClick={handleVolver}
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-all"
            >
                <HiArrowLeft /> Volver a la lista
            </button>

            {/* Reproductor */}
            <div className="glass-panel rounded-2xl overflow-hidden mb-6">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${cancionSeleccionada.videoId}?autoplay=1&rel=0`}
                        title={cancionSeleccionada.titulo}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="p-4">
                    <p className="text-white font-bold text-lg">{cancionSeleccionada.titulo}</p>
                    <p className="text-white/60 text-sm">{cancionSeleccionada.artista}</p>
                </div>
            </div>

            {/* Acciones post-reproducción */}
            {reaccionGuardada ? (
                <div className="glass-panel rounded-2xl p-8 text-center">
                    <p className="text-5xl mb-3">💙</p>
                    <p className="text-white font-semibold text-lg">¡Gracias por compartir!</p>
                    <p className="text-white/60 text-sm mt-1">
                        Tu cuidador y médico podrán ver cómo te afectó esta canción.
                    </p>
                    <button
                        onClick={handleVolver}
                        className="mt-4 px-6 py-2 rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 transition-all"
                    >
                        Escuchar otra canción
                    </button>
                </div>
            ) : !mostrarFormulario ? (
                <div className="glass-panel rounded-2xl p-6 text-center">
                    <p className="text-white font-semibold mb-2">¿Cómo te hizo sentir esta canción?</p>
                    <p className="text-white/60 text-sm mb-4">
                        Cuéntanos tu experiencia para que tu médico y cuidador puedan ayudarte mejor.
                    </p>
                    <button
                        onClick={() => setMostrarFormulario(true)}
                        className="glass-button px-8 py-3 rounded-xl text-white font-semibold hover:bg-white/30 transition-all"
                    >
                        💬 Compartir mi reacción
                    </button>
                </div>
            ) : (
                /* ── Formulario de reacción ── */
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                    <h3 className="text-white font-bold text-lg text-center">¿Cómo te sentiste? 🎵</h3>

                    {/* Selección de emoción (botones grandes) */}
                    <div>
                        <p className="text-white/70 text-sm mb-3 font-medium">
                            Toca cómo describes tu emoción:
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {OPCIONES_EMOCION.map(op => (
                                <button
                                    key={op.valor}
                                    onClick={() => setEmocionElegida(op.valor)}
                                    className={[
                                        'flex flex-col items-center gap-1 py-4 rounded-2xl border-2 transition-all duration-200',
                                        emocionElegida === op.valor
                                            ? `${op.color} scale-105 shadow-lg`
                                            : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20',
                                    ].join(' ')}
                                >
                                    <span className="text-3xl">{op.emoji}</span>
                                    <span className="text-xs font-semibold">{op.etiqueta}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recuerdo libre */}
                    <div>
                        <label className="text-white/70 text-sm font-medium block mb-2">
                            ¿Qué recuerdos te trajo esta canción? (Opcional)
                        </label>
                        <textarea
                            value={recuerdo}
                            onChange={e => setRecuerdo(e.target.value)}
                            placeholder="Escribe aquí lo que recuerdes o lo que sentiste..."
                            rows={3}
                            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/50 resize-none"
                        />
                    </div>

                    {/* Nivel de nitidez */}
                    <div>
                        <p className="text-white/70 text-sm font-medium mb-3">
                            ¿Qué tan claro fue ese recuerdo?
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {OPCIONES_RECUERDO.map(op => (
                                <button
                                    key={op.valor}
                                    onClick={() => setNivelRecuerdo(op.valor)}
                                    className={[
                                        'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                                        nivelRecuerdo === op.valor
                                            ? 'bg-white/30 border-white/60 text-white'
                                            : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20',
                                    ].join(' ')}
                                >
                                    {op.etiqueta}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMostrarFormulario(false)}
                            className="px-6 py-3 rounded-xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardarReaccion}
                            disabled={!emocionElegida || enviando}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500/60 to-blue-500/60 text-white font-semibold hover:from-purple-500/80 hover:to-blue-500/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {enviando ? '⏳ Guardando...' : '💾 Guardar mi reacción'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}
