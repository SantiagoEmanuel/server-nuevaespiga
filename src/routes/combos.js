import { Router } from "express";
import { db } from "../api/database.js";

export const combos = Router();

combos.get("/", async (_req, res) => {
  const { rows } = await db.execute(
    "select * from combos inner join comboProducts on combos.id = comboProducts.id"
  );
  rows.forEach((row) => {
    row.image = `http://localhost:8080/uploads/${row.image}`;
  });
  return res.status(200).json(...rows);
});

combos.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.execute({
    sql: "select * from combos inner join comboProducts on combos.id = comboProducts.id where combos.id = ?",
    args: [id],
  });
  return res.status(200).json(...rows);
});
