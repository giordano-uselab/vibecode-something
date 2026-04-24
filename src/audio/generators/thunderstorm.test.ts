import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { ThunderstormGenerator } from './thunderstorm';

describeSoundGeneratorContract('ThunderstormGenerator', () => new ThunderstormGenerator());
