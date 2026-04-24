import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { HeavyDownpourGenerator } from './heavy-downpour';

describeSoundGeneratorContract('HeavyDownpourGenerator', () => new HeavyDownpourGenerator());
