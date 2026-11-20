-- SkillForge starter questions.
-- Safe to rerun: a transaction-scoped advisory lock serializes seed runs,
-- and category/title checks skip questions that have already been inserted.
BEGIN;

SELECT pg_advisory_xact_lock(204857301);

WITH seed_questions (
  title, description, option_a, option_b, option_c, option_d,
  correct_option, explanation, category, difficulty
) AS (
  VALUES
  (
    'Add three quarters and one eighth',
    'What is 3/4 + 1/8?',
    '7/8', '5/8', '4/12', '1',
    'A', 'Convert 3/4 to 6/8, then add 1/8 to get 7/8.',
    'Maths', 'easy'
  ),
  (
    'Find fifteen percent of two hundred',
    'What is 15% of 200?',
    '25', '30', '35', '40',
    'B', '10% of 200 is 20 and 5% is 10, so 15% is 30.',
    'Maths', 'easy'
  ),
  (
    'Solve a two-step equation',
    'Solve 2x + 5 = 17.',
    '5', '6', '11', '12',
    'B', 'Subtract 5 from both sides to get 2x = 12, then divide by 2.',
    'Maths', 'medium'
  ),
  (
    'Area of a circle with radius seven',
    'A circle has radius 7 cm. Using pi = 22/7, what is its area?',
    '44 cm squared', '77 cm squared', '154 cm squared', '308 cm squared',
    'C', 'Area is pi times r squared: (22/7) times 49 = 154 square centimetres.',
    'Maths', 'medium'
  ),
  (
    'Find the larger quadratic root',
    'What is the larger root of x squared minus 7x plus 12 equals zero?',
    '2', '3', '4', '6',
    'C', 'Factor the expression as (x - 3)(x - 4), so the roots are 3 and 4.',
    'Maths', 'hard'
  ),
  (
    'Least common multiple of eighty-four and one hundred twenty-six',
    'What is the least common multiple of 84 and 126?',
    '168', '210', '252', '504',
    'C', 'The greatest common divisor is 42. The least common multiple is 84 times 126 divided by 42, which is 252.',
    'Maths', 'hard'
  ),
  (
    'Add forty-eight and thirty-seven mentally',
    'What is 48 + 37?',
    '75', '85', '95', '105',
    'B', 'Add 40 and 30, then add 8 and 7: 70 + 15 = 85.',
    'Mental Maths', 'easy'
  ),
  (
    'Multiply twelve by fifteen mentally',
    'What is 12 times 15?',
    '160', '170', '180', '190',
    'C', '12 times (10 + 5) is 120 + 60 = 180.',
    'Mental Maths', 'easy'
  ),
  (
    'Find one quarter of three hundred sixty',
    'What is 25% of 360?',
    '80', '90', '100', '120',
    'B', 'Twenty-five percent is one quarter, and 360 divided by 4 is 90.',
    'Mental Maths', 'medium'
  ),
  (
    'Square ninety-nine mentally',
    'What is 99 squared?',
    '9,801', '9,899', '9,900', '9,901',
    'A', 'Use (100 - 1) squared = 10,000 - 200 + 1 = 9,801.',
    'Mental Maths', 'medium'
  ),
  (
    'Multiply one hundred twenty-five by forty-eight',
    'What is 125 times 48?',
    '5,000', '5,500', '6,000', '6,250',
    'C', '125 times 48 is 125 times (4 times 12), or 500 times 12 = 6,000.',
    'Mental Maths', 'hard'
  ),
  (
    'Multiply nine hundred ninety-eight by nine hundred ninety-seven',
    'What is 998 times 997?',
    '994,006', '995,006', '996,006', '997,006',
    'B', 'Compute (1,000 - 2)(1,000 - 3) = 1,000,000 - 5,000 + 6 = 995,006.',
    'Mental Maths', 'hard'
  ),
  (
    'Continue a doubling sequence',
    'What number comes next: 2, 4, 8, 16, ...?',
    '24', '30', '32', '34',
    'C', 'Each term is twice the previous term, so 16 times 2 is 32.',
    'IQ & Logic', 'easy'
  ),
  (
    'Continue a square-number sequence',
    'What number comes next: 1, 4, 9, 16, ...?',
    '20', '24', '25', '36',
    'C', 'These are squares of 1, 2, 3, and 4. The next is 5 squared, or 25.',
    'IQ & Logic', 'easy'
  ),
  (
    'Find the next growing-difference term',
    'What number comes next: 3, 6, 11, 18, 27, ...?',
    '36', '37', '38', '39',
    'C', 'The differences are 3, 5, 7, and 9. The next difference is 11, giving 38.',
    'IQ & Logic', 'medium'
  ),
  (
    'Continue a sequence with even differences',
    'What number comes next: 2, 6, 12, 20, 30, ...?',
    '40', '41', '42', '44',
    'C', 'The differences are 4, 6, 8, and 10. Add 12 to 30 to get 42.',
    'IQ & Logic', 'medium'
  ),
  (
    'Deduce from two category statements',
    'All Zorbs are Nims. No Nims are Laks. What must be true?',
    'Some Zorbs are Laks', 'No Zorbs are Laks', 'All Laks are Zorbs', 'No Nims are Zorbs',
    'B', 'Every Zorb is a Nim, and no Nim is a Lak. Therefore no Zorb can be a Lak.',
    'IQ & Logic', 'hard'
  ),
  (
    'Find the smallest number with two remainders',
    'What is the smallest positive integer that leaves remainder 2 when divided by 5 and remainder 3 when divided by 7?',
    '12', '17', '23', '31',
    'B', '17 divided by 5 leaves remainder 2, and divided by 7 leaves remainder 3. Checking smaller positive candidates shows none meet both conditions.',
    'IQ & Logic', 'hard'
  ),
  (
    'Calculate average speed',
    'A cyclist travels 60 km in 1.5 hours. What is the average speed?',
    '30 km/h', '40 km/h', '45 km/h', '90 km/h',
    'B', 'Average speed is distance divided by time: 60 divided by 1.5 equals 40 km/h.',
    'Aptitude', 'easy'
  ),
  (
    'Split twenty-five in a two-to-three ratio',
    'A quantity of 25 is divided in the ratio 2:3. What is the smaller share?',
    '8', '10', '12', '15',
    'B', 'There are 5 total parts. Each part is 25 divided by 5 = 5, so the smaller share is 2 times 5 = 10.',
    'Aptitude', 'easy'
  ),
  (
    'Combine two workers rates',
    'Worker A can finish a job in 6 days and worker B can finish it in 3 days. How long do they take working together at constant rates?',
    '1 day', '2 days', '3 days', '4.5 days',
    'B', 'Their combined rate is 1/6 + 1/3 = 1/2 of the job per day, so the job takes 2 days.',
    'Aptitude', 'medium'
  ),
  (
    'Calculate a sale profit percentage',
    'An item costs 800 and is sold for 920. What is the profit percentage on cost?',
    '12%', '15%', '18%', '20%',
    'B', 'Profit is 120. Divide 120 by the cost of 800 and multiply by 100 to get 15%.',
    'Aptitude', 'medium'
  ),
  (
    'Find a train speed from platform crossing time',
    'A 180 m train passes a 270 m platform in 30 seconds. What is its speed in km/h?',
    '45 km/h', '50 km/h', '54 km/h', '60 km/h',
    'C', 'The train travels 180 + 270 = 450 m in 30 seconds, or 15 m/s. Multiply by 3.6 to get 54 km/h.',
    'Aptitude', 'hard'
  ),
  (
    'Find profit after markup and discount',
    'A shop marks an item 25% above cost and then gives a 10% discount on the marked price. What is the profit percentage on cost?',
    '10%', '12.5%', '15%', '25%',
    'B', 'For a cost of 100, the marked price is 125. After a 10% discount the sale price is 112.5, giving a 12.5% profit.',
    'Aptitude', 'hard'
  )
)
INSERT INTO questions (
  title, description, option_a, option_b, option_c, option_d,
  correct_option, explanation, category, difficulty
)
SELECT s.title, s.description, s.option_a, s.option_b, s.option_c, s.option_d,
       s.correct_option, s.explanation, s.category, s.difficulty
FROM seed_questions AS s
WHERE NOT EXISTS (
  SELECT 1
  FROM questions AS existing
  WHERE LOWER(existing.category) = LOWER(s.category)
    AND LOWER(existing.title) = LOWER(s.title)
);

COMMIT;
