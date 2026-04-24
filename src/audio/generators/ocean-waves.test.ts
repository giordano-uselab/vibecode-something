import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { OceanWavesGenerator } from './ocean-waves';

describeSoundGeneratorContract('OceanWavesGenerator', () => new OceanWavesGenerator());
