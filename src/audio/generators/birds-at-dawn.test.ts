import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { BirdsAtDawnGenerator } from './birds-at-dawn';

describeSoundGeneratorContract('BirdsAtDawnGenerator', () => new BirdsAtDawnGenerator());
