import { Router } from "express";
import { issueController } from "./issue.controller";
import { auth } from "../../middlewares/auth";



const router = Router();

router.post("/", auth("contributor", "maintainer"), issueController.createIssue);

router.get("/", issueController.getAllIssues);

router.get("/:id", issueController.getSingleIssue);

export const issueRoutes = router;