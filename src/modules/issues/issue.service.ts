import { pool } from "../../db";
import AppError from "../../utils/appError";
import type {
  TIssue,
  TIssueFilters,
  TIssueResponse,
  TReporter,
} from "./issue.interface";

const createIssueIntoDB = async (payload: TIssue, reporterId: number) => {
  const { title, description, type } = payload;

  const result = await pool.query(
    `
        INSERT INTO issues (title, description, type, reporter_id)
        VALUES($1, $2, $3, $4)
        RETURNING *
    `,
    [title, description, type, reporterId],
  );

  return result.rows[0];
};

const getAllIssuesFromDB = async (
  filters: TIssueFilters,
): Promise<TIssueResponse[]> => {
  const { type, status, sort } = filters;

  let query = `SELECT * FROM issues WHERE 1=1`;
  const queryParams: (string | number)[] = [];

  if (type) {
    queryParams.push(type);
    query += ` AND type = $${queryParams.length}`;
  }

  if (status) {
    queryParams.push(status);
    query += ` AND status = $${queryParams.length}`;
  }

  const orderBy = sort === "oldest" ? "ASC" : "DESC";

  query += ` ORDER BY created_at ${orderBy}`;

  const issueResult = await pool.query(query, queryParams);
  const issues = issueResult.rows;

  const result: TIssueResponse[] = await Promise.all(
    issues.map(async (issue) => {
      const userResult = await pool.query(
        "SELECT id, name, role FROM users WHERE id=$1",
        [issue.reporter_id],
      );

      const reporter: TReporter = userResult.rows[0];

      const { reporter_id, ...issueData } = issue;

      return {
        ...issueData,
        reporter: reporter,
      } as TIssueResponse;
    }),
  );

  return result;
};

const getSingleIssueFromDB = async (
  id: string,
): Promise<TIssueResponse | null> => {
  const issueResult = await pool.query(
    `
      SELECT * FROM issues WHERE id=$1

    `,
    [id],
  );

  const issue = issueResult.rows[0];

  if (!issue) {
    throw new AppError("Issue not found!", 404);
  }

  const userResult = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id=$1
    `,
    [issue.reporter_id],
  );

  const reporter: TReporter = userResult.rows[0];

  const { reporter_id, ...issueData } = issue;

  return {
    ...issueData,
    reporter: reporter,
  } as TIssueResponse;
};

const updateIssueInDB = async (
  issueId: string,
  payload: Partial<TIssue>,
  user: { id: number; role: string },
) => {
  const issueResult = await pool.query(
    `
        SELECT * FROM issues WHERE id=$1
    
    `,
    [issueId],
  );

  const issue = issueResult.rows[0];

  if (!issue) {
    throw new Error("Issue not found");
  }

  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can only update your own issues");
    }

    if (issue.status !== "open") {
      throw new Error("You cannot update an issue that is no longer 'open'");
    }
  }

  const { title, description, type } = payload;

  const result = await pool.query(
    `
    UPDATE issues
    SET 
    title = COALESCE($1, title),
    description = COALESCE($2, description),
    type = COALESCE($3, type),
    updated_at = NOW()

    WHERE id=$4
    RETURNING *

  `,
    [title, description, type, issueId],
  );
  return result.rows[0];
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
        DELETE FROM issues WHERE id=$1
        RETURNING *

      `,
    [id],
  );

  if (result.rowCount === 0) {
    throw new Error("Issue not found");
  }

  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB,
};
