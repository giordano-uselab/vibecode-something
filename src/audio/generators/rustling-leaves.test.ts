import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { RustlingLeavesGenerator } from './rustling-leaves';

describeSoundGeneratorContract('RustlingLeavesGenerator', () => new RustlingLeavesGenerator());
