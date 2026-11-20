# SkillForge Test Data

This SQL file adds fake data to the SkillForge database. We use this data to test queries and check database performance.

**Important:** This script is only for testing. Never run it on the actual SkillForge database. It only works with a separate database named `skillforge_bench`.

## 1. Check the Database Name

Before adding any data, the script checks the database name.

```sql
DO $$
BEGIN
  IF current_database() <> 'skillforge_bench' THEN
    RAISE EXCEPTION 'Refusing to load test data outside skillforge_bench';
  END IF;
END $$;
```

**Explanation:** If the database name is not `skillforge_bench`, the script stops. This protects the real project database from test data.

## 2. Add 100 Test Users

```sql
INSERT INTO users (full_name, email, password_hash)
SELECT 'Benchmark User ' || n,
       'bench_user_' || LPAD(n::text, 4, '0') || '@example.invalid',
       'TEST_ONLY_NOT_A_REAL_BCRYPT_HASH'
FROM generate_series(1, 100) AS gs(n)
ON CONFLICT (email) DO NOTHING;
```

**Explanation:**
- Creates 100 fake users.
- Each user gets a different name and email.
- `generate_series(1, 100)` generates numbers from 1 to 100.
- `LPAD` adds zeros to the email number, such as `0001`.
- `ON CONFLICT DO NOTHING` skips users whose email already exists.

These accounts use fake password values and are not real login accounts.

## 3. Add 500 Test Questions

```sql
INSERT INTO questions (
  title, description, option_a, option_b, option_c, option_d,
  correct_option, explanation, category, difficulty
)
SELECT 'Benchmark question ' || n,
       'Synthetic question for query plan testing.',
       'Option A', 'Option B', 'Option C', 'Option D',
       'A', 'Synthetic benchmark explanation.',
       (ARRAY['Maths', 'Mental Maths', 'IQ & Logic', 'Aptitude'])[((n - 1) % 4) + 1],
       (ARRAY['easy', 'medium', 'hard'])[((n - 1) % 3) + 1]
FROM generate_series(1, 500) AS gs(n)
WHERE NOT EXISTS (
  SELECT 1 FROM questions AS q
  WHERE q.title = 'Benchmark question ' || n
);
```

**Explanation:**
- Creates 500 fake questions.
- Each question has four options.
- The correct answer is set to A.
- Questions are divided into four categories.
- Difficulty is set to easy, medium, or hard.
- `WHERE NOT EXISTS` checks whether a question already exists before adding it.

This helps avoid adding the same test questions again when the script is run more than once.

## 4. Add a Test Contest

```sql
INSERT INTO contests (title, description, start_time, end_time)
SELECT 'SkillForge Benchmark Contest',
       'Synthetic benchmark contest.',
       CURRENT_TIMESTAMP + INTERVAL '2 days',
       CURRENT_TIMESTAMP + INTERVAL '3 days'
WHERE NOT EXISTS (
  SELECT 1 FROM contests
  WHERE title = 'SkillForge Benchmark Contest'
);
```

**Explanation:**

This creates one fake contest.

- The contest starts after two days.
- It ends after three days.
- `WHERE NOT EXISTS` prevents the same test contest from being added again.

## 5. Add Test Submissions

```sql
INSERT INTO submissions (
  user_id, question_id, selected_option, is_correct, attempt_id
)
SELECT u.id,
       q.id,
       CASE WHEN q.id % 3 = 0 THEN 'A' ELSE 'B' END,
       q.id % 3 = 0,
       md5('skillforge-bench:' || u.id || ':' || q.id)::uuid
FROM users AS u
CROSS JOIN questions AS q
WHERE u.email LIKE 'bench_user_%@example.invalid'
  AND q.title LIKE 'Benchmark question %'
ON CONFLICT (user_id, attempt_id) DO NOTHING;
```

**Explanation:**

This step creates fake answer submissions for the test users.

- `CROSS JOIN` combines every matching test user with every test question.
- Each user gets a submission for each test question.
- The selected answer is A when the question ID is divisible by 3; otherwise, it is B.
- `is_correct` stores whether the answer is correct.
- `md5()` creates a repeatable value that is converted into a UUID for `attempt_id`.
- `ON CONFLICT DO NOTHING` skips attempts that already exist.

This creates enough submission records to test history and progress queries.

## 6. Add User Progress

```sql
INSERT INTO user_progress (user_id, total_solved, overall_rating)
SELECT u.id,
       COUNT(DISTINCT s.question_id) FILTER (WHERE s.is_correct)::integer,
       (COUNT(DISTINCT s.question_id) FILTER (WHERE s.is_correct) * 10)::integer
FROM users AS u
LEFT JOIN submissions AS s ON s.user_id = u.id
WHERE u.email LIKE 'bench_user_%@example.invalid'
GROUP BY u.id
ON CONFLICT (user_id) DO UPDATE
SET total_solved = EXCLUDED.total_solved,
    overall_rating = EXCLUDED.overall_rating,
    updated_at = CURRENT_TIMESTAMP;
```

**Explanation:**

This calculates and saves the progress of each test user.

- Counts how many different questions each user solved correctly.
- Stores that count in `total_solved`.
- Calculates `overall_rating` by multiplying solved questions by 10.
- `LEFT JOIN` keeps users in the result even if they have no submissions.
- If a progress record already exists, `ON CONFLICT DO UPDATE` updates it instead of creating another one.

## 7. Register Test Users for the Contest

```sql
INSERT INTO contest_registrations (user_id, contest_id)
SELECT u.id, c.id
FROM users AS u
CROSS JOIN contests AS c
WHERE u.email LIKE 'bench_user_%@example.invalid'
  AND c.title = 'SkillForge Benchmark Contest'
ON CONFLICT (user_id, contest_id) DO NOTHING;
```

**Explanation:**

This registers all test users for the benchmark contest.

- Finds the test users.
- Finds the benchmark contest.
- Adds a registration for each test user.
- Skips registrations that already exist.

## 8. Summary

| Step | Operation | Data Added |
|---|---|---:|
| 1 | Check database name | Safety check |
| 2 | Create test users | 100 users |
| 3 | Create test questions | 500 questions |
| 4 | Create test contest | 1 contest |
| 5 | Create submissions | Test attempts |
| 6 | Calculate user progress | Progress records |
| 7 | Register users | Contest registrations |

## Conclusion

This script creates fake users, questions, submissions, contest registrations, and progress records for SkillForge.

The data helps us test SQL queries and understand how the database performs when it contains more records.

The script also includes checks to avoid duplicate test records and refuses to run outside the `skillforge_bench` database.