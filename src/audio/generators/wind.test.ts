import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { WindGenerator } from './wind';

describeSoundGeneratorContract('WindGenerator', () => new WindGenerator());
