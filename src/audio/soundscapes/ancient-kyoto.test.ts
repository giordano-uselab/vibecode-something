import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { AncientKyotoGenerator } from './ancient-kyoto';

describeSoundGeneratorContract('AncientKyotoGenerator', () => new AncientKyotoGenerator());
