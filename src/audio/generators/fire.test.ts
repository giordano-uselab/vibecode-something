import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { FireGenerator } from './fire';

describeSoundGeneratorContract('FireGenerator', () => new FireGenerator());
