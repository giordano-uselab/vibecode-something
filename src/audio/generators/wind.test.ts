import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { GentleBreezeGenerator } from './wind';

describeSoundGeneratorContract('GentleBreezeGenerator', () => new GentleBreezeGenerator());
