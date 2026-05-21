import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()

router.post("/signup", authController.signUp);

export const authRoute = router;