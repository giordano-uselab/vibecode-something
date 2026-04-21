import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { RainGenerator } from './rain';

describeSoundGeneratorContract('RainGenerator', () => new RainGenerator());
