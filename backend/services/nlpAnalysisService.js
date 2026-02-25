import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-flash-latest';

export const analizarTexto = async (texto, contexto = '') => {
    console.log('🧠 Iniciando análisis cognitivo con Google Gemini...');
    console.log('   - Longitud del texto:', texto?.length || 0, 'caracteres');
    console.log('   - Contexto:', contexto);

    try {
        if (!GEMINI_API_KEY) {
            console.warn('⚠️ GEMINI_API_KEY no configurada. Usando análisis por defecto.');
            return generarAnalisisPorDefecto();
        }

        const prompt = construirPromptAnalisis(texto, contexto);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096, // Aumentado para evitar cortes
            }
        });

        console.log('✅ Análisis completado por Google Gemini');

        const responseData = response.data;
        console.log('📦 Respuesta completa de Gemini:', JSON.stringify(responseData, null, 2));

        const analisisTexto = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        console.log('📄 Respuesta de Gemini:', analisisTexto.substring(0, 500));

        const analisis = parsearAnalisis(analisisTexto);

        console.log('📊 Métricas detectadas:');
        console.log('   - Coherencia:', analisis.coherencia);
        console.log('   - Claridad:', analisis.claridad);
        console.log('   - Riqueza léxica:', analisis.riquezaLexica);
        console.log('   - Memoria:', analisis.memoria);
        console.log('   - Puntuación global:', analisis.puntuacionGlobal);

        return analisis;

    } catch (error) {
        console.error('❌ Error al analizar texto con Google Gemini:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Respuesta:', JSON.stringify(error.response.data, null, 2));
        }
        return generarAnalisisPorDefecto();
    }
};

function construirPromptAnalisis(texto, contexto) {
    return `Analiza este texto de una persona mayor con posible deterioro cognitivo.

Texto: "${texto}"

Devuelve SOLO un JSON válido con estas métricas (valores 0.0-1.0):

{
  "coherencia": <0.0-1.0>,
  "claridad": <0.0-1.0>,
  "riquezaLexica": <0.0-1.0>,
  "memoria": <0.0-1.0>,
  "emocion": <0.0-1.0>,
  "orientacion": <0.0-1.0>,
  "razonamiento": <0.0-1.0>,
  "atencion": <0.0-1.0>,
  "palabrasUnicas": <número>,
  "palabrasTotales": <número>,
  "longitudPromedioPalabras": <número>,
  "pausas": <número>,
  "repeticiones": <número>,
  "observaciones": "breve observación clínica",
  "alertas": ["señales de alerta si existen"]
}

Responde SOLO con el JSON.`;
}

function parsearAnalisis(textoAnalisis) {
    try {
        let jsonText = textoAnalisis;
        const codeBlockMatch = textoAnalisis.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
            jsonText = codeBlockMatch[1];
        } else {
            const jsonMatch = textoAnalisis.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonText = jsonMatch[0];
            }
        }

        console.log('🔍 JSON extraído:', jsonText.substring(0, 300));

        const analisis = JSON.parse(jsonText);

        const metricas = {
            coherencia: Math.min(Math.max(analisis.coherencia || 0.5, 0), 1),
            claridad: Math.min(Math.max(analisis.claridad || 0.5, 0), 1),
            riquezaLexica: Math.min(Math.max(analisis.riquezaLexica || 0.5, 0), 1),
            memoria: Math.min(Math.max(analisis.memoria || 0.5, 0), 1),
            emocion: Math.min(Math.max(analisis.emocion || 0.5, 0), 1),
            orientacion: Math.min(Math.max(analisis.orientacion || 0.5, 0), 1),
            razonamiento: Math.min(Math.max(analisis.razonamiento || 0.5, 0), 1),
            atencion: Math.min(Math.max(analisis.atencion || 0.5, 0), 1),
            palabrasUnicas: analisis.palabrasUnicas || 0,
            palabrasTotales: analisis.palabrasTotales || 0,
            longitudPromedioPalabras: analisis.longitudPromedioPalabras || 0,
            pausas: analisis.pausas || 0,
            repeticiones: analisis.repeticiones || 0,
            observaciones: analisis.observaciones || '',
            alertas: Array.isArray(analisis.alertas) ? analisis.alertas : [],
            fechaAnalisis: new Date()
        };

        metricas.puntuacionGlobal = calcularPuntuacionGlobal(metricas);

        return metricas;
    } catch (error) {
        console.error('❌ Error al parsear análisis:', error.message);
    }

    return generarAnalisisPorDefecto();
}

function generarAnalisisPorDefecto() {
    const metricas = {
        coherencia: 0.7,
        claridad: 0.7,
        riquezaLexica: 0.6,
        memoria: 0.7,
        emocion: 0.6,
        orientacion: 0.7,
        razonamiento: 0.7,
        atencion: 0.7,
        palabrasUnicas: 0,
        palabrasTotales: 0,
        longitudPromedioPalabras: 0,
        pausas: 0,
        repeticiones: 0,
        observaciones: 'Análisis no disponible - configurar Vertex AI',
        alertas: [],
        fechaAnalisis: new Date()
    };

    metricas.puntuacionGlobal = calcularPuntuacionGlobal(metricas);

    return metricas;
}

export const calcularPuntuacionGlobal = (analisis) => {
    const pesos = {
        coherencia: 0.20,
        claridad: 0.15,
        riquezaLexica: 0.10,
        memoria: 0.20,
        emocion: 0.05,
        orientacion: 0.15,
        razonamiento: 0.10,
        atencion: 0.05
    };

    let puntuacion = 0;
    for (const [metrica, peso] of Object.entries(pesos)) {
        puntuacion += (analisis[metrica] || 0) * peso;
    }

    return Math.round(puntuacion * 100);
};

export const detectarDesviaciones = (analisisActual, lineaBase, umbral = 0.15) => {
    const desviaciones = [];

    const metricas = ['coherencia', 'claridad', 'memoria', 'orientacion', 'razonamiento'];

    for (const metrica of metricas) {
        const valorActual = analisisActual[metrica] || 0;
        const valorBase = lineaBase[metrica] || 0;
        const diferencia = valorBase - valorActual;

        if (diferencia > umbral) {
            const porcentaje = Math.round((diferencia / valorBase) * 100);
            desviaciones.push({
                metrica,
                valorAnterior: valorBase,
                valorActual,
                diferencia,
                porcentaje,
                severidad: diferencia > 0.3 ? 'alta' : diferencia > 0.2 ? 'media' : 'baja'
            });
        }
    }

    return desviaciones;
};

export const generarRecomendaciones = (desviaciones) => {
    const recomendaciones = [];

    for (const desv of desviaciones) {
        switch (desv.metrica) {
            case 'coherencia':
                recomendaciones.push({
                    tipo: 'atencion',
                    mensaje: 'Se detectó disminución en la coherencia del discurso. Considerar evaluación adicional.',
                    prioridad: desv.severidad
                });
                break;
            case 'memoria':
                recomendaciones.push({
                    tipo: 'memoria',
                    mensaje: 'Posible deterioro en la memoria. Recomendar ejercicios de estimulación cognitiva.',
                    prioridad: desv.severidad
                });
                break;
            case 'orientacion':
                recomendaciones.push({
                    tipo: 'orientacion',
                    mensaje: 'Dificultades en la orientación. Evaluar capacidad para actividades diarias.',
                    prioridad: desv.severidad
                });
                break;
            case 'claridad':
                recomendaciones.push({
                    tipo: 'comunicacion',
                    mensaje: 'Disminución en la claridad de expresión. Monitorear evolución.',
                    prioridad: desv.severidad
                });
                break;
            case 'razonamiento':
                recomendaciones.push({
                    tipo: 'razonamiento',
                    mensaje: 'Cambios en la capacidad de razonamiento. Considerar ajuste en el plan de cuidados.',
                    prioridad: desv.severidad
                });
                break;
        }
    }

    return recomendaciones;
};
