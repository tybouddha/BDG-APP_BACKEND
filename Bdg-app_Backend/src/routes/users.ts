var express = require("express");
var router = express.Router();
import { Request, Response } from "express";

/* GET users listing. */
router.get("/", function (req: Request, res: Response, next: any) {
  res.send("respond with a resource");
});

module.exports = router;
