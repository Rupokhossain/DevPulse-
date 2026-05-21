import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors"
import { authRoute } from "./modules/auth/auth.route";
import { issueRoutes } from "./modules/issues/issue.route";

const app: Application = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5000/"
  })
)

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Next Level",
  });
});

app.use("/api/auth", authRoute);

app.use("/api/issues", issueRoutes);

export default app;
