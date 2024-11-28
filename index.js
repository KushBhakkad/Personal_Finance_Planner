import express from "express";
import bodyParser from "body-parser";
import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// Middleware setup
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.get("/", async (req, res) => {
  res.render("index.ejs");
});

app.get("/clientinfo", async (req, res) => {
  res.render("clientinfo.ejs");
});

app.get("/updateclient", async (req, res) => {
  res.render("updateclient.ejs");
});

app.get("/searchclient", async (req, res) => {
  res.render("searchclient.ejs");
});

app.get("/deleteclient", async (req, res) => {
  res.render("deleteclient.ejs");
});

app.post("/submit-clientinfo", async (req, res) => {
  const { name, age, occupation, income, maritalStatus, dependencies, financialGoal } = req.body;

  if (!name) {
    return res.status(400).send("Client name is required.");
  }

  const sanitizedName = name.trim().toLowerCase(); 

  try {
    const result = await sql`
      INSERT INTO client_info (name, age, occupation, income, marital_status, dependencies, financial_goal)
      VALUES (${sanitizedName}, ${age}, ${occupation}, ${income}, ${maritalStatus}, ${dependencies}, ${financialGoal})
      RETURNING id;
    `;
    res.send("Client information submitted successfully.");
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).send("Error saving client information.");
  }
});

app.post("/update-clientinfo", async (req, res) => {
  const { name, age, occupation, income, maritalStatus, dependencies, financialGoal } = req.body;

  if (!name) {
    return res.status(400).send("Client name is required.");
  }

  const sanitizedName = name.trim().toLowerCase(); 

  try {
    const result = await sql`
      UPDATE client_info
      SET 
        age = ${age},
        occupation = ${occupation},
        income = ${income},
        marital_status = ${maritalStatus},
        dependencies = ${dependencies},
        financial_goal = ${financialGoal}
      WHERE name = ${sanitizedName};
    `;

    if (result.count === 0) {
      res.status(404).send("No client found with the specified name. Update failed.");
    } else {
      res.send("Client record updated successfully.");
    }
  } catch (err) {
    console.error("Error updating data:", err);
    res.status(500).send("Error updating client information.");
  }
});

app.delete("/delete-clientinfo", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send("Client name is required.");
  }

  const sanitizedName = name.trim().toLowerCase(); 

  try {
    const result = await sql`
      DELETE FROM client_info WHERE name = ${sanitizedName} RETURNING *;
    `;

    if (result.length === 0) {
      res.status(404).send("No client found with the specified name. Deletion failed.");
    } else {
      res.send("Client record deleted successfully.");
    }
  } catch (err) {
    console.error("Error deleting data:", err);
    res.status(500).send("Error deleting client information.");
  }
});

function toSentenceCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

app.post("/search-clientinfo", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send("Client name is required.");
  }

  const sanitizedName = name.trim().toLowerCase(); // Trim spaces and convert to lowercase

  try {
    const result = await sql`
      SELECT * FROM client_info WHERE name = ${sanitizedName};
    `;

    if (result.length === 0) {
      return res.status(404).send("No client found with the specified name.");
    }

    const client = result[0]; // Assuming client is unique by name

    // Convert name to sentence case
    const formattedName = toSentenceCase(client.name);

    res.json({
      name: formattedName, // Displaying name in sentence case
      age: client.age,
      occupation: client.occupation,
      income: client.income,
      marital_status: client.marital_status,
      dependencies: client.dependencies,
      financial_goal: client.financial_goal,
    });
  } catch (err) {
    console.error("Error searching data:", err);
    res.status(500).send("Error searching client information.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});