import type { Request, Response } from "express";
import { issueService } from "./issue.service";


const createIssue = async (req: Request, res: Response) => {
    try {
        const reporterId = req.user.id;

        const result = await issueService.createIssueIntoDB(req.body, reporterId);

        res.status(201).json({
            success: true,
            message: "Issue created successfully",
            data: result
        })

    } catch (error: unknown) {
        res.status(500).json({
            success: false,
            message: "Could not create issue",
        });
    }
}

export const issueController = {
    createIssue,
};