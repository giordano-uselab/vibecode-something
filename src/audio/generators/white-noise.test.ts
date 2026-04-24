import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { DeepSpaceGenerator } from './white-noise';

describeSoundGeneratorContract('DeepSpaceGenerator', () => new DeepSpaceGenerator());
