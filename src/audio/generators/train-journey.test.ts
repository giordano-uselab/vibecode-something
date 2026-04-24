import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { TrainJourneyGenerator } from './train-journey';

describeSoundGeneratorContract('TrainJourneyGenerator', () => new TrainJourneyGenerator());
