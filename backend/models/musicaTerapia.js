musicaTerapia.js

import mongoose from 'mongoose';

const cancionSchema = new mongoose.Schema({
    videoId: {
        type: String,
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    artista: {
        type: String,
        default: 'Desconocido'
    },
    thumbnail: {
        type: String,
        default: ''
    },
    duracion: {
        type: String,
        default: ''
    },
    agregadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    fechaAgregado: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const musicaTerapiaSchema = new mongoose.Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        unique: true  // Un paciente → una playlist
    },
    canciones: {
        type: [cancionSchema],
        default: []
    }
}, {
    timestamps: true
});

export default mongoose.model('MusicaTerapia', musicaTerapiaSchema);