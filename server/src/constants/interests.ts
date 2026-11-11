export enum USER_INTERESTS {
  Chess = 'chess',
  Reading = 'reading',
  Music = 'music',
  Travel = 'travel',
  Sports = 'sports',
}

/**
 * Helper array for Mongoose `enum` validation – Mongoose expects a raw string array.
 */
export const USER_INTERESTS_VALUES = Object.values(USER_INTERESTS);
