import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { TibetanBowlGenerator } from './tibetan-bowl';

describeSoundGeneratorContract('TibetanBowlGenerator', () => new TibetanBowlGenerator());
