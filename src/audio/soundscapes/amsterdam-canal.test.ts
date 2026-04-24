import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { AmsterdamCanalGenerator } from './amsterdam-canal';

describeSoundGeneratorContract('AmsterdamCanalGenerator', () => new AmsterdamCanalGenerator());
