import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { FlowingRiverGenerator } from './flowing-river';

describeSoundGeneratorContract('FlowingRiverGenerator', () => new FlowingRiverGenerator());
