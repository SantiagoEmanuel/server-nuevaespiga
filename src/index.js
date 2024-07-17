import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { json } from "express";
import cors from "cors";
import multer from "multer";

// Import dotenv
import dotenv from "dotenv";
dotenv.config();

// Configure project
const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
const uploadDir = join(__dirname, "uploads");

// Multer file upload configurations.
import { v4 } from "uuid";
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    cb(null, v4() + "-" + file.originalname);
  },
});
export const upload = multer({ storage: storage });

// Initialize app
const app = express();

// Configure middlewares
app.use(cors());
app.use(json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Routes

// Import all routes
import { users } from "./routes/users.js";
import { products } from "./routes/products.js";
import { orders } from "./routes/Orders.js";
import { admin } from "./routes/admin.js";

// Set routes
app.use("/users", users);
app.use("/products", products);
app.use("/orders", orders);
app.use("/admin", upload.single("image"), admin);
// Bad request handler
app.use((_req, res) => {
  res.send("<h1>Error 404</h1>");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
