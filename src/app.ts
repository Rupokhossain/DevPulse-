import express, {
  type Application,
  type Request,
  type Response,
} from "express";

const app: Application = express();
const port = 5000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Next Level",
  });
});

export default app;
