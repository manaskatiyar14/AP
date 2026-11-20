# SkillForge Query Performance Notes

## 1. What is a Query Plan?

A query plan shows how PostgreSQL executes an SQL query.

- `EXPLAIN` shows how PostgreSQL plans to run a query.
- `EXPLAIN (ANALYZE, BUFFERS)` runs the query and shows its actual execution time and memory activity.
- **Sequential Scan:** PostgreSQL checks rows one by one. This is fine for small tables.
- **Index Scan:** PostgreSQL uses an index to find data faster, especially when only a few rows are needed.

**Note:** We have not run any performance tests yet. So, no actual execution times or speed improvements are reported. The points below are based on the current database structure and indexes.

All tests must run on a separate database named `skillforge_bench`, not the main project database.

## 2. Queries for Performance Testing

These queries can be tested after adding sample data to the test database.

```sql
-- 1. Find a user by email (login)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, full_name, email, password_hash, created_at
FROM users
WHERE email = 'bench_user_0001@example.invalid';


-- 2. Find questions by category and difficulty
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, category, difficulty
FROM questions
WHERE LOWER(category) = LOWER('Maths')
AND LOWER(difficulty) = LOWER('easy')
ORDER BY id;


-- 3. Get the latest 50 submissions of a user
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.id, s.question_id, q.title, s.selected_option,
       s.is_correct, s.submitted_at
FROM submissions AS s
JOIN questions AS q ON q.id = s.question_id
WHERE s.user_id = (
    SELECT id FROM users
    WHERE email = 'bench_user_0001@example.invalid'
)
ORDER BY s.submitted_at DESC
LIMIT 50;


-- 4. Count correctly solved questions
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(DISTINCT question_id)::integer AS total_solved
FROM submissions
WHERE user_id = (
    SELECT id FROM users
    WHERE email = 'bench_user_0001@example.invalid'
)
AND is_correct = TRUE;


-- 5. Find users registered in a contest
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, registered_at
FROM contest_registrations
WHERE contest_id = (
    SELECT id FROM contests
    WHERE title = 'SkillForge Benchmark Contest'
);
```

## 3. Existing Database Indexes

Indexes help PostgreSQL find data without checking every row.

Here are the indexes already present in SkillForge:

- **Users:** `users.email` is UNIQUE. PostgreSQL automatically creates an index for it. This helps during login.
- **Questions:** The `(category, difficulty)` index helps filter questions. However, our queries use `LOWER()`, so this normal index may not help with those exact conditions.
- **Submissions:** The unique `(user_id, attempt_id)` index and `idx_submissions_user_id` help find a user's submissions.
- **Question Submissions:** `submissions(question_id)` helps find submissions related to a particular question.
- **Contest Registrations:** The unique `(user_id, contest_id)` index prevents the same user from registering twice. `idx_contest_registrations_contest_id` helps find registrations for a contest.
- **User Progress:** `user_progress.user_id` is UNIQUE, so it has an index.
- **Primary Keys:** PostgreSQL automatically creates indexes for primary keys.

### Possible Improvement

The submission history query sorts data by `submitted_at`. We could test an index on `(user_id, submitted_at)` if the submissions table becomes large.

However, we should only add it if performance testing shows that it is useful.

**Remember:** Indexes improve some searches, but they also use storage and can make data insertion and updates slower. So, adding more indexes is not always better.

## 4. How to Run Performance Tests

Follow these steps to test queries safely:

1. Create a separate PostgreSQL database named `skillforge_bench`.
2. Apply `backend/sql/schema.sql` to this database.
3. Add sample data using `backend/sql/seed.sql`, if needed.
4. Set `SKILLFORGE_BENCH_DATABASE_URL` to the test database connection URL.
5. Run `dbms/plans/00_load_test_data.sql` to add more sample records.
6. Run the performance testing script:

```bash
bash dbms/plans/run_ap_timings.sh
```

7. The script runs the queries and saves their performance details inside `dbms/plans/`.

## 5. Index Comparison

To check whether a new index improves performance:

1. Run the queries without the new index.
2. Save their execution plans and timings.
3. Add the new index to the test database only.
4. Run the same queries again using the same data.
5. Compare the execution times and query plans.
6. Save the results in `dbms/plans/index_comparison/`.

## 6. Conclusion

SkillForge already has indexes for important operations such as login, question filtering, submissions, contest registrations, and user progress.

Some queries may benefit from additional indexes, especially when the database contains more records. However, we need to run actual tests before deciding whether to add them.

**No performance tests have been run yet, so actual results and speed improvements are not available.**