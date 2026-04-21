import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { WhiteNoiseGenerator } from './white-noise';

describeSoundGeneratorContract('WhiteNoiseGenerator', () => new WhiteNoiseGenerator());
