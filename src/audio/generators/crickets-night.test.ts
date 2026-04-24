import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { CricketsNightGenerator } from './crickets-night';

describeSoundGeneratorContract('CricketsNightGenerator', () => new CricketsNightGenerator());
