
import Phaser from 'phaser';
import { PlayerProgress } from '../levels/LevelTypes';
import { FIRST_LEVEL_ID, levels } from '../levels/levelRegistry';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor('#9bdaf4');
    this.add.circle(125, 105, 43, 0xffe7a0);
    this.add.ellipse(centerX, height - 16, width + 180, 155, 0xa5d889);
    this.add.ellipse(centerX - 230, height + 12, 430, 120, 0x8bc97c);
    this.add.ellipse(centerX + 270, height + 16, 510, 120, 0x8bc97c);

    this.add
      .text(centerX, 155, 'Any & Mariano', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '60px',
        fontStyle: 'bold',
        color: '#fff8fc',
        stroke: '#a34279',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 217, 'La Aventura de 2 Años', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#452d4a',
      })
      .setOrigin(0.5);

    const startGame = (levelId: string = FIRST_LEVEL_ID): void => {
      this.registry.set('playerProgress', new PlayerProgress());
      this.scene.start('Level', { levelId });
    };

    const startButton = this.add
      .text(centerX, 300, 'JUGAR', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#d34f91',
        padding: { x: 22, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on('pointerdown', () => startGame());
    this.input.keyboard?.once('keydown-SPACE', () => startGame());
    this.input.keyboard?.once('keydown-ENTER', () => startGame());

    const levelSelect = document.createElement('select');
    levelSelect.title = 'Seleccioná un nivel';
    levelSelect.style.position = 'absolute';
    levelSelect.style.left = `${Math.max(50, centerX - 180)}px`;
    levelSelect.style.top = '390px';
    levelSelect.style.width = '360px';
    levelSelect.style.height = '40px';
    levelSelect.style.fontSize = '16px';
    levelSelect.style.fontFamily = 'Trebuchet MS, Arial, sans-serif';
    levelSelect.style.padding = '8px 12px';
    levelSelect.style.borderRadius = '10px';
    levelSelect.style.border = '2px solid #d34f91';
    levelSelect.style.background = '#fff7fb';
    levelSelect.style.color = '#452d4a';
    levelSelect.style.zIndex = '1000';
    levelSelect.style.boxShadow = '0 6px 18px rgba(69, 45, 74, 0.18)';

    Object.entries(levels).forEach(([levelId, level], index) => {
      const option = document.createElement('option');
      option.value = levelId;
      option.text = `Nivel ${index + 1} · ${level.name.replace(/^Nivel\s*\d+\s*·\s*/, '')}`;
      option.selected = levelId === FIRST_LEVEL_ID;
      levelSelect.appendChild(option);
    });

    const container = this.game.canvas.parentElement || document.body;
    container.appendChild(levelSelect);
    this.events.once('shutdown', () => levelSelect.remove());
    this.events.once('destroy', () => levelSelect.remove());

    startButton.on('pointerdown', () => {
      const selectedLevelId = levelSelect.value || FIRST_LEVEL_ID;
      startGame(selectedLevelId);
    });

    this.add
      .text(centerX, 350, 'SELECTOR DE NIVELES', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#452d4a',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 570, 'A / D o ← / → para moverte · Espacio para saltar', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '16px',
        color: '#452d4a',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 600, 'En móvil, usá los botones de la pantalla', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '15px',
        color: '#452d4a',
      })
      .setOrigin(0.5);
  }
}
