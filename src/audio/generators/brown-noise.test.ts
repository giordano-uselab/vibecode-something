import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { DeepWaterGenerator } from './brown-noise';

describeSoundGeneratorContract('DeepWaterGenerator', () => new DeepWaterGenerator());
