import Phaser from 'phaser';
import { Player } from '../entities/Player';

type TouchAction = 'left' | 'right';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private readonly touchPointers = new Map<number, TouchAction>();
  private readonly spawnX = 80;
  private readonly spawnY = 390;
  private readonly worldWidth = 2200;
  private readonly worldHeight = 900;

  constructor() {
    super('Game');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBackgroundColor('#9bdaf4');
    this.drawBackdrop();
    this.createPlayer();
    this.createPlatforms();
    this.createKeyboardControls();
    this.createTouchControls();
    this.createHud();
  }

  override update(): void {
    const leftPressed = this.cursors.left.isDown || this.keyA.isDown;
    const rightPressed = this.cursors.right.isDown || this.keyD.isDown;
    const touchLeft = [...this.touchPointers.values()].includes('left');
    const touchRight = [...this.touchPointers.values()].includes('right');
    const direction = Number(rightPressed || touchRight) - Number(leftPressed || touchLeft);

    this.player.move(direction);

    if (this.player.x < 19) {
      this.player.setX(19).setVelocityX(0);
    } else if (this.player.x > this.worldWidth - 19) {
      this.player.setX(this.worldWidth - 19).setVelocityX(0);
    }

    if (this.player.y > this.worldHeight + 80) {
      this.touchPointers.clear();
      this.player.resetAt(this.spawnX, this.spawnY);
    }
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 0.55);
    graphics.fillCircle(165, 110, 28);
    graphics.fillCircle(195, 105, 37);
    graphics.fillCircle(230, 112, 27);
    graphics.fillCircle(940, 170, 31);
    graphics.fillCircle(975, 160, 42);
    graphics.fillCircle(1015, 170, 29);
    graphics.fillStyle(0x8bc97c);
    graphics.fillEllipse(390, 498, 750, 135);
    graphics.fillEllipse(1080, 505, 800, 155);
    graphics.fillEllipse(1770, 498, 780, 145);
    graphics.setScrollFactor(0.25);
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(180, 500, 380);
    this.addPlatform(475, 420, 190);
    this.addPlatform(735, 350, 180);
    this.addPlatform(1000, 430, 220);
    this.addPlatform(1285, 350, 180);
    this.addPlatform(1565, 420, 220);
    this.addPlatform(1855, 345, 210);
    this.addPlatform(2110, 500, 300);

    this.physics.add.collider(this.player, this.platforms);
  }

  private createPlayer(): void {
    this.player = new Player(this, this.spawnX, this.spawnY);
    this.player.setDepth(2);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private createKeyboardControls(): void {
    if (!this.input.keyboard) {
      throw new Error('No se pudo inicializar el teclado del juego.');
    }
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        this.player.jump();
      }
    });
  }

  private createTouchControls(): void {
    this.input.addPointer(2);
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.touchPointers.delete(pointer.id);
    });
    this.input.on('gameout', () => this.touchPointers.clear());

    this.createTouchButton(66, 452, '◀', 'left');
    this.createTouchButton(164, 452, '▶', 'right');
    this.createTouchButton(875, 452, 'SALTAR', 'jump');
  }

  private createTouchButton(
    x: number,
    y: number,
    label: string,
    action: TouchAction | 'jump',
  ): void {
    const button = this.add
      .rectangle(x, y, action === 'jump' ? 126 : 78, 72, 0x38243e, 0.62)
      .setStrokeStyle(2, 0xffffff, 0.72)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive();

    this.add
      .text(x, y, label, {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: action === 'jump' ? '15px' : '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (action === 'jump') {
        this.player.jump();
      } else {
        this.touchPointers.set(pointer.id, action);
      }
    });
  }

  private createHud(): void {
    this.add
      .text(20, 18, 'ANY & MARIANO · 2 AÑOS', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#452d4a',
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(5);

    this.add
      .text(20, 43, 'A / D o flechas · Espacio / W para saltar', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: '13px',
        color: '#452d4a',
        backgroundColor: '#ffffffaa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(5);
  }

  private addPlatform(x: number, y: number, width: number): void {
    const platform = this.platforms.create(x, y, 'platform');
    platform.setDisplaySize(width, 24);
    platform.refreshBody();
  }
}
