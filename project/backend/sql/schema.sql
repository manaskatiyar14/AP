
-- SkillForge Database Schema

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Questions
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option CHAR(1) NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    attempt_id UUID NOT NULL DEFAULT gen_random_uuid(),
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Contests
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
);

-- 5. Contest Registrations
CREATE TABLE IF NOT EXISTS contest_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, contest_id)
);

-- 6. User Progress
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_solved INTEGER NOT NULL DEFAULT 0 CHECK (total_solved >= 0),
    overall_rating INTEGER NOT NULL DEFAULT 0 CHECK (overall_rating >= 0),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add idempotency keys without deleting or replacing existing submission rows.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS attempt_id UUID;
UPDATE submissions SET attempt_id = gen_random_uuid() WHERE attempt_id IS NULL;
ALTER TABLE submissions ALTER COLUMN attempt_id SET DEFAULT gen_random_uuid();
ALTER TABLE submissions ALTER COLUMN attempt_id SET NOT NULL;

-- Safe nullability migration for databases where these tables already exist.
-- The checks stop the migration before ALTER if existing rows contain NULLs.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM questions WHERE correct_option IS NULL) THEN
        RAISE EXCEPTION 'Cannot require questions.correct_option: NULL values exist';
    END IF;
    IF EXISTS (SELECT 1 FROM questions WHERE difficulty IS NULL) THEN
        RAISE EXCEPTION 'Cannot require questions.difficulty: NULL values exist';
    END IF;
    IF EXISTS (SELECT 1 FROM user_progress WHERE total_solved IS NULL) THEN
        RAISE EXCEPTION 'Cannot require user_progress.total_solved: NULL values exist';
    END IF;
    IF EXISTS (SELECT 1 FROM user_progress WHERE overall_rating IS NULL) THEN
        RAISE EXCEPTION 'Cannot require user_progress.overall_rating: NULL values exist';
    END IF;

    ALTER TABLE questions ALTER COLUMN correct_option SET NOT NULL;
    ALTER TABLE questions ALTER COLUMN difficulty SET NOT NULL;
    ALTER TABLE user_progress ALTER COLUMN total_solved SET NOT NULL;
    ALTER TABLE user_progress ALTER COLUMN overall_rating SET NOT NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_category_difficulty
ON questions(category, difficulty);

CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_user_attempt
ON submissions(user_id, attempt_id);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id
ON submissions(user_id);

CREATE INDEX IF NOT EXISTS idx_submissions_question_id
ON submissions(question_id);

CREATE INDEX IF NOT EXISTS idx_contest_registrations_contest_id
ON contest_registrations(contest_id);
