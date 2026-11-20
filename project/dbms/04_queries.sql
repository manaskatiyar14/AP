# SkillForge SQL Queries

This document contains the main SQL queries used in SkillForge. These queries help manage users, questions, submissions, contests, and user progress.

We use `$1`, `$2`, `$3`, etc. as placeholders for values. The backend sends these values separately using parameterized queries. This helps protect the application from SQL injection.

## A. User Accounts

These queries are used to manage user accounts.

```sql
-- Find a user during login
SELECT id, full_name, email, password_hash, created_at
FROM users
WHERE email = $1;

-- Get user profile details
SELECT id, full_name, email, created_at
FROM users
WHERE id = $1;

-- Create a new user account
INSERT INTO users (full_name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, full_name, email, created_at;

-- Update a user's name
UPDATE users
SET full_name = $1
WHERE id = $2
RETURNING id, full_name, email, created_at;
```

**Explanation:** These queries help users log in, view their profiles, create accounts, and update their names. Passwords are checked by the backend using bcrypt.

## B. Questions

These queries are used to display and manage questions.

```sql
-- Get all questions
SELECT id, title, description, option_a, option_b, option_c, option_d,
       category, difficulty, created_at
FROM questions
ORDER BY id;

-- Find questions by category
SELECT id, title, description, option_a, option_b, option_c, option_d,
       category, difficulty, created_at
FROM questions
WHERE LOWER(category) = LOWER($1)
ORDER BY id;

-- Find questions by difficulty
SELECT id, title, description, option_a, option_b, option_c, option_d,
       category, difficulty, created_at
FROM questions
WHERE LOWER(difficulty) = LOWER($1)
ORDER BY id;

-- Get one question using its ID
SELECT id, title, description, option_a, option_b, option_c, option_d,
       category, difficulty, created_at
FROM questions
WHERE id = $1;

-- Get the correct answer and explanation (admin only)
SELECT * FROM questions WHERE id = $1;

-- Add a new question (admin only)
INSERT INTO questions (
  title, description, option_a, option_b, option_c, option_d,
  correct_option, explanation, category, difficulty
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, title, description, option_a, option_b, option_c, option_d,
          category, difficulty, created_at;

-- Update a question (admin only)
UPDATE questions
SET title = $1, description = $2, option_a = $3, option_b = $4,
    option_c = $5, option_d = $6, correct_option = $7,
    explanation = $8, category = $9, difficulty = $10
WHERE id = $11
RETURNING id, title, description, option_a, option_b, option_c, option_d,
          category, difficulty, created_at;

-- Delete a question (admin only)
DELETE FROM questions WHERE id = $1;
```

**Explanation:** Users can view questions and filter them by category or difficulty. Admins can add, update, and delete questions. The correct answers and explanations are kept private until needed.

## C. Submissions

These queries handle users' answers and submission history.

```sql
-- Get the correct answer for checking a submission
SELECT correct_option, explanation
FROM questions
WHERE id = $1;

-- Save a user's answer
INSERT INTO submissions (
  user_id, question_id, selected_option, is_correct, attempt_id
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- Get the latest 50 submissions of a user
SELECT s.id, s.question_id, q.title, q.category, q.difficulty,
       s.selected_option, s.is_correct, s.submitted_at
FROM submissions AS s
JOIN questions AS q ON q.id = s.question_id
WHERE s.user_id = $1
ORDER BY s.submitted_at DESC
LIMIT 50;

-- Get all attempts for one question
SELECT id, user_id, selected_option, is_correct, submitted_at
FROM submissions
WHERE question_id = $1
ORDER BY submitted_at DESC;

-- Count correct and incorrect attempts
SELECT
  COUNT(*) FILTER (WHERE is_correct)::integer AS correct_attempts,
  COUNT(*) FILTER (WHERE NOT is_correct)::integer AS incorrect_attempts
FROM submissions
WHERE user_id = $1;

-- Count different questions solved correctly
SELECT COUNT(DISTINCT question_id)::integer AS total_solved
FROM submissions
WHERE user_id = $1 AND is_correct = TRUE;
```

**Explanation:** Whenever a user answers a question, the backend checks the answer and saves the result. These queries also help show submission history and count correct and incorrect answers.

## D. Contests

These queries help manage contests and registrations.

```sql
-- Show all contests with registration counts
SELECT c.*, COUNT(r.id)::integer AS registration_count
FROM contests AS c
LEFT JOIN contest_registrations AS r ON r.contest_id = c.id
GROUP BY c.id
ORDER BY c.start_time ASC;

-- Get details of one contest
SELECT * FROM contests WHERE id = $1;

-- Register a user for a contest
INSERT INTO contest_registrations (user_id, contest_id)
VALUES ($1, $2)
RETURNING *;

-- Avoid adding the same registration twice
INSERT INTO contest_registrations (user_id, contest_id)
VALUES ($1, $2)
ON CONFLICT (user_id, contest_id) DO NOTHING
RETURNING *;

-- Get all contests registered by a user
SELECT c.*, r.registered_at
FROM contests AS c
JOIN contest_registrations AS r ON r.contest_id = c.id
WHERE r.user_id = $1
ORDER BY c.start_time;

-- Check whether a user is registered
SELECT EXISTS (
  SELECT 1 FROM contest_registrations
  WHERE user_id = $1 AND contest_id = $2
) AS is_registered;
```

**Explanation:** These queries display contests, count registrations, allow users to register, and check their registration status. A unique constraint prevents duplicate registrations.

## E. User Progress

These queries help track how users are performing.

```sql
-- Get saved progress of a user
SELECT user_id, total_solved, overall_rating, updated_at
FROM user_progress
WHERE user_id = $1;

-- Calculate a user's performance
SELECT
  COUNT(s.id)::integer AS total_attempted,
  COUNT(s.id) FILTER (WHERE s.is_correct)::integer AS correct_attempts,
  COUNT(s.id) FILTER (WHERE NOT s.is_correct)::integer AS incorrect_answers,
  COALESCE(up.total_solved, 0)::integer AS total_solved,
  COALESCE(up.overall_rating, 0)::integer AS overall_rating,
  CASE WHEN COUNT(s.id) = 0 THEN 0
       ELSE ROUND(100.0 * COUNT(s.id) FILTER (WHERE s.is_correct) / COUNT(s.id), 1)
  END AS accuracy_percentage
FROM users AS u
LEFT JOIN user_progress AS up ON up.user_id = u.id
LEFT JOIN submissions AS s ON s.user_id = u.id
WHERE u.id = $1
GROUP BY up.total_solved, up.overall_rating;
```

**Explanation:** These queries show how many questions a user has attempted and solved. They also calculate correct answers, incorrect answers, and accuracy percentage.

## F. Reports

These queries help generate useful reports about platform activity.

```sql
-- Find the most attempted questions
SELECT q.id, q.title, COUNT(s.id)::integer AS attempt_count
FROM questions AS q
JOIN submissions AS s ON s.question_id = q.id
GROUP BY q.id, q.title
ORDER BY attempt_count DESC, q.id
LIMIT 10;

-- Find questions with the most correct answers
SELECT q.id, q.title, COUNT(s.id)::integer AS correct_count
FROM questions AS q
JOIN submissions AS s ON s.question_id = q.id
WHERE s.is_correct = TRUE
GROUP BY q.id, q.title
ORDER BY correct_count DESC, q.id
LIMIT 10;

-- Count registrations for each contest
SELECT c.id, c.title, COUNT(r.id)::integer AS registration_count
FROM contests AS c
LEFT JOIN contest_registrations AS r ON r.contest_id = c.id
GROUP BY c.id, c.title
ORDER BY c.start_time;

-- Get overall performance of all users
SELECT u.id, u.full_name,
       COALESCE(p.total_attempted, 0)::integer AS total_attempted,
       COALESCE(p.correct_attempts, 0)::integer AS correct_attempts,
       COALESCE(up.total_solved, 0)::integer AS total_solved,
       COALESCE(up.overall_rating, 0)::integer AS overall_rating
FROM users AS u
LEFT JOIN user_progress AS up ON up.user_id = u.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS total_attempted,
         COUNT(*) FILTER (WHERE is_correct) AS correct_attempts
  FROM submissions
  WHERE user_id = u.id
) AS p ON TRUE
ORDER BY u.id;
```

**Explanation:** These queries help identify popular questions, count correct answers, check contest registrations, and view the overall performance of users.

## Conclusion

These SQL queries cover the main database operations in SkillForge:

- **Users:** Account creation, login, and profile updates.
- **Questions:** Displaying, filtering, and managing questions.
- **Submissions:** Saving answers and tracking attempts.
- **Contests:** Managing contests and registrations.
- **Progress:** Tracking solved questions and accuracy.
- **Reports:** Understanding user activity and platform performance.

Together, these queries handle the main database operations required by SkillForge.