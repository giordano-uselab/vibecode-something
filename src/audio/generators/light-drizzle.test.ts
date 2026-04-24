import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { LightDrizzleGenerator } from './light-drizzle';

describeSoundGeneratorContract('LightDrizzleGenerator', () => new LightDrizzleGenerator());
