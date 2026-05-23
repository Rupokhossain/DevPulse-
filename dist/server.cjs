

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/app.ts
var import_express3 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);

// src/modules/auth/auth.route.ts
var import_express = require("express");

// src/modules/auth/auth.service.ts
var import_bcrypt = __toESM(require("bcrypt"), 1);

// src/db/index.ts
var import_pg = require("pg");

// src/config/index.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
import_dotenv.default.config({
  path: import_path.default.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new import_pg.Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(20) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
    await pool.query(`
              CREATE TABLE IF NOT EXISTS issues (
                id SERIAL PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL CHECK (char_length(description) >= 20),
                type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
                status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
                reporter_id INT NOT NULL,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

              )
          `);
    console.log("database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await import_bcrypt.default.hash(password, 12);
  const query = `
        INSERT INTO users (name, email, password, role )
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at , updated_at
    `;
  const values = [name, email, hashPassword, role || "contributor"];
  const result = await pool.query(query, values);
  return result.rows[0];
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email = $1

        `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const matchPassword = await import_bcrypt.default.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = import_jsonwebtoken.default.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "1d"
  });
  return {
    token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  createUserIntoDB,
  loginUser
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data
  });
};
var sendResponse_default = sendResponse;

// src/utils/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
var catchAsync_default = catchAsync;

// src/modules/auth/auth.controller.ts
var signUp = catchAsync_default(async (req, res) => {
  const result = await authService.createUserIntoDB(req.body);
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: result
  });
});
var login = catchAsync_default(async (req, res) => {
  const result = await authService.loginUser(req.body);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: result
  });
});
var authController = {
  signUp,
  login
};

// src/modules/auth/auth.route.ts
var router = (0, import_express.Router)();
router.post("/signup", authController.signUp);
router.post("/login", authController.login);
var authRoute = router;

// src/modules/issues/issue.route.ts
var import_express2 = require("express");

// src/modules/issues/issue.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
        INSERT INTO issues (title, description, type, reporter_id)
        VALUES($1, $2, $3, $4)
        RETURNING *
    `,
    [title, description, type, reporterId]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (filters) => {
  const { type, status, sort } = filters;
  let query = `SELECT * FROM issues WHERE 1=1`;
  const queryParams = [];
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
  const result = await Promise.all(
    issues.map(async (issue) => {
      const userResult = await pool.query(
        "SELECT id, name, role FROM users WHERE id=$1",
        [issue.reporter_id]
      );
      const reporter = userResult.rows[0];
      const { reporter_id, ...issueData } = issue;
      return {
        ...issueData,
        reporter
      };
    })
  );
  return result;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `
      SELECT * FROM issues WHERE id=$1

    `,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    return null;
  }
  const userResult = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id=$1
    `,
    [issue.reporter_id]
  );
  const reporter = userResult.rows[0];
  const { reporter_id, ...issueData } = issue;
  return {
    ...issueData,
    reporter
  };
};
var updateIssueInDB = async (issueId, payload, user) => {
  const issueResult = await pool.query(
    `
        SELECT * FROM issues WHERE id=$1
    
    `,
    [issueId]
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
    [title, description, type, issueId]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
        DELETE FROM issues WHERE id=$1
        RETURNING *

      `,
    [id]
  );
  if (result.rowCount === 0) {
    throw new Error("Issue not found");
  }
  return result.rows[0];
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issues/issue.controller.ts
var createIssue = catchAsync_default(async (req, res) => {
  const reporterId = req.user.id;
  const result = await issueService.createIssueIntoDB(req.body, reporterId);
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: "Issue created successfully",
    data: result
  });
});
var getAllIssues = catchAsync_default(async (req, res) => {
  const filters = req.query;
  const result = await issueService.getAllIssuesFromDB(filters);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issues retrieved successfully",
    data: result
  });
});
var getSingleIssue = catchAsync_default(async (req, res) => {
  const { id } = req.params;
  const result = await issueService.getSingleIssueFromDB(id);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue retrieved successfully",
    data: result
  });
});
var updateIssue = catchAsync_default(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const result = await issueService.updateIssueInDB(
    id,
    req.body,
    user
  );
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue updated successfully",
    data: result
  });
});
var deleteIssue = catchAsync_default(async (req, res) => {
  const { id } = req.params;
  const result = await issueService.deleteIssueFromDB(id);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue deleted successfully",
    data: null
  });
});
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middlewares/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var auth = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!"
        });
      }
      const decoded = import_jsonwebtoken2.default.verify(
        token,
        config_default.jwt_secret
      );
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token!"
      });
    }
  };
};

// src/modules/issues/issue.route.ts
var router2 = (0, import_express2.Router)();
router2.post("/", auth("contributor", "maintainer"), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth("contributor", "maintainer"), issueController.updateIssue);
router2.delete("/:id", auth("maintainer"), issueController.deleteIssue);
var issueRoutes = router2;

// src/middlewares/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  return res.status(statusCode).json({
    success: false,
    message,
    errors: err
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = (0, import_express3.default)();
app.use(import_express3.default.json());
app.use(
  (0, import_cors.default)({
    origin: "http://localhost:5000/"
  })
);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express Server",
    author: "Next Level"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoutes);
app.use(globalErrorHandler_default);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.cjs.map