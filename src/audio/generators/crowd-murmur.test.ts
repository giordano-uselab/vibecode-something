import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { CrowdMurmurGenerator } from './crowd-murmur';

describeSoundGeneratorContract('CrowdMurmurGenerator', () => new CrowdMurmurGenerator());
