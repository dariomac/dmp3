import RandomOrg from 'random-org';

var random = new RandomOrg({ apiKey: 'e0d25ec3-2d70-4262-ac6b-a0adcb3bb7eb' });

export const randomInt = async (min, max) => {
  try {
    const { random: { data } } = await random.generateIntegers({ min, max, n: 1 })
    return data[0];
  } catch (error) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
