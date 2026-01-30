
import { randomInt as cryptoRandomInt } from 'crypto';

export const randomInt = async (min, max) => {
  return cryptoRandomInt(min, max + 1);
}
