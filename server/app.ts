import express from "express";
// import { toNodeHandler } from "better-auth/node";
// import { auth } from "./lib/auth";
// import cors from "cors";
// import { errorHandler } from "./middlewares/errorHandler";
// import { verifyUser } from "./middlewares/auth.middleware";
// import { companyRouter } from "./routes/company.route";
// import { internRouter } from "./routes/intern.route";
// import { job } from "./routes/job.route";
// import { application } from "./routes/application.route";
// import { interview } from "./routes/interview.route";
// import path from "path";
// import dotenv from "dotenv";
// import review from "./routes/review.route";
// import router from "./routes/chat-app/chat.routes";

dotenv.config();

const app = express();

app.use(
  cors(
    {
    origin: process.env.CLIENT_URL,
    credentials: true,
  }
)
);
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());

//related to job
app.use("/api/jobs", job);

//related to application
app.use("/api/applications", application);

//related to interviews
app.use("/api/interviews", interview);

//related to interviews
app.use("/api/reviews", review);

//related to chat 
app.use("/api/chat", router);


//multiform registration
app.use("/api/company", companyRouter);
app.use("/api/intern", internRouter);

// app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(process.cwd(), "uploads")));

app.use(errorHandler);
export default app;
