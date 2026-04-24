import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { CracklingFireGenerator } from './fire';

describeSoundGeneratorContract('CracklingFireGenerator', () => new CracklingFireGenerator());
