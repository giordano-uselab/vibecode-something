import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { RomanPiazzaGenerator } from './roman-piazza';

describeSoundGeneratorContract('RomanPiazzaGenerator', () => new RomanPiazzaGenerator());
