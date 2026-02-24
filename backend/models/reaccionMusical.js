import mongoose from 'mongoose';

    const reaccionMusicalSchema = new mongoose.Schema({
        pacienteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        videoId: {
            type: String,
            required: true
        },
        tituloCancion: {
            type: String,
            default: ''
        },
        artistaCancion: {
            type: String,
            default: ''
        },
        thumbnailCancion: {
            type: String,
            default: ''
        },
        // Reacción emocional del paciente
        emocion: {
            type: String,
            enum: ['muy_feliz', 'feliz', 'neutral', 'triste', 'ansioso', 'sin_reaccion'],
            required: true
        },
        // Texto libre del paciente describiendo el recuerdo evocado
        recuerdo: {
            type: String,
            default: ''
        },
        // Nivel de nitidez del recuerdo
        nivelRecuerdo: {
            type: String,
            enum: ['ninguno', 'vago', 'claro', 'muy_claro'],
            default: 'ninguno'
        },
        // Nota añadida por el cuidador/familiar
        notasCuidador: {
            type: String,
            default: ''
        },
        // Si el médico ya revisó esta reacción
        revisadoPorMedico: {
            type: Boolean,
            default: false
        }
    }, {
        timestamps: true
    });

    // Índices para consultas frecuentes
    reaccionMusicalSchema.index({ pacienteId: 1, createdAt: -1 });
    reaccionMusicalSchema.index({ pacienteId: 1, videoId: 1 });

    export default mongoose.model('ReaccionMusical', reaccionMusicalSchema);