import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { SteadyRainGenerator } from './rain';

describeSoundGeneratorContract('SteadyRainGenerator', () => new SteadyRainGenerator());
