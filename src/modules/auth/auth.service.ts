import bcrypt from "bcrypt";
import type { userData } from "./auth.interface";
import { pool } from "../../db";
import jwt from "jsonwebtoken"
import config from "../../config";
import AppError from "../../utils/appError";

const createUserIntoDB = async (payload: userData) => {
  const { name, email, password, role } = payload;

  const hashPassword = await bcrypt.hash(password, 12);

  const query = `
        INSERT INTO users (name, email, password, role )
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at , updated_at
    `;

  const values = [name, email, hashPassword, role || "contributor"];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email = $1

        `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new AppError("Invalid Credentials!", 401);
  }

  const user = userData.rows[0];

  const matchPassword = await bcrypt.compare(password, user.password);

  if(!matchPassword) {
    throw new AppError("Invalid Credentials!", 401);
  }


  // generate token

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role : user.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: "1d",
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

export const authService = {
  createUserIntoDB,
  loginUser,
};
