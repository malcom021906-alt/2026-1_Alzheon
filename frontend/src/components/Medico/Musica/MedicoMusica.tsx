import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { HiMusicalNote, HiChartBar, HiCalendar } from 'react-icons/hi2'
import {
    fetchReaccionesParaMedico,
    type ReaccionMusical,
    type EstadisticasMusica,
    type EmocionMusical,
} from '../../../services/musicaApi'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'

// ─── Constantes de visualización ─────────────────────────────────────────────

const EMOCION_LABEL: Record<EmocionMusical, string> = {
    muy_feliz: '😄 Muy Feliz',
    feliz: '🙂 Feliz',
    neutral: '😐 Neutral',
    triste: '😢 Triste',
    ansioso: '😰 Ansioso',
    sin_reaccion: '🤷 Sin reacción',
}

const EMOCION_COLOR: Record<EmocionMusical, string> = {
    muy_feliz: '#4ade80',
    feliz: '#34d399',
    neutral: '#94a3b8',
    triste: '#60a5fa',
    ansioso: '#fb923c',
    sin_reaccion: '#ffffff40',
}

const NIVEL_LABEL: Record<string, string> = {
    ninguno: 'Ninguno',
    vago: 'Vago',
    claro: 'Claro',
    muy_claro: 'Muy claro',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MedicoMusicaProps {
    pacienteId: string
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const MedicoMusica = ({ pacienteId }: MedicoMusicaProps) => {
    const [reacciones, setReacciones] = useState<ReaccionMusical[]>([])
    const [estadisticas, setEstadisticas] = useState<EstadisticasMusica | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await fetchReaccionesParaMedico(pacienteId)
                setReacciones(data.reacciones)
                setEstadisticas(data.estadisticas)
            } catch (error) {
                toast.error('No se pudieron cargar los datos de musicoterapia')
            } finally {
                setLoading(false)
            }
        }
        cargar()
    }, [pacienteId])

    if (loading) {
        return (
            <div className="glass-panel rounded-2xl p-8 text-center">
                <p className="text-white/60 text-sm">Cargando datos de musicoterapia...</p>
            </div>
        )
    }

    if (reacciones.length === 0) {
        return (
            <div className="glass-panel rounded-2xl p-10 text-center">
                <p className="text-5xl mb-4">🎵</p>
                <p className="text-white font-semibold">Sin datos de musicoterapia</p>
                <p className="text-white/60 text-sm mt-2">
                    El paciente aún no ha registrado reacciones musicales.
                </p>
            </div>
        )
    }

    // ── Datos para gráfica de emociones ──────────────────────────────────────
    const datosGrafica = estadisticas
        ? Object.entries(estadisticas.conteoPorEmocion).map(([emocion, cantidad]) => ({
            emocion: (EMOCION_LABEL[emocion as EmocionMusical] ?? emocion).split(' ').slice(1).join(' '),
            cantidad,
            color: EMOCION_COLOR[emocion as EmocionMusical] ?? '#ffffff40',
        }))
        : []

    // ── Datos para gráfica de nivel de recuerdo ───────────────────────────────
    const datosRecuerdo = estadisticas
        ? Object.entries(estadisticas.conteoPorNivelRecuerdo).map(([nivel, cantidad]) => ({
            nivel: NIVEL_LABEL[nivel] ?? nivel,
            cantidad,
        }))
        : []

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <HiMusicalNote className="text-white text-xl" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Musicoterapia</h3>
                    <p className="text-white/60 text-sm">Análisis de reacciones musicales del paciente</p>
                </div>
            </div>

            {/* KPIs */}
            {estadisticas && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-panel rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-white">{estadisticas.totalReacciones}</p>
                        <p className="text-white/60 text-xs mt-1">Reacciones totales</p>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-white">{estadisticas.cancionesUnicas}</p>
                        <p className="text-white/60 text-xs mt-1">Canciones únicas</p>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 text-center">
                        <p className="text-xl font-bold text-white">
                            {estadisticas.emocionMasFrecuente
                                ? EMOCION_LABEL[estadisticas.emocionMasFrecuente]
                                : '—'}
                        </p>
                        <p className="text-white/60 text-xs mt-1">Emoción más frecuente</p>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-white">{estadisticas.promedioSemanal}</p>
                        <p className="text-white/60 text-xs mt-1">Promedio/semana (último mes)</p>
                    </div>
                </div>
            )}

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución de emociones */}
                <div className="glass-panel rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiChartBar className="text-white/70" />
                        <h4 className="text-white font-semibold text-sm">Distribución de Emociones</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={datosGrafica} margin={{ left: -10 }}>
                            <XAxis
                                dataKey="emocion"
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ background: 'rgba(15,25,47,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="cantidad" name="Reacciones" radius={[6, 6, 0, 0]}>
                                {datosGrafica.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Nitidez de recuerdos */}
                <div className="glass-panel rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiChartBar className="text-white/70" />
                        <h4 className="text-white font-semibold text-sm">Nitidez de Recuerdos Evocados</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={datosRecuerdo} margin={{ left: -10 }}>
                            <XAxis
                                dataKey="nivel"
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ background: 'rgba(15,25,47,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="cantidad" name="Reacciones" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Historial de reacciones */}
            <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <HiCalendar className="text-white/70" />
                    <h4 className="text-white font-semibold text-sm">
                        Historial de Reacciones
                        <span className="ml-2 text-white/40 font-normal">({reacciones.length})</span>
                    </h4>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {reacciones.map(r => (
                        <div
                            key={r._id}
                            className="flex items-start gap-3 rounded-xl bg-white/10 p-4 hover:bg-white/15 transition-all"
                        >
                            {/* Thumbnail */}
                            {r.thumbnailCancion && (
                                <img
                                    src={r.thumbnailCancion}
                                    alt={r.tituloCancion}
                                    className="w-16 h-11 object-cover rounded-lg flex-shrink-0"
                                />
                            )}

                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-white font-semibold text-sm truncate">
                                        {r.tituloCancion || 'Canción'}
                                    </p>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 flex-shrink-0"
                                        style={{ color: EMOCION_COLOR[r.emocion] }}
                                    >
                                        {EMOCION_LABEL[r.emocion]}
                                    </span>
                                </div>
                                <p className="text-white/50 text-xs">{r.artistaCancion}</p>

                                {r.recuerdo && (
                                    <p className="text-white/80 text-xs italic bg-white/5 rounded-lg px-3 py-2">
                                        "{r.recuerdo}"
                                        <span className="text-white/40 ml-2 not-italic">
                                            ({NIVEL_LABEL[r.nivelRecuerdo]})
                                        </span>
                                    </p>
                                )}

                                {r.notasCuidador && (
                                    <p className="text-white/50 text-xs">📝 Nota cuidador: {r.notasCuidador}</p>
                                )}

                                <p className="text-white/30 text-xs">
                                    {new Date(r.createdAt).toLocaleDateString('es-CO', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
