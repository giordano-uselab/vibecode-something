import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { CoastalWindGenerator } from './coastal-wind';

describeSoundGeneratorContract('CoastalWindGenerator', () => new CoastalWindGenerator());
