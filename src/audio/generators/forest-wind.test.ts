import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { ForestWindGenerator } from './forest-wind';

describeSoundGeneratorContract('ForestWindGenerator', () => new ForestWindGenerator());
