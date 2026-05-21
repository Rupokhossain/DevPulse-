import { Router } from "express";
import { issueController } from "./issue.controller";
import { auth } from "../../middlewares/auth";



const router = Router();

router.post("/", auth("contributor", "maintainer"), issueController.createIssue);

export const issueRoutes = router;