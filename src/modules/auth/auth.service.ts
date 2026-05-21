import bcrypt from "bcrypt"
import type { userData } from "./auth.interface";
import { pool } from "../../db";


const createUserIntoDB = async (payload: userData) => {

    const {name, email, password, role} = payload;

    const hashPassword = await bcrypt.hash(password, 12);

    const query = `
        INSERT INTO users (name, email, role, created_at, updated_at)
    `;

    const values = [name, email, hashPassword, role || 'contributor'];

    const result = await pool.query(query, values);
    return result.rows[0];

}


export const authService = {
    createUserIntoDB,
}