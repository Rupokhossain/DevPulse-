import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import type { TIssueFilters } from "./issue.interface";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const createIssue = catchAsync(async (req: Request, res: Response) => {
  const reporterId = req.user.id;

  const result = await issueService.createIssueIntoDB(req.body, reporterId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Issue created successfully",
    data: result,
  });
});

const getAllIssues = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query as unknown as TIssueFilters;

  const result = await issueService.getAllIssuesFromDB(filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issues retrieved successfully",
    data: result,
  });
});

const getSingleIssue = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await issueService.getSingleIssueFromDB(id as string);

  if (!result) {
    const error = new Error("Issue not found") as Error & { statusCode: number };
    error.statusCode = 404; 
    throw error;
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issue retrieved successfully",
    data: result,
  });
});

const updateIssue = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user as { id: number; role: string };

  const result = await issueService.updateIssueInDB(
    id as string,
    req.body,
    user,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issue updated successfully",
    data: result,
  });
});

const deleteIssue = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await issueService.deleteIssueFromDB(id as string);


  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issue deleted successfully",
    data: null,
  });
});

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
