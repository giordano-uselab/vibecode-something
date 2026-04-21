import { describeSoundGeneratorContract } from '../../test-utils/sound-generator-contract';
import { CoffeeShopGenerator } from './coffee-shop';

describeSoundGeneratorContract('CoffeeShopGenerator', () => new CoffeeShopGenerator());
