import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { DialogBox } from '../ui/DialogBox';
import { LevelHud } from '../ui/LevelHud';
import { LevelCompletePanel } from '../ui/LevelCompletePanel';
import {
  PlayerProgress,
  type DecorationConfig,
  type LevelConfig,
  type PetVisual,
} from '../levels/LevelTypes';
import { levels } from '../levels/levelRegistry';

interface LevelStartData {
  levelId?: string;
}

type HorizontalControl = 'left' | 'right';
type ArcadeOverlapObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export abstract class BaseLevelScene extends Phaser.Scene {
  protected player!: Player;
  protected level!: LevelConfig;

  private progress!: PlayerProgress;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private checkpoints!: Phaser.Physics.Arcade.StaticGroup;
  private collectibles!: Phaser.Physics.Arcade.StaticGroup;
  private exits!: Phaser.Physics.Arcade.StaticGroup;
  private npcs!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Enemy[] = [];
  private hud!: LevelHud;
  private dialog!: DialogBox;
  private completionPanel?: LevelCompletePanel;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private readonly touchPointers = new Map<number, HorizontalControl>();
  private exitNearby = false;
  private interactionButton?: Phaser.GameObjects.Rectangle;
  private interactionLabel?: Phaser.GameObjects.Text;
  private exitPrompt?: Phaser.GameObjects.Text;
  private readonly visitedNpcs = new Set<string>();
  private damageAvailableAt = 0;
  private knockbackUntil = 0;
  private transitioning = false;
  private exitTriggered = false;
  private jumpscareActive = false;

  protected abstract getLevel(levelId: string): LevelConfig;

  init(data: LevelStartData = {}): void {
    this.level = this.getLevel(data.levelId ?? '');
    this.exitNearby = false;
    this.exitPrompt = undefined;
    this.interactionButton = undefined;
    this.interactionLabel = undefined;
    this.completionPanel = undefined;
    this.visitedNpcs.clear();
    this.touchPointers.clear();
    this.damageAvailableAt = 0;
    this.knockbackUntil = 0;
    this.transitioning = false;
    this.exitTriggered = false;
    this.jumpscareActive = false;
  }

  create(): void {
    this.progress = this.getProgress();
    if (this.progress.currentLevelId !== this.level.id) {
      this.progress.currentLevelId = this.level.id;
      this.progress.checkpoint = {
        id: 'start',
        levelId: this.level.id,
        ...this.level.spawn,
      };
    }

    const { width, height } = this.level.world;
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor(this.level.world.backgroundColor ?? '#9bdaf4');
    this.drawBackdrop(width, height);
    this.createPlatforms();
    this.drawDecorations();
    this.createPlayer();
    this.createLevelObjects();
    this.createControls();
    this.hud = new LevelHud(this);
    this.dialog = new DialogBox(this);
    this.hud.update(this.level.name, this.level.objective, this.progress);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.touchPointers.clear());
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.checkpoints,
      this.activateCheckpoint,
      undefined,
      this,
    );
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.npcs, this.talkToNpc, undefined, this);
  }

  override update(): void {
    if (this.transitioning || this.jumpscareActive || this.dialog?.isOpen) {
      this.player.setVelocityX(0);
      return;
    }

    const direction =
      Number(this.cursors.right.isDown || this.keyD.isDown || this.isTouching('right')) -
      Number(this.cursors.left.isDown || this.keyA.isDown || this.isTouching('left'));
    if (this.time.now >= this.knockbackUntil) {
      this.player.move(direction);
    }
    this.player.updateAnimation(direction);
    this.updateExitPrompt();

    if (this.player.x < 19) {
      this.player.setX(19).setVelocityX(0);
    } else if (this.player.x > this.level.world.width - 19) {
      this.player.setX(this.level.world.width - 19).setVelocityX(0);
    }

    if (this.player.y > this.level.world.height + 60) {
      this.loseLife();
    }
  }

  private getProgress(): PlayerProgress {
    const current = this.registry.get('playerProgress');
    if (current instanceof PlayerProgress) return current;
    const progress = new PlayerProgress();
    this.registry.set('playerProgress', progress);
    return progress;
  }

  private drawBackdrop(width: number, height: number): void {
    if (
      this.level.world.backgroundStyle === 'university' &&
      this.textures.exists('level-university-background')
    ) {
      const scale =
        height / this.textures.get('level-university-background').getSourceImage().height;
      this.add
        .tileSprite(0, 0, width, height, 'level-university-background')
        .setOrigin(0)
        .setTileScale(scale)
        .setScrollFactor(0.25)
        .setDepth(-20);
      return;
    }

    const graphics = this.add.graphics();
    if (this.level.world.backgroundStyle === 'apartment') {
      graphics.fillStyle(0xe7e0df);
      graphics.fillRect(0, 0, width, height * 0.78);
      graphics.fillStyle(0xc8bcb8);
      graphics.fillRect(0, height * 0.75, width, 18);
      graphics.fillStyle(0xd7cdca);
      for (let x = 0; x < width; x += 210) {
        graphics.fillRect(x, 0, 4, height * 0.75);
      }
      graphics.fillStyle(0x827b80);
      graphics.fillRect(0, height * 0.75 + 18, width, 10);
      graphics.setDepth(-20);
    } else if (this.level.world.backgroundStyle === 'yard') {
      graphics.fillStyle(0xa9def2);
      graphics.fillRect(0, 0, width, height);
      graphics.fillStyle(0xffe6a0);
      graphics.fillCircle(width * 0.76, height * 0.22, 48);
      graphics.fillStyle(0x91c98b);
      graphics.fillEllipse(width * 0.25, height * 0.72, width * 0.75, 190);
      graphics.fillStyle(0x7fb47d);
      graphics.fillEllipse(width * 0.76, height * 0.78, width * 0.82, 220);
      graphics.setDepth(-20);
    } else if (this.level.world.backgroundStyle === 'home') {
      graphics.fillStyle(0xf4e4d5);
      graphics.fillRect(0, 0, width, height * 0.78);
      graphics.fillStyle(0xd7b9a6);
      graphics.fillRect(0, height * 0.75, width, 18);
      graphics.fillStyle(0xead1be);
      for (let x = 0; x < width; x += 280) {
        graphics.fillRect(x, 0, 3, height * 0.75);
      }
      graphics.fillStyle(0x8f6d68);
      graphics.fillRect(0, height * 0.75 + 18, width, 9);
      graphics.setDepth(-20);
    } else if (this.level.world.backgroundStyle === 'sunset') {
      graphics.fillStyle(0xffdf9c, 0.9);
      graphics.fillCircle(width * 0.78, height * 0.3, 48);
      graphics.fillStyle(0x9a7186);
      graphics.fillEllipse(width * 0.38, height - 30, width * 0.8, 130);
      graphics.fillStyle(0x6e8a75);
      graphics.fillEllipse(width * 0.8, height - 12, width * 0.75, 115);
    } else {
      graphics.fillStyle(0xffffff, 0.48);
      graphics.fillCircle(180, 100, 31);
      graphics.fillCircle(218, 96, 41);
      graphics.fillCircle(255, 105, 30);
      graphics.fillStyle(0x8bc97c);
      graphics.fillEllipse(width * 0.45, height - 30, width * 0.8, 130);
    }
    graphics.setScrollFactor(0.25);
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    for (const platformConfig of this.level.platforms ?? []) {
      const platform = this.platforms.create(platformConfig.x, platformConfig.y, 'platform');
      platform.setDisplaySize(platformConfig.width, platformConfig.height ?? 24);
      platform.refreshBody();

      const ground = platformConfig.width >= this.level.world.width;
      const textureKey = ground ? 'level-ground-atlas' : 'level-platform-atlas';
      if (this.textures.exists(textureKey)) {
        const bodyHeight = platformConfig.height ?? 24;
        const visualHeight = 48;
        const colliderTop = platformConfig.y - bodyHeight / 2;
        const artFrameTop = ground ? 6 / 362 : 9 / 443;
        const visualTop = colliderTop - artFrameTop * visualHeight;
        const visualY = visualTop + visualHeight / 2;

        if (ground) {
          this.add
            .tileSprite(
              platformConfig.x,
              visualY,
              platformConfig.width,
              visualHeight,
              textureKey,
              9,
            )
            .setTileScale(0.9, visualHeight / 362)
            .setDepth(0);
        } else {
          this.add
            .image(platformConfig.x, visualY, textureKey, 1)
            .setDisplaySize(platformConfig.width, visualHeight)
            .setDepth(0);
        }
        platform.setVisible(false);
      }
    }
  }

  private createPlayer(): void {
    const spawn =
      this.progress.checkpoint.levelId === this.level.id
        ? this.progress.checkpoint
        : this.level.spawn;
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.setDepth(2);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private createLevelObjects(): void {
    this.checkpoints = this.physics.add.staticGroup();
    for (const checkpoint of this.level.checkpoints ?? []) {
      const marker = this.checkpoints.create(checkpoint.x, checkpoint.y, 'checkpoint');
      marker.setSize(34, 48).refreshBody();
      marker.setData('checkpointId', checkpoint.id);
    }

    this.collectibles = this.physics.add.staticGroup();
    for (const item of this.level.collectibles ?? []) {
      const collectibleId = `${this.level.id}:${item.id}`;
      if (this.progress.collectedIds.includes(collectibleId)) continue;
      const sprite = this.collectibles.create(item.x, item.y, item.kind);
      sprite.setSize(28, 28).refreshBody();
      sprite.setData('collectibleId', collectibleId);
      sprite.setData('collectibleKind', item.kind);
      if (item.message) sprite.setData('message', item.message);
    }

    this.enemies = (this.level.enemies ?? []).map((enemyConfig) => {
      const enemy = new Enemy(this, enemyConfig);
      enemy.setData('enemyId', enemyConfig.id);
      if (enemyConfig.kind === 'exam') {
        this.add
          .text(enemyConfig.x, enemyConfig.y - 52, 'EL PARCIAL', {
            fontFamily: 'Trebuchet MS, Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#452d4a',
            backgroundColor: '#ffffffcc',
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5)
          .setDepth(3);
      }
      return enemy;
    });
    this.npcs = this.physics.add.staticGroup();
    for (const npc of this.level.npcs ?? []) {
      const texture =
        npc.visual === 'renzo' && this.textures.exists('renzo-idle-sheet')
          ? 'renzo-idle-sheet'
          : npc.visual === 'renzo'
            ? 'renzo'
            : npc.visual === 'panchito' && this.textures.exists('panchito-sheet')
              ? 'panchito-sheet'
              : npc.visual === 'oliver' && this.textures.exists('oliver-sheet')
                ? 'oliver-sheet'
                : npc.visual === 'peach' && this.textures.exists('peach-sheet')
                  ? 'peach-sheet'
                  : npc.visual === 'rex' && this.textures.exists('rex-sheet')
                    ? 'rex-sheet'
                    : npc.visual === 'silvestre' && this.textures.exists('silvestre-sheet')
                      ? 'silvestre-sheet'
                      : npc.visual === 'chocolatin' && this.textures.exists('chocolatin-sheet')
                        ? 'chocolatin-sheet'
                        : npc.visual === 'canelo' && this.textures.exists('canelo-sheet')
                          ? 'canelo-sheet'
                          : npc.visual === 'phone'
                            ? 'phone-interaction'
                            : npc.visual === 'elevator'
                              ? 'elevator-interaction'
                              : npc.visual
                                ? `pet-${npc.visual}`
                                : 'npc';
      const sprite = this.npcs.create(npc.x, npc.y, texture);
      sprite.setDepth(2);
      if (npc.visual === 'renzo') {
        const scale = this.textures.get(texture).getSourceImage().height > 50 ? 0.19 : 1.5;
        sprite
          .setScale(scale)
          .setSize(20 / scale, 42 / scale)
          .refreshBody();
        if (this.anims.exists('renzo-idle')) sprite.play('renzo-idle');
      } else if (npc.visual === 'panchito' && this.textures.exists('panchito-sheet')) {
        const size = this.petDisplaySize(npc.visual);
        sprite
          .setDisplaySize(size.width, size.height)
          .setSize(size.width * 0.8, size.height * 0.8)
          .refreshBody();
        if (this.anims.exists('panchito-idle')) sprite.play('panchito-idle');
      } else if (npc.visual === 'oliver' && this.textures.exists('oliver-sheet')) {
        const size = this.petDisplaySize(npc.visual);
        sprite
          .setDisplaySize(size.width, size.height)
          .setSize(size.width * 0.8, size.height * 0.8)
          .refreshBody();
        if (this.anims.exists('oliver-idle')) sprite.play('oliver-idle');
      } else if (npc.visual === 'peach' && this.textures.exists('peach-sheet')) {
        const size = this.petDisplaySize(npc.visual);
        sprite
          .setDisplaySize(size.width, size.height)
          .setSize(size.width * 0.8, size.height * 0.8)
          .refreshBody();
        if (this.anims.exists('peach-idle')) sprite.play('peach-idle');
      } else if (npc.visual === 'rex' && this.textures.exists('rex-sheet')) {
        const size = this.petDisplaySize(npc.visual);
        sprite
          .setDisplaySize(size.width, size.height)
          .setSize(size.width * 0.8, size.height * 0.8)
          .refreshBody();
        if (this.anims.exists('rex-idle')) sprite.play('rex-idle');
      } else if (npc.visual === 'silvestre' && this.textures.exists('silvestre-sheet')) {
        const size = this.petDisplaySize(npc.visual);
        sprite
          .setDisplaySize(size.width, size.height)
          .setSize(size.width * 0.8, size.height * 0.8)
          .refreshBody();
        if (this.anims.exists('silvestre-idle')) sprite.play('silvestre-idle');
      } else if (npc.visual === 'chocolatin' && this.textures.exists('chocolatin-sheet')) {
        const size = this.petDisplaySize(npc.visual);
        sprite
          .setDisplaySize(size.width, size.height)
          .setSize(size.width * 0.8, size.height * 0.8)
          .refreshBody();
        if (this.anims.exists('chocolatin-idle')) sprite.play('chocolatin-idle');
      } else if (npc.visual === 'canelo' && this.textures.exists('canelo-sheet')) {
        const size = this.petDisplaySize(npc.visual);
        sprite
          .setDisplaySize(size.width, size.height)
          .setSize(size.width * 0.8, size.height * 0.8)
          .refreshBody();
        if (this.anims.exists('canelo-idle')) sprite.play('canelo-idle');
      } else if (this.isPetVisual(npc.visual)) {
        const size = this.petDisplaySize(npc.visual);
        sprite.setSize(size.width * 0.8, size.height * 0.8).refreshBody();
      } else if (npc.visual === 'elevator') {
        sprite.setSize(50, 48).refreshBody();
      } else {
        sprite.setSize(32, 44);
        sprite.refreshBody();
      }
      sprite.setData('npcId', npc.id);
      sprite.setData('dialogue', npc.dialogue);
      sprite.setData('label', npc.label);
      sprite.setData('npcVisual', npc.visual);
      sprite.setData('effect', npc.effect);
      this.add
        .text(npc.x, npc.y - 39, npc.label, {
          fontFamily: 'Trebuchet MS, Arial, sans-serif',
          fontSize: '13px',
          color: '#452d4a',
          backgroundColor: '#ffffffbb',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(3);
    }

    this.exits = this.physics.add.staticGroup();
    const exit = this.exits.create(this.level.exit.x, this.level.exit.y, 'exit');
    exit.setSize(38, 54).refreshBody();
    if (this.level.decorations?.some(({ kind }) => kind === 'terminal')) exit.setAlpha(0);
  }

  private createControls(): void {
    if (!this.input.keyboard) {
      throw new Error('No se pudo inicializar el teclado del nivel.');
    }
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      if (this.jumpscareActive) return;
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        if (this.dialog?.isOpen) this.dialog.dismiss();
        else if (!this.transitioning) this.player.jump();
      } else if (event.code === 'KeyE' && this.exitNearby) {
        this.reachExit();
      } else if ((event.code === 'Enter' || event.code === 'Escape') && this.dialog?.isOpen) {
        this.dialog.dismiss();
      }
    });
    this.input.addPointer(2);
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.touchPointers.delete(pointer.id);
    });
    this.input.on('gameout', () => this.touchPointers.clear());
    this.createTouchButton(66, 452, '◀', 'left');
    this.createTouchButton(164, 452, '▶', 'right');
    this.createTouchButton(875, 452, 'SALTAR', 'jump');
    this.createTouchButton(715, 452, 'INTERACTUAR', 'interact');
  }

  private createTouchButton(
    x: number,
    y: number,
    label: string,
    action: HorizontalControl | 'jump' | 'interact',
  ): void {
    const button = this.add
      .rectangle(
        x,
        y,
        action === 'jump' ? 126 : action === 'interact' ? 150 : 78,
        72,
        0x38243e,
        0.62,
      )
      .setStrokeStyle(2, 0xffffff, 0.72)
      .setScrollFactor(0)
      .setDepth(15)
      .setInteractive();
    const buttonText = this.add
      .text(x, y, label, {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: action === 'jump' || action === 'interact' ? '13px' : '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(16);
    if (action === 'interact') {
      this.interactionButton = button;
      this.interactionLabel = buttonText;
      button.setVisible(false);
      buttonText.setVisible(false);
    }
    button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (action === 'jump') {
        if (!this.transitioning && !this.jumpscareActive && !this.dialog.isOpen) {
          this.player.jump();
        }
      } else if (action === 'interact') {
        if (this.exitNearby && !this.transitioning) this.reachExit();
      } else {
        this.touchPointers.set(pointer.id, action);
      }
    });
  }

  private activateCheckpoint(_player: ArcadeOverlapObject, checkpoint: ArcadeOverlapObject): void {
    if (!(checkpoint instanceof Phaser.GameObjects.Sprite)) return;
    const id = checkpoint.getData('checkpointId') as string;
    if (this.progress.checkpoint.id === id) return;
    this.progress.checkpoint = {
      id,
      levelId: this.level.id,
      x: checkpoint.x,
      y: checkpoint.y - 42,
    };
    checkpoint.setTint(0xffe7a0);
    this.hud.update(this.level.name, this.level.objective, this.progress);
  }

  private collectItem(_player: ArcadeOverlapObject, item: ArcadeOverlapObject): void {
    if (!(item instanceof Phaser.GameObjects.Sprite)) return;
    const collectibleId = item.getData('collectibleId') as string;
    const kind = item.getData('collectibleKind') as 'notes' | 'heart' | 'star';
    const message = item.getData('message');
    this.progress.collectedIds.push(collectibleId);
    this.progress.collectibles += 1;
    if (kind === 'notes') this.progress.notes += 1;
    else if (kind === 'heart') {
      this.progress.hearts += 1;
      this.progress.health = Math.min(3, this.progress.health + 1);
    } else this.progress.stars += 1;
    item.destroy();
    this.hud.update(this.level.name, this.level.objective, this.progress);
    if (kind === 'notes' && typeof message === 'string') {
      this.showDialog(message);
    }
  }

  private hitEnemy(_player: ArcadeOverlapObject, other: ArcadeOverlapObject): void {
    if (!(other instanceof Enemy) || !other.active) return;
    const body = this.player.body;
    if (
      body instanceof Phaser.Physics.Arcade.Body &&
      body.velocity.y > 0 &&
      this.player.y < other.y - 10
    ) {
      const { x, y } = other;
      const enemyKind = other.getData('enemyKind') as string;
      const defeatMessage =
        enemyKind === 'ghost'
          ? '¡FANTASMITA ESPANTADO!'
          : enemyKind === 'cockroach'
            ? '¡CUCARACHA ESPANTADA!'
            : enemyKind === 'scorpion'
              ? '¡ALACRÁN ESPANTADO!'
              : '¡APROBADO!';
      other.playDefeatAnimation();
      body.setVelocityY(-260);
      const approved = this.add
        .text(x, y - 35, defeatMessage, {
          fontFamily: 'Trebuchet MS, Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#452d4a',
          strokeThickness: 4,
        })
        .setDepth(12);
      this.tweens.add({
        targets: approved,
        y: y - 75,
        alpha: 0,
        duration: 1000,
        onComplete: () => approved.destroy(),
      });
      return;
    }
    this.loseLife(other.x);
  }

  private loseLife(enemyX?: number): void {
    if (this.time.now < this.damageAvailableAt || this.transitioning) return;
    this.damageAvailableAt = this.time.now + 900;
    this.progress.health -= 1;
    this.hud.update(this.level.name, this.level.objective, this.progress);

    if (this.progress.health <= 0) {
      this.progress.health = 3;
      this.progress.currentLevelId = this.level.id;
      this.progress.checkpoint = {
        id: 'start',
        levelId: this.level.id,
        ...this.level.spawn,
      };
      this.showDialog('Sin vidas. El nivel se reinicia desde el comienzo.', () => {
        this.scene.restart({ levelId: this.level.id });
      });
      return;
    }

    if (enemyX === undefined) {
      this.player.resetAt(this.progress.checkpoint.x, this.progress.checkpoint.y);
    } else {
      const direction = Math.sign(this.player.x - enemyX) || (this.player.flipX ? 1 : -1);
      this.knockbackUntil = this.time.now + 350;
      this.player.setVelocityX(direction * 300);
    }
    this.player.setTint(0xffffff);
    this.player.playDamageAnimation();
    this.time.delayedCall(350, () => this.player.clearTint());
  }

  private talkToNpc(_player: ArcadeOverlapObject, npc: ArcadeOverlapObject): void {
    if (!(npc instanceof Phaser.GameObjects.Sprite)) return;
    const id = npc.getData('npcId') as string;
    if (this.visitedNpcs.has(id) || this.dialog.isOpen) return;
    this.visitedNpcs.add(id);
    const label = npc.getData('label') as string;
    const dialogue = npc.getData('dialogue') as string;
    if (npc.getData('effect') === 'jumpscare') {
      this.showGhostJumpscare(() => this.showDialog(`${label}: ${dialogue}`));
      return;
    }
    if (npc.getData('npcVisual') === 'panchito' && this.anims.exists('panchito-surprised')) {
      npc.play('panchito-surprised');
      npc.once('animationcomplete-panchito-surprised', () => {
        if (npc.active && this.anims.exists('panchito-idle')) npc.play('panchito-idle');
      });
    }
    if (npc.getData('npcVisual') === 'rex' && this.anims.exists('rex-surprised')) {
      npc.play('rex-surprised');
      npc.once('animationcomplete-rex-surprised', () => {
        if (npc.active && this.anims.exists('rex-idle')) npc.play('rex-idle');
      });
    }
    if (npc.getData('npcVisual') === 'chocolatin' && this.anims.exists('chocolatin-play')) {
      npc.play('chocolatin-play');
      npc.once('animationcomplete-chocolatin-play', () => {
        if (npc.active && this.anims.exists('chocolatin-idle')) npc.play('chocolatin-idle');
      });
    }
    if (npc.getData('npcVisual') === 'canelo' && this.anims.exists('canelo-treat')) {
      npc.play('canelo-treat');
      npc.once('animationcomplete-canelo-treat', () => {
        if (npc.active && this.anims.exists('canelo-idle')) npc.play('canelo-idle');
      });
    }
    if (npc.getData('npcVisual') === 'renzo' && this.anims.exists('renzo-interact')) {
      npc.play('renzo-interact');
      npc.once('animationcomplete-renzo-interact', () => {
        if (!npc.active) return;
        if (this.textures.exists('renzo-idle-sheet')) {
          npc.setTexture('renzo-idle-sheet', 0);
        }
        if (this.anims.exists('renzo-idle')) npc.play('renzo-idle');
      });
    }
    this.showDialog(`${label}: ${dialogue}`);
  }

  private showGhostJumpscare(onDismiss: () => void): void {
    const { width, height } = this.scale.gameSize;
    const body = this.player.body;
    const previousBodyState =
      body instanceof Phaser.Physics.Arcade.Body
        ? {
            allowGravity: body.allowGravity,
            velocityX: body.velocity.x,
            velocityY: body.velocity.y,
          }
        : undefined;

    this.jumpscareActive = true;
    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
    }

    const backdrop = this.add
      .rectangle(width / 2, height / 2, width, height, 0x08030e, 0.97)
      .setScrollFactor(0)
      .setDepth(70)
      .setInteractive();
    const faceGraphics = this.add.graphics();
    faceGraphics.setPosition(-150, -150);
    faceGraphics.fillStyle(0xd8d6e5, 1);
    faceGraphics.fillEllipse(150, 150, 230, 270);
    faceGraphics.fillStyle(0xa6a3ba, 1);
    faceGraphics.fillTriangle(55, 93, 82, 5, 116, 83);
    faceGraphics.fillTriangle(184, 82, 220, 5, 244, 99);
    faceGraphics.fillStyle(0x170b20, 1);
    faceGraphics.fillEllipse(105, 133, 48, 72);
    faceGraphics.fillEllipse(195, 133, 48, 72);
    faceGraphics.fillStyle(0xff315d, 1);
    faceGraphics.fillCircle(105, 139, 13);
    faceGraphics.fillCircle(195, 139, 13);
    faceGraphics.fillStyle(0xffa2b5, 0.8);
    faceGraphics.fillCircle(105, 139, 5);
    faceGraphics.fillCircle(195, 139, 5);
    faceGraphics.fillStyle(0x2a1024, 1);
    faceGraphics.fillEllipse(150, 220, 86, 91);
    faceGraphics.fillStyle(0xfff0e6, 1);
    faceGraphics.fillTriangle(111, 199, 132, 202, 120, 232);
    faceGraphics.fillTriangle(135, 200, 156, 200, 145, 231);
    faceGraphics.fillTriangle(160, 200, 181, 198, 171, 231);
    faceGraphics.fillStyle(0x9a193b, 1);
    faceGraphics.fillEllipse(150, 255, 35, 17);

    const face = this.add
      .container(width / 2, height / 2, [faceGraphics])
      .setScrollFactor(0)
      .setDepth(71)
      .setScale(0.02);
    const prompt = this.add
      .text(width / 2, height - 52, '¡BU!  ·  TOCÁ PARA CONTINUAR', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: width < 540 ? '16px' : '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#3a1028',
        padding: { x: 14, y: 9 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(72)
      .setAlpha(0);

    let readyToDismiss = false;
    let dismissed = false;
    let dismiss = (): void => undefined;
    let onKeyDown = (_event: KeyboardEvent): void => undefined;
    const removeDismissListeners = (): void => {
      this.input.off('pointerdown', dismiss);
      this.input.keyboard?.off('keydown', onKeyDown);
    };
    dismiss = (): void => {
      if (!readyToDismiss || dismissed) return;
      dismissed = true;
      removeDismissListeners();
      this.tweens.add({
        targets: [backdrop, face, prompt],
        alpha: 0,
        duration: 220,
        onComplete: () => {
          backdrop.destroy();
          face.destroy();
          prompt.destroy();
          this.jumpscareActive = false;
          if (body instanceof Phaser.Physics.Arcade.Body && previousBodyState) {
            body.setAllowGravity(previousBodyState.allowGravity);
            body.setVelocity(previousBodyState.velocityX, previousBodyState.velocityY);
          }
          onDismiss();
        },
      });
    };
    onKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'Escape') {
        dismiss();
      }
    };
    this.input.on('pointerdown', dismiss);
    this.input.keyboard?.on('keydown', onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeDismissListeners);

    this.cameras.main.shake(420, 0.012);
    this.tweens.add({
      targets: face,
      scale: Math.max(width, height) / 230,
      duration: 560,
      ease: 'Back.Out',
      onComplete: () => {
        readyToDismiss = true;
        this.tweens.add({ targets: prompt, alpha: 1, duration: 180 });
      },
    });
    this.tweens.add({
      targets: face,
      angle: { from: -3, to: 3 },
      duration: 75,
      yoyo: true,
      repeat: 5,
    });
  }

  private showDialog(message: string, onDismiss?: () => void): void {
    const body = this.player.body;
    const previousState =
      body instanceof Phaser.Physics.Arcade.Body
        ? {
            allowGravity: body.allowGravity,
            velocityX: body.velocity.x,
            velocityY: body.velocity.y,
          }
        : undefined;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
    }

    this.dialog.show(message, () => {
      if (body instanceof Phaser.Physics.Arcade.Body && previousState) {
        body.setAllowGravity(previousState.allowGravity);
        body.setVelocity(previousState.velocityX, previousState.velocityY);
      }
      onDismiss?.();
    });
  }

  private reachExit(): void {
    if (this.transitioning || this.exitTriggered) return;
    this.transitioning = true;
    this.exitTriggered = true;
    this.player.resetAt(this.level.exit.x - 210, this.level.exit.y - 27);
    this.player.setDepth(26).playIdleAnimation();
    this.showRenzoScene();
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x171322, 0.34)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(25);
    this.cameras.main.flash(250, 255, 255, 255);
    this.playExitDialogue(0);
  }

  private playExitDialogue(index: number): void {
    const lines = this.level.exit.dialogue ?? [`${this.level.name} completado.`];
    if (index >= lines.length) {
      this.cameras.main.flash(250, 231, 119, 173);
      this.completionPanel = new LevelCompletePanel(this, this.level.exit.completionTitle);

      if (this.level.id === 'final') {
        this.completionPanel.showFinalAnniversaryCard(() => {
          this.cameras.main.fadeOut(250, 36, 29, 53);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Menu');
          });
        });
        return;
      }

      this.completionPanel.show(() => {
        this.cameras.main.fadeOut(250, 36, 29, 53);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          if (this.level.exit.nextLevelId) {
            if (levels[this.level.exit.nextLevelId]) {
              this.scene.restart({ levelId: this.level.exit.nextLevelId });
            } else {
              this.scene.start('Menu');
            }
          } else {
            this.scene.start('Menu');
          }
        });
      });
      return;
    }

    this.showDialog(lines[index], () => {
      this.playExitDialogue(index + 1);
    });
  }
}
