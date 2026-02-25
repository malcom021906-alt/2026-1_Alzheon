import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { HiMusicalNote, HiChartBar, HiCalendar, HiSparkles } from 'react-icons/hi2'
import {
    fetchReaccionesParaMedico,
    fetchAnalisisMusicaIA,
    type ReaccionMusical,
    type EstadisticasMusica,
    type EmocionMusical,
    type AnalisisMusicaIA,
    type TendenciaMusical,
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

// ─── Tendencia ────────────────────────────────────────────────────────────────

const TENDENCIA_CONFIG: Record<TendenciaMusical, { emoji: string; label: string; color: string; bg: string }> = {
    mejoria: { emoji: '📈', label: 'Mejoría', color: 'text-green-300', bg: 'bg-green-500/20 border-green-400/30' },
    estable: { emoji: '📊', label: 'Estable', color: 'text-blue-300', bg: 'bg-blue-500/20 border-blue-400/30' },
    atencion_requerida: { emoji: '⚠️', label: 'Atención Requerida', color: 'text-orange-300', bg: 'bg-orange-500/20 border-orange-400/30' },
}

// ─── Barra de puntuación ──────────────────────────────────────────────────────

const getScoreColor = (score: number) => {
    if (score >= 75) return '#4ade80'
    if (score >= 50) return '#facc15'
    return '#fb923c'
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

    // Análisis IA
    const [analisisIA, setAnalisisIA] = useState<AnalisisMusicaIA | null>(null)
    const [generandoIA, setGenerandoIA] = useState(false)

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

    // ── Generar análisis IA ───────────────────────────────────────────────────
    const handleGenerarAnalisis = async () => {
        setGenerandoIA(true)
        try {
            const resultado = await fetchAnalisisMusicaIA(pacienteId)
            setAnalisisIA(resultado)
            toast.success('Análisis IA generado correctamente')
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'No se pudo generar el análisis IA'
            toast.error(msg)
        } finally {
            setGenerandoIA(false)
        }
    }

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

            {/* ── Panel de Análisis IA ────────────────────────────────────────── */}
            <div className="glass-panel rounded-2xl p-5 border border-purple-400/20">
                {/* Cabecera del panel IA */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                            <HiSparkles className="text-purple-300 text-base" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold text-sm">Análisis Clínico con IA</h4>
                            <p className="text-white/50 text-xs">Generado por Google Gemini · Incluye notas del cuidador</p>
                        </div>
                    </div>

                    {!generandoIA && (
                        <button
                            onClick={handleGenerarAnalisis}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/40 to-blue-500/40 hover:from-purple-500/60 hover:to-blue-500/60 text-white text-sm font-semibold transition-all border border-white/10"
                        >
                            <HiSparkles className="text-base" />
                            {analisisIA ? 'Regenerar' : 'Generar Análisis IA'}
                        </button>
                    )}
                </div>

                {/* Estado: generando */}
                {generandoIA && (
                    <div className="rounded-xl bg-purple-500/10 border border-purple-400/20 p-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-pulse" />
                                <div className="absolute inset-1 rounded-full border-2 border-t-purple-400 border-transparent animate-spin" />
                                <HiSparkles className="absolute inset-0 m-auto text-purple-300 text-xl" />
                            </div>
                            <p className="text-purple-200 font-medium text-sm">Analizando datos de musicoterapia...</p>
                            <p className="text-purple-300/60 text-xs">Procesando {reacciones.length} reacciones + anotaciones del cuidador</p>
                        </div>
                    </div>
                )}

                {/* Estado: sin análisis todavía */}
                {!generandoIA && !analisisIA && (
                    <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
                        <p className="text-4xl mb-3">🤖</p>
                        <p className="text-white/70 font-medium text-sm">Sin análisis generado aún</p>
                        <p className="text-white/40 text-xs mt-1">
                            Haz clic en "Generar Análisis IA" para obtener una evaluación clínica basada en las {reacciones.length} reacciones registradas
                        </p>
                    </div>
                )}

                {/* Resultado del análisis IA */}
                {!generandoIA && analisisIA && (
                    <div className="space-y-4">
                        {/* Puntuación + Tendencia */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Puntuación de bienestar */}
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <p className="text-white/60 text-xs uppercase tracking-wider mb-3">Índice de Bienestar Musical</p>
                                <div className="flex items-end gap-3">
                                    <p
                                        className="text-5xl font-bold"
                                        style={{ color: getScoreColor(analisisIA.puntuacion) }}
                                    >
                                        {analisisIA.puntuacion}
                                    </p>
                                    <p className="text-white/40 text-lg pb-1">/100</p>
                                </div>
                                {/* Barra */}
                                <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${analisisIA.puntuacion}%`,
                                            backgroundColor: getScoreColor(analisisIA.puntuacion),
                                        }}
                                    />
                                </div>
                                <p className="text-white/40 text-xs mt-2">
                                    Basado en {analisisIA.totalReaccionesAnalizadas} reacciones
                                </p>
                            </div>

                            {/* Tendencia */}
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <p className="text-white/60 text-xs uppercase tracking-wider mb-3">Tendencia Observada</p>
                                {(() => {
                                    const cfg = TENDENCIA_CONFIG[analisisIA.tendencia]
                                    return (
                                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${cfg.bg}`}>
                                            <span className="text-2xl">{cfg.emoji}</span>
                                            <span className={`font-bold text-base ${cfg.color}`}>{cfg.label}</span>
                                        </div>
                                    )
                                })()}
                                {analisisIA.resumenEmocional && (
                                    <p className="text-white/60 text-xs mt-3 italic">
                                        {analisisIA.resumenEmocional}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Narrativa clínica */}
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Evaluación Clínica</p>
                            <p className="text-white/90 text-sm leading-relaxed">{analisisIA.narrativa}</p>
                        </div>

                        {/* Alertas */}
                        {analisisIA.alertas.length > 0 && (
                            <div className="rounded-xl bg-orange-500/10 border border-orange-400/30 p-4">
                                <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold mb-2">
                                    ⚠️ Alertas Clínicas
                                </p>
                                <ul className="space-y-1">
                                    {analisisIA.alertas.map((alerta, i) => (
                                        <li key={i} className="text-orange-200/90 text-sm flex items-start gap-2">
                                            <span className="mt-0.5 text-orange-400">•</span>
                                            {alerta}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Canciones destacadas */}
                        {analisisIA.cancionesDestacadas.length > 0 && (
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <p className="text-white/60 text-xs uppercase tracking-wider mb-2">🎵 Canciones que Generaron Mejor Respuesta</p>
                                <div className="flex flex-wrap gap-2">
                                    {analisisIA.cancionesDestacadas.map((cancion, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-200 text-xs font-medium"
                                        >
                                            {cancion}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recomendaciones */}
                        {analisisIA.recomendaciones.length > 0 && (
                            <div className="rounded-xl bg-blue-500/10 border border-blue-400/30 p-4">
                                <p className="text-blue-300 text-xs uppercase tracking-wider font-semibold mb-2">
                                    💡 Recomendaciones Terapéuticas
                                </p>
                                <ol className="space-y-2">
                                    {analisisIA.recomendaciones.map((rec, i) => (
                                        <li key={i} className="text-blue-200/90 text-sm flex items-start gap-2">
                                            <span className="font-bold text-blue-400 flex-shrink-0">{i + 1}.</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Pie: fecha de generación */}
                        <p className="text-white/25 text-xs text-right">
                            Generado el {new Date(analisisIA.generadoEn).toLocaleString('es-CO', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                )}
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
