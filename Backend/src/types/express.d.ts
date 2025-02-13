import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any; // Remplacez `any` par le type approprié si vous le connaissez
    }
  }
}
