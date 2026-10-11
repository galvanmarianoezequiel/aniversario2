import { LevelConfig } from './LevelTypes';

export const FIRST_LEVEL_ID = 'nivel-1';

export const levels: Record<string, LevelConfig> = {
  'nivel-1': {
    id: 'nivel-1',
    name: 'Nivel 1 · Miradas en el Aula y Globos de Agua',
    storyText: 'Nos conocimos en el mismo salón de la escuela. Entre miradas en el aula y pedirte la tarea para hablarte, ¡surgió todo! Recordamos los juegos con globos de agua en el patio para combatir el calor.',
    nextLevelId: 'nivel-2',
  },
  'nivel-2': {
    id: 'nivel-2',
    name: 'Nivel 2 · Charlas, Nervios y la Plaza del Amor',
    storyText: 'De hablar como "amigos" por WhatsApp y ponernos nerviosos al acercarnos, llegamos a aquel asiento el 01/10/2024. Me regalaste esa carta de amor inolvidable y comenzamos nuestra linda historia.',
    nextLevelId: 'nivel-3',
  },
  'nivel-3': {
    id: 'nivel-3',
    name: 'Nivel 3 · Mates, Pelis y Charlas en el Parque',
    storyText: 'Disfrutando la vida juntos: mirando televisión, saliendo a comer, abrazándonos a solas y caminando por el parque reflexionando sobre nuestro futuro mano a mano.',
    nextLevelId: 'final',
  },
  'final': {
    id: 'final',
    name: '¡2 Años Inolvidables!',
    storyText: '¡Muy bien hecho, mi Any! Por pasar el juego, ahora ve y besa a tu novio Mariano con un abrazo súper fuerte por su esfuerzo y el tuyo por una relación tan amorosa. ¡Sigamos muchos años más juntos!',
    nextLevelId: null,
  },
};
