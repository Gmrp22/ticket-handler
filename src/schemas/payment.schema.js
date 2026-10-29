const { z } = require('zod');
const { oneOf, urlNumber } = require('./common.schema');

const SORT_FIELDS = ['name', 'code'];

// An ISO year has 52 or 53 weeks. The 28th of December is always in the last one, so its week
// number is the number of weeks of the year
const weeksInIsoYear = (year) => {
  const date = new Date(Date.UTC(year, 11, 28));
  const weekday = date.getUTCDay() || 7; // Monday is 1 and Sunday is 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday); // the Thursday of that week
  const dayOfYear = (date - Date.UTC(year, 0, 1)) / 86400000 + 1;
  return Math.ceil(dayOfYear / 7);
};

const paymentQuerySchema = z
  .object({
    year: urlNumber('a whole number', (number) =>
      number.min(1900, 'must be between 1900 and 2100').max(2100, 'must be between 1900 and 2100'),
    ),
    week: urlNumber('a whole number', (number) =>
      number.min(1, 'must be between 1 and 53').max(53, 'must be between 1 and 53'),
    ),
    sort: z.enum(SORT_FIELDS, oneOf(SORT_FIELDS)).default('name'),
    order: z.enum(['asc', 'desc'], oneOf(['asc', 'desc'])).default('asc'),
  })
  .superRefine(({ year, week }, context) => {
    // Only week 53 can be too big here, a bigger number already has its own message
    const weeks = weeksInIsoYear(year);
    if (week === 53 && weeks < 53) {
      context.addIssue({
        code: 'custom',
        path: ['week'],
        message: `the year ${year} only has ${weeks} weeks`,
      });
    }
  });

module.exports = { paymentQuerySchema, weeksInIsoYear };
