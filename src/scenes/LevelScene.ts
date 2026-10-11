import type { LevelConfig } from '../levels/LevelTypes';
import { FIRST_LEVEL_ID, levels } from '../levels/levelRegistry';
import { BaseLevelScene } from './BaseLevelScene';

export class LevelScene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level' });
  }

  protected getLevel(levelId: string): LevelConfig {
    const resolvedId = levelId || FIRST_LEVEL_ID;
    const level = levels[resolvedId];
    if (!level) {
      throw new Error(`No existe una configuración para el nivel "${resolvedId}".`);
    }
    return level;
  }
}
