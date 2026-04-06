const connectDB = require("./db");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const inventoryRoutes = require("./routes/inventoryRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({
    origin: ["http://localhost:3000", "https://codefrontend-59hz6gztq-venkat-ramana-paritalas-projects.vercel.app", process.env.FRONTEND_URL],
    credentials: true
}));
app.use(express.json());

connectDB();

app.use("/api/inventory", inventoryRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("backend running ");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log("server started running on port " + PORT);
});
