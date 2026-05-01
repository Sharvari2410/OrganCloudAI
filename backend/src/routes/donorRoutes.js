import express from "express";
import { createCrudRouter } from "./crudRouterFactory.js";

const router = express.Router();

router.use("/", createCrudRouter("donor"));

export default router;
