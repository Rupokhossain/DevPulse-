import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import type { TIssueFilters } from "./issue.interface";

const createIssue = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user.id;

    const result = await issueService.createIssueIntoDB(req.body, reporterId);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Could not create issue",
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const filters = req.query as unknown as TIssueFilters;

    const result = await issueService.getAllIssuesFromDB(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching issues",
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.getSingleIssueFromDB(id as string);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the issue",
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue
};
