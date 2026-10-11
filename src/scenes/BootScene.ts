import Phaser from 'phaser';
import { characterSpriteSheets, characterSpriteSheetUrls } from '../assets/characterSpriteSheets';
import { levelArtAssets, levelArtUrls } from '../assets/levelArt';
import type { PetVisual } from '../levels/LevelTypes';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const renzoPortraitUrl = characterSpriteSheetUrls['./characters/renzo/renzo.png'];
    if (renzoPortraitUrl) this.load.image('renzo', renzoPortraitUrl);

    for (const sheet of characterSpriteSheets) {
      const url = characterSpriteSheetUrls[sheet.path];
      if (!url) continue;
      this.load.spritesheet(sheet.textureKey, url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }

    for (const asset of levelArtAssets) {
      const url = levelArtUrls[asset.path];
      if (!url) continue;
      if (asset.type === 'spritesheet') {
        this.load.spritesheet(asset.key, url, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
        });
      } else {
        this.load.image(asset.key, url);
      }
    }
  }

  create(): void {
    this.createCharacterTexture('vicky-idle', 'vicky', 'idle');
    this.createCharacterTexture('player', 'vicky', 'idle');
    this.createCharacterTexture('vicky-walk-1', 'vicky', 'walk-1');
    this.createCharacterTexture('vicky-walk-2', 'vicky', 'walk-2');
    this.createCharacterTexture('vicky-jump', 'vicky', 'jump');
    this.createCharacterTexture('vicky-fall', 'vicky', 'fall');
    this.createCharacterTexture('vicky-damage', 'vicky', 'damage');
    this.createCharacterTexture('renzo', 'renzo', 'idle');
    this.createExamTexture();
    this.createGhostTexture();
    this.createBugTextures();
    this.createPlatformTexture();
    this.createPlaceholderTexture('collectible', 0xffcf5c, 24, 24);
    this.createCollectibleTextures();
    this.createPlaceholderTexture('enemy', 0x7961a8, 36, 42);
    this.createPlaceholderTexture('checkpoint', 0x6b9ce8, 34, 48);
    this.createPlaceholderTexture('npc', 0xf0a66b, 36, 48);
    this.createPhoneTexture();
    this.createElevatorTexture();
    this.createPetTextures();
    this.createPlaceholderTexture('exit', 0x54b889, 40, 56);
    this.createAnimations();
    this.scene.start('Menu');
  }

  private createCharacterTexture(
    key: string,
    character: 'vicky' | 'renzo',
    pose: 'idle' | 'walk-1' | 'walk-2' | 'jump' | 'fall' | 'damage',
  ): void {
    if (this.textures.exists(key)) return;
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const jumping = pose === 'jump' || pose === 'fall';
    const legOffset = pose === 'walk-1' ? -2 : pose === 'walk-2' ? 2 : 0;
    const skin = character === 'vicky' ? 0xf3c8a4 : 0xc9916e;
    const hair = character === 'vicky' ? 0x70452f : 0x211d27;
    const top = character === 'vicky' ? 0xe977ad : 0x557fc1;
    const legY = jumping ? 38 : 39;

    graphics.fillStyle(hair);
    graphics.fillRect(9, 3, 20, 7);
    graphics.fillRect(7, 8, 6, character === 'vicky' ? 20 : 7);
    graphics.fillRect(25, 8, 6, character === 'vicky' ? 17 : 7);
    if (character === 'vicky') graphics.fillRect(25, 17, 6, 14);
    graphics.fillStyle(skin);
    graphics.fillRect(12, 9, 14, 15);
    graphics.fillStyle(0x493126);
    graphics.fillRect(16, 15, 2, 2);
    graphics.fillRect(21, 15, 2, 2);
    graphics.fillStyle(top);
    graphics.fillRect(9, 24, 21, 14);
    if (character === 'vicky') {
      graphics.fillStyle(0xffd9ee);
      graphics.fillRect(17, 27, 6, 3);
    }
    graphics.fillStyle(0x463c48);
    graphics.fillRect(11, legY, 6, Math.max(4, 8 + legOffset));
    graphics.fillRect(22, legY, 6, Math.max(4, 8 - legOffset));
    if (pose === 'jump') {
      graphics.fillRect(3, 26, 7, 4);
      graphics.fillRect(30, 26, 7, 4);
    }
    if (pose === 'damage') {
      graphics.fillStyle(0xffffff);
      graphics.fillRect(8, 14, 3, 3);
      graphics.fillRect(29, 14, 3, 3);
    }
    graphics.generateTexture(key, 40, 50);
    graphics.destroy();
  }

  private createExamTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x5b4b58);
    graphics.fillRect(3, 5, 38, 40);
    graphics.fillStyle(0xfff8e8);
    graphics.fillRect(1, 2, 38, 40);
    graphics.fillStyle(0xe2d5c4);
    graphics.fillRect(7, 8, 23, 2);
    graphics.fillRect(7, 13, 18, 2);
    graphics.fillRect(7, 18, 21, 2);
    graphics.fillStyle(0x463c48);
    graphics.fillRect(11, 26, 3, 3);
    graphics.fillRect(25, 26, 3, 3);
    graphics.generateTexture('exam', 44, 48);
    graphics.destroy();
  }

  private createGhostTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xd8f4ff, 0.92);
    graphics.fillEllipse(24, 20, 34, 36);
    graphics.fillRoundedRect(7, 18, 34, 25, 11);
    graphics.fillTriangle(7, 36, 15, 47, 21, 36);
    graphics.fillTriangle(19, 37, 25, 47, 31, 37);
    graphics.fillTriangle(29, 36, 36, 46, 41, 35);
    graphics.fillStyle(0x17213a, 1);
    graphics.fillEllipse(17, 21, 5, 8);
    graphics.fillEllipse(31, 21, 5, 8);
    graphics.fillStyle(0x90d8ec, 0.85);
    graphics.fillCircle(18, 20, 1.5);
    graphics.fillCircle(32, 20, 1.5);
    graphics.generateTexture('ghost-enemy', 48, 50);
    graphics.destroy();
  }

  private createBugTextures(): void {
    const cockroach = this.make.graphics({ x: 0, y: 0 });
    cockroach.fillStyle(0x60351f, 1);
    cockroach.fillEllipse(24, 29, 30, 15);
    cockroach.fillStyle(0x9a5a2d, 1);
    cockroach.fillEllipse(25, 27, 22, 12);
    cockroach.fillStyle(0x452519, 1);
    cockroach.fillEllipse(37, 25, 9, 9);
    cockroach.fillStyle(0xffdf9a, 1);
    cockroach.fillCircle(39, 23, 1.5);
    cockroach.lineStyle(2, 0x452519, 1);
    cockroach.lineBetween(39, 21, 45, 12);
    cockroach.lineBetween(35, 21, 36, 11);
    cockroach.lineBetween(14, 30, 6, 25);
    cockroach.lineBetween(20, 35, 13, 43);
    cockroach.lineBetween(29, 35, 31, 44);
    cockroach.lineBetween(35, 31, 43, 38);
    cockroach.generateTexture('cockroach-enemy', 50, 48);
    cockroach.destroy();

    const scorpion = this.make.graphics({ x: 0, y: 0 });
    scorpion.fillStyle(0xb76d37, 1);
    scorpion.fillEllipse(22, 31, 24, 16);
    scorpion.fillStyle(0x704127, 1);
    scorpion.fillCircle(22, 31, 7);
    scorpion.lineStyle(3, 0x704127, 1);
    scorpion.lineBetween(13, 33, 7, 40);
    scorpion.lineBetween(19, 35, 17, 44);
    scorpion.lineBetween(27, 35, 31, 44);
    scorpion.lineBetween(32, 32, 39, 38);
    scorpion.lineStyle(4, 0x8b4a2c, 1);
    scorpion.beginPath();
    scorpion.moveTo(30, 27);
    scorpion.lineTo(38, 20);
    scorpion.lineTo(39, 12);
    scorpion.lineTo(34, 7);
    scorpion.strokePath();
    scorpion.fillStyle(0x39251f, 1);
    scorpion.fillTriangle(31, 8, 39, 5, 37, 13);
    scorpion.lineStyle(3, 0x704127, 1);
    scorpion.lineBetween(8, 28, 2, 22);
    scorpion.lineBetween(8, 31, 2, 35);
    scorpion.fillStyle(0xffd28a, 1);
    scorpion.fillCircle(18, 27, 2);
    scorpion.fillCircle(26, 27, 2);
    scorpion.generateTexture('scorpion-enemy', 48, 50);
    scorpion.destroy();
  }

  private createPlatformTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x754c71);
    graphics.fillRoundedRect(0, 5, 96, 19, 5);
    graphics.fillStyle(0x9ad17b);
    graphics.fillRoundedRect(0, 0, 96, 10, 4);
    graphics.generateTexture('platform', 96, 24);
    graphics.destroy();
  }

  private createPhoneTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x443d52);
    graphics.fillRoundedRect(4, 1, 24, 44, 5);
    graphics.fillStyle(0xfff3f7);
    graphics.fillRoundedRect(7, 5, 18, 32, 2);
    graphics.fillStyle(0xe977ad);
    graphics.fillCircle(16, 41, 2);
    graphics.fillStyle(0xd34f91);
    graphics.fillCircle(22, 9, 3);
    graphics.generateTexture('phone-interaction', 32, 46);
    graphics.destroy();
  }

  private createElevatorTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x5f5964);
    graphics.fillRect(2, 1, 54, 50);
    graphics.fillStyle(0xb6b4b8);
    graphics.fillRect(6, 5, 46, 42);
    graphics.fillStyle(0x78737d);
    graphics.fillRect(28, 5, 2, 42);
    graphics.fillStyle(0xffd88a);
    graphics.fillCircle(48, 9, 2);
    graphics.generateTexture('elevator-interaction', 58, 52);
    graphics.destroy();
  }

  private createPetTextures(): void {
    this.createPetTexture('panchito', 0x9f4d32, 0xd17b48, 60, 38);
    this.createPetTexture('oliver', 0xf4f0e9, 0x545460, 44, 36);
    this.createPetTexture('rex', 0xc89b69, 0x55545a, 72, 52);
    this.createPetTexture('silvestre', 0x888994, 0x62636d, 44, 36);
    this.createPetTexture('peach', 0xf3e7d2, 0x765064, 44, 36);
    this.createPetTexture('chocolatin', 0x70452f, 0x4a3028, 54, 40);
    this.createPetTexture('canelo', 0xf5f0e6, 0x9b6543, 56, 46);
  }

  private createPetTexture(
    pet: PetVisual,
    furColor: number,
    detailColor: number,
    width: number,
    height: number,
  ): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const isCat = pet === 'oliver' || pet === 'silvestre' || pet === 'peach';
    const isLargeDog = pet === 'rex';
    const bodyY = isLargeDog ? 21 : 15;
    const bodyHeight = isLargeDog ? 20 : pet === 'panchito' ? 13 : 15;
    const bodyX = pet === 'panchito' ? 5 : 8;
    const bodyWidth = width - bodyX - 12;

    graphics.fillStyle(furColor);
    graphics.fillRoundedRect(bodyX, bodyY, bodyWidth, bodyHeight, 6);
    graphics.fillCircle(width - 13, bodyY + 3, isLargeDog ? 13 : 10);
    graphics.fillRect(bodyX + 5, bodyY + bodyHeight - 1, 5, height - bodyY - bodyHeight + 1);
    graphics.fillRect(
      bodyX + bodyWidth - 10,
      bodyY + bodyHeight - 1,
      5,
      height - bodyY - bodyHeight + 1,
    );

    if (pet === 'canelo') {
      graphics.fillStyle(furColor);
      graphics.fillEllipse(width - 24, 8, 9, 19);
      graphics.fillEllipse(width - 11, 8, 9, 19);
      graphics.fillStyle(detailColor);
      graphics.fillEllipse(width - 24, 8, 4, 12);
      graphics.fillEllipse(width - 11, 8, 4, 12);
      graphics.fillEllipse(bodyX + 18, bodyY + 6, 17, 11);
      graphics.fillCircle(width - 17, 17, 1.5);
      graphics.fillCircle(width - 10, 17, 1.5);
      graphics.fillCircle(width - 13, 21, 2);
    } else if (isCat) {
      graphics.fillStyle(furColor);
      graphics.fillPoints(
        [
          new Phaser.Math.Vector2(width - 22, 9),
          new Phaser.Math.Vector2(width - 20, 1),
          new Phaser.Math.Vector2(width - 14, 8),
          new Phaser.Math.Vector2(width - 8, 1),
          new Phaser.Math.Vector2(width - 6, 10),
        ],
        true,
      );
      graphics.fillStyle(detailColor);
      if (pet === 'oliver') graphics.fillRect(bodyX + 3, bodyY + 2, 12, 7);
      if (pet === 'peach') {
        graphics.fillRect(width - 22, 9, 15, 13);
        graphics.fillRect(width - 21, 2, 5, 8);
        graphics.fillRect(width - 10, 2, 5, 8);
      }
      graphics.fillCircle(width - 16, 14, 1.5);
      graphics.fillCircle(width - 10, 14, 1.5);
      graphics.lineStyle(4, detailColor);
      graphics.beginPath();
      graphics.moveTo(bodyX + 4, bodyY + 5);
      graphics.lineTo(2, bodyY - 2);
      graphics.strokePath();
    } else {
      graphics.fillStyle(detailColor);
      if (pet === 'panchito') {
        graphics.fillRoundedRect(width - 22, 3, 8, 16, 4);
        graphics.fillRect(18, height - 8, 5, 8);
      } else {
        graphics.fillPoints(
          [
            new Phaser.Math.Vector2(width - 24, 15),
            new Phaser.Math.Vector2(width - 20, 2),
            new Phaser.Math.Vector2(width - 13, 16),
          ],
          true,
        );
        graphics.fillRect(19, height - 11, 6, 11);
      }
      graphics.fillCircle(width - 10, bodyY + 3, 2);
    }

    graphics.generateTexture(`pet-${pet}`, width, height);
    graphics.destroy();
  }

  private createPlaceholderTexture(
    key: string,
    color: number,
    width: number,
    height: number,
  ): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color);
    graphics.fillRoundedRect(1, 1, width - 2, height - 2, 7);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(width * 0.35, height * 0.35, 3);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private createCollectibleTextures(): void {
    const notes = this.make.graphics({ x: 0, y: 0 });
    notes.fillStyle(0xfff4c7);
    notes.fillRect(3, 2, 20, 25);
    notes.fillStyle(0xd28753);
    notes.fillRect(7, 8, 12, 2);
    notes.fillRect(7, 13, 10, 2);
    notes.fillRect(7, 18, 12, 2);
    notes.generateTexture('notes', 26, 30);
    notes.destroy();

    const heart = this.make.graphics({ x: 0, y: 0 });
    heart.fillStyle(0xe75d86);
    heart.fillRect(3, 5, 8, 8);
    heart.fillRect(15, 5, 8, 8);
    heart.fillRect(1, 9, 24, 8);
    heart.fillRect(5, 17, 16, 5);
    heart.fillRect(9, 22, 8, 5);
    heart.generateTexture('heart', 26, 29);
    heart.destroy();

    const star = this.make.graphics({ x: 0, y: 0 });
    star.fillStyle(0xffd04e);
    star.fillPoints(
      [
        new Phaser.Math.Vector2(14, 1),
        new Phaser.Math.Vector2(18, 10),
        new Phaser.Math.Vector2(28, 11),
        new Phaser.Math.Vector2(20, 18),
        new Phaser.Math.Vector2(22, 28),
        new Phaser.Math.Vector2(14, 23),
        new Phaser.Math.Vector2(6, 28),
        new Phaser.Math.Vector2(8, 18),
        new Phaser.Math.Vector2(1, 11),
        new Phaser.Math.Vector2(11, 10),
      ],
      true,
    );
    star.generateTexture('star', 30, 30);
    star.destroy();
  }

  private createAnimations(): void {
    const loadedAnimations = new Set<string>();
    for (const sheet of characterSpriteSheets) {
      if (!this.textures.exists(sheet.textureKey)) continue;
      const frames = sheet.frameIndices
        ? this.anims.generateFrameNumbers(sheet.textureKey, { frames: sheet.frameIndices })
        : this.anims.generateFrameNumbers(sheet.textureKey, {
            start: 0,
            end: sheet.frameCount - 1,
          });
      this.anims.create({
        key: sheet.animationKey,
        frames,
        frameRate: sheet.frameRate,
        repeat: sheet.repeat,
        yoyo: sheet.yoyo,
      });
      loadedAnimations.add(sheet.animationKey);
    }

    const createFallbackAnimation = (
      key: string,
      frames: Phaser.Types.Animations.AnimationFrame[],
      frameRate?: number,
      repeat?: number,
    ): void => {
      if (loadedAnimations.has(key)) return;
      this.anims.create({ key, frames, frameRate, repeat });
    };
    createFallbackAnimation('vicky-idle', [{ key: 'vicky-idle' }, { key: 'vicky-walk-1' }], 2, -1);
    createFallbackAnimation(
      'vicky-walk',
      [{ key: 'vicky-walk-1' }, { key: 'vicky-walk-2' }],
      8,
      -1,
    );
    createFallbackAnimation('vicky-jump', [{ key: 'vicky-jump' }]);
    createFallbackAnimation('vicky-land', [{ key: 'vicky-idle' }]);
    createFallbackAnimation('vicky-fall', [{ key: 'vicky-fall' }]);
    createFallbackAnimation('vicky-damage', [{ key: 'vicky-damage' }]);
    createFallbackAnimation('renzo-idle', [{ key: 'renzo' }], 1, -1);
    createFallbackAnimation('renzo-interact', [{ key: 'renzo' }], 1, 0);
    createFallbackAnimation('exam-float', [{ key: 'exam' }, { key: 'exam' }], 2, -1);
    if (this.textures.exists('panchito-sheet')) {
      createFallbackAnimation(
        'panchito-surprised',
        this.anims.generateFrameNumbers('panchito-sheet', { start: 3, end: 3 }),
        1,
        0,
      );
    }
    if (this.textures.exists('rex-sheet')) {
      createFallbackAnimation(
        'rex-surprised',
        this.anims.generateFrameNumbers('rex-sheet', { frames: [3] }),
        1,
        0,
      );
    }
    if (this.textures.exists('chocolatin-sheet')) {
      createFallbackAnimation(
        'chocolatin-play',
        this.anims.generateFrameNumbers('chocolatin-sheet', { frames: [3] }),
        1,
        0,
      );
    }
    if (this.textures.exists('canelo-sheet')) {
      createFallbackAnimation(
        'canelo-treat',
        this.anims.generateFrameNumbers('canelo-sheet', { frames: [3] }),
        1,
        0,
      );
    }
  }
}
