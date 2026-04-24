import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { HorseHoovesGenerator } from './horse-hooves';

describeSoundGeneratorContract('HorseHoovesGenerator', () => new HorseHoovesGenerator());
