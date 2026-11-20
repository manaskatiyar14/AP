# SkillForge Database Normalization

## 1. Introduction

Database normalization is the process of organizing data into separate tables to reduce duplicate information and keep the database consistent.

In SkillForge, we store user accounts, questions, submissions, contests, registrations, and user progress in separate tables.

This makes the database easier to manage, update, and maintain.

## 2. Unnormalized Form (UNF)

Before normalization, all information could be stored in one large table.

For example, a single table might contain user details, question details, answer attempts, contest information, and progress.

| User Name | Email | Question | Selected Answer | Contest | Total Solved |
|---|---|---|---|---|---|
| Rahul | rahul@gmail.com | What is SQL? | A | DBMS Contest | 10 |
| Rahul | rahul@gmail.com | What is DBMS? | B | DBMS Contest | 10 |
| Rahul | rahul@gmail.com | What is Java? | C | Coding Contest | 10 |

**Problems with this approach:**

- User details are repeated in multiple rows.
- Updating an email requires changing several records.
- Deleting an attempt could accidentally remove other important information.
- Managing multiple submissions and contest registrations becomes difficult.
- Duplicate data can create inconsistencies.

To solve these problems, we divide the data into separate tables.

## 3. First Normal Form (1NF)

A table is in 1NF when:

- Each column contains a single value.
- Each row represents one record.
- There are no repeating groups or lists inside a column.

**How SkillForge follows 1NF:**

| Table | Example |
|---|---|
| `users` | One row stores one user's name and email. |
| `questions` | Each question has separate columns for its four options. |
| `submissions` | Each row stores one answer attempt. |
| `contest_registrations` | Each row stores one user's registration for one contest. |
| `user_progress` | Each row stores one user's progress summary. |

For example, the `questions` table stores options separately:

| id | option_a | option_b | option_c | option_d |
|---|---|---|---|---|
| 1 | HTML | CSS | SQL | Java |

Each option has its own column instead of storing all options in one list.

**Result:** SkillForge stores individual values in separate columns and records in separate rows.

## 4. Second Normal Form (2NF)

A table is in 2NF when:

- It is already in 1NF.
- Every non-key column depends on the complete candidate key, not just part of it.

In SkillForge, all six tables use a single-column `id` as their primary key. Therefore, there is no partial dependency on part of a composite primary key.

Some tables also have additional unique keys.

| Table | Unique Key | Purpose |
|---|---|---|
| `users` | `email` | Prevents duplicate user emails. |
| `contest_registrations` | `(user_id, contest_id)` | Prevents duplicate registrations. |
| `submissions` | `(user_id, attempt_id)` | Prevents duplicate attempt IDs for the same user. |
| `user_progress` | `user_id` | Allows only one progress record per user. |

For example, in `contest_registrations`, `registered_at` belongs to the complete combination of `user_id` and `contest_id`.

**Result:** The database uses unique identifiers to keep records separate and avoid duplicate entries.

## 5. Third Normal Form (3NF)

A table is in 3NF when:

- It is already in 2NF.
- Non-key columns depend on the key, not on other non-key columns.

SkillForge separates different types of information into different tables.

| Table | Information Stored |
|---|---|
| `users` | User name, email, and password hash. |
| `questions` | Question, options, answer, and explanation. |
| `submissions` | Selected answer and submission result. |
| `contests` | Contest name, description, and timings. |
| `contest_registrations` | Which user registered for which contest. |
| `user_progress` | Total solved questions and overall rating. |

For example, the `submissions` table stores `user_id` and `question_id` instead of copying the user's email and complete question details into every submission.

Similarly, `contest_registrations` connects users and contests using their IDs.

**One important point:** The `user_progress` table stores a summary of user performance. The application updates `overall_rating` based on `total_solved`. This relationship is maintained by the backend and is not enforced by a database constraint.

**Result:** Each table stores information about its own subject, reducing unnecessary repetition.

## 6. Boyce-Codd Normal Form (BCNF)

BCNF is a stronger version of 3NF.

It states that every determinant (a column or group of columns that determines another value) must be a candidate key.

SkillForge declares the following unique identifiers:

| Table | Candidate Key / Unique Identifier |
|---|---|
| `users` | `id`, `email` |
| `questions` | `id` |
| `submissions` | `id`, `(user_id, attempt_id)` |
| `contests` | `id` |
| `contest_registrations` | `id`, `(user_id, contest_id)` |
| `user_progress` | `id`, `user_id` |

These keys help uniquely identify records in their respective tables.

Based on the declared keys and unique constraints, the schema supports a BCNF explanation for these identifiers. However, the schema alone does not prove every possible business rule. For example, the relationship between `total_solved` and `overall_rating` is maintained by the application.

**Result:** The declared keys help maintain uniqueness and reduce duplicate records.

## 7. Final Database Structure

After normalization, SkillForge has six main tables.

| No. | Table Name | Purpose |
|---|---|---|
| 1 | `users` | Stores user account details. |
| 2 | `questions` | Stores questions and their answer options. |
| 3 | `submissions` | Stores users' answer attempts. |
| 4 | `contests` | Stores contest information. |
| 5 | `contest_registrations` | Connects users with contests. |
| 6 | `user_progress` | Stores user progress and rating. |

## 8. Benefits of Normalization in SkillForge

| Benefit | How It Helps |
|---|---|
| Less duplicate data | User and question details are stored separately. |
| Easy updates | User details can be updated in one place. |
| Better consistency | Foreign keys connect related records. |
| Better organization | Each table has a clear purpose. |
| Data integrity | Primary keys, unique constraints, and checks prevent invalid data. |
| Easier maintenance | Changes to one type of information are easier to manage. |

## 9. Conclusion

SkillForge uses six separate tables to manage its data. Each table has a specific purpose, and primary keys, foreign keys, and unique constraints help connect and protect the data.

Normalization helps reduce unnecessary duplication and makes the database easier to maintain as the platform grows.