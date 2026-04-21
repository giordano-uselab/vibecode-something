import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { BrownNoiseGenerator } from './brown-noise';

describeSoundGeneratorContract('BrownNoiseGenerator', () => new BrownNoiseGenerator());
