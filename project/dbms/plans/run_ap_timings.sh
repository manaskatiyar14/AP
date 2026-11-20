# SkillForge Performance Testing Script

This script runs SQL queries on the test database and records how long they take. It also saves PostgreSQL execution plans so we can understand how the database handles each query.

The script uses `psql` to connect to PostgreSQL.

## 1. Check Database Connection

```bash
#!/bin/sh
set -eu

if [ -z "${SKILLFORGE_BENCH_DATABASE_URL:-}" ]; then
  echo "Set SKILLFORGE_BENCH_DATABASE_URL to a disposable skillforge_bench database." >&2
  exit 2
fi
```

**Explanation:**

- `#!/bin/sh` tells the system to run the script using the shell.
- `set -eu` stops the script if a command fails or an undefined variable is used.
- It checks whether the database connection URL is provided.
- If the URL is missing, the script stops.

## 2. Check PostgreSQL Tool

```bash
if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run the benchmark queries." >&2
  exit 2
fi
```

**Explanation:**

This checks whether `psql` is installed on the system.

If it is not installed, the script stops and displays an error message.

## 3. Check the Database Name

```bash
actual_db=$(psql "$SKILLFORGE_BENCH_DATABASE_URL" -XAtqc 'SELECT current_database()')

if [ "$actual_db" != "skillforge_bench" ]; then
  echo "Refusing to run: connected database is not named skillforge_bench." >&2
  exit 2
fi
```

**Explanation:**

- Connects to PostgreSQL.
- Checks the name of the connected database.
- Continues only if the database is named `skillforge_bench`.
- Stops if another database is connected.

This protects the main SkillForge database from accidental testing.

## 4. Create an Output File

```bash
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
output="$script_dir/ap_timings_$(date +%Y%m%d_%H%M%S).txt"
```

**Explanation:**

This creates a file to save the performance results.

The file name includes the current date and time, so every test run gets a separate output file.

For example:

`ap_timings_20261115_190000.txt`

## 5. Run Performance Queries

```bash
psql "$SKILLFORGE_BENCH_DATABASE_URL" -X -v ON_ERROR_STOP=1 >"$output" 2>&1 <<'SQL'
```

**Explanation:**

This connects to the test database and starts running the SQL queries.

- `-X` prevents loading personal `psql` configuration.
- `ON_ERROR_STOP=1` stops execution if an SQL error occurs.
- `>"$output"` saves the output in the file.
- `2>&1` also saves error messages in the same file.

### Queries being tested

The script tests five important database operations:

| No. | Query | What it checks |
|---|---|---|
| 1 | User lookup | Finding a user using email. |
| 2 | Question filtering | Finding questions by category and difficulty. |
| 3 | Submission history | Getting the latest submissions of a user. |
| 4 | User progress | Counting correctly solved questions. |
| 5 | Contest registrations | Finding users registered for a contest. |

Before each query, the script prints its name.

It uses:

```sql
\timing on
```

This enables query timing in PostgreSQL.

It also uses:

```sql
EXPLAIN (ANALYZE, BUFFERS)
```

This shows the query execution plan, actual execution time, and buffer information.

## 6. Save the Results

```bash
SQL

echo "Execution plans saved in: $output"
```

**Explanation:**

After all queries finish, the script prints the location of the output file.

The file contains the execution plans, timing information, and any SQL errors.

## 7. How to Run the Script

First, set the connection URL of your test database:

```bash
export SKILLFORGE_BENCH_DATABASE_URL="your_test_database_url"
```

Then run:

```bash
bash dbms/plans/run_ap_timings.sh
```

After successful execution, check the `dbms/plans/` folder for the generated output file.

## 8. Conclusion

This script makes it easier to test the performance of SkillForge database queries.

It checks the database connection, makes sure testing happens only on `skillforge_bench`, runs five SQL queries, and saves their execution plans and timings in a text file.

These results can later help us understand which queries are performing well and where improvements may be needed.