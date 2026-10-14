// load the libraries we need
const express = require("express");
const path = require("path");
const multer = require("multer"); // handles file uploads
const app = express();
const PORT = process.env.PORT || 3000;

// upload settings: save files in uploads/, max 2 MB, only PNG, JPG or PDF
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PNG, JPG or PDF files are allowed"));
  },
});

// middleware: reads normal form data and puts it in req.body
app.use(express.urlencoded({ extended: true }));
// middleware: reads JSON data sent by fetch
app.use(express.json());
// middleware: serves files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// tickets are stored in an array for now (database comes later in the course)
let tickets = [];
let nextId = 1; // gives each ticket a new number
const STATUSES = ["open", "in progress", "closed"];

// stops people from typing HTML or scripts into the form (XSS)
function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// makes one safe cell for the CSV file
function csvCell(value) {
  let s = String(value ?? "");
  // a leading = + - @ can run as a formula in Excel, so we put ' in front
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  // quotes inside a cell are doubled in CSV
  return '"' + s.replace(/"/g, '""') + '"';
}

// POST route: runs when the form is submitted
// upload.single reads the file field called "attachment"
app.post("/tickets", upload.single("attachment"), (req, res) => {
  // get the form values from req.body
  const { title, category, priority, description } = req.body;
  // check that the title is not empty
  if (!title || !title.trim()) {
    return res.status(400).send("Title is required");
  }
  // add the new ticket to the array
  tickets.push({
    id: nextId++,
    title: title.trim(),
    category,
    priority,
    description,
    status: "open",
    // req.file only exists if the user attached a file
    attachment: req.file
      ? { path: req.file.path, name: req.file.originalname }
      : null,
  });
  // send the user to the list page
  res.redirect("/tickets");
});

// GET route with a query string, for example /tickets?status=open
app.get("/tickets", (req, res) => {
  let list = tickets;
  // req.query.status is the value after ?status=
  if (req.query.status) {
    list = list.filter((t) => t.status === req.query.status);
  }
  // build the HTML for each ticket
  const items = list
    .map(
      (t) => `<div class="ticket">
        <a href="/tickets/${t.id}"><b>#${t.id} ${escapeHtml(t.title)}</b></a>
        <p>${escapeHtml(t.category)} | ${escapeHtml(t.priority)} | ${escapeHtml(t.status)}</p>
      </div>`
    )
    .join("");
  res.send(`<link rel="stylesheet" href="/style.css">
    <h1>Tickets</h1>
    <p><a href="/tickets">All</a> | <a href="/tickets?status=open">Open</a> | <a href="/tickets?status=closed">Closed</a></p>
    ${items || "<p>No tickets found.</p>"}
    <p><a href="/">New ticket</a> | <a href="/dashboard.html">Dashboard</a></p>`);
});

// CSV download: sends all tickets as a file
app.get("/export.csv", (req, res) => {
  const header = ["id", "title", "category", "priority", "status", "description"];
  const rows = tickets.map((t) =>
    [t.id, t.title, t.category, t.priority, t.status, t.description]
      .map(csvCell)
      .join(",")
  );
  // attachment tells the browser to download instead of showing the file
  res.attachment("tickets.csv");
  res.type("text/csv");
  res.send([header.join(","), ...rows].join("\n"));
});

// GET route with a route param, for example /tickets/1
app.get("/tickets/:id", (req, res) => {
  // req.params.id is the number in the address (it is text, so we use Number)
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  // if there is no ticket with that id, send a 404
  if (!ticket) {
    return res.status(404).send("Ticket not found");
  }
  // show the download link only if the ticket has an attachment
  const attachmentLink = ticket.attachment
    ? `<p><a href="/tickets/${ticket.id}/attachment">Download attachment: ${escapeHtml(ticket.attachment.name)}</a></p>`
    : "";
  res.send(`<link rel="stylesheet" href="/style.css">
    <h1>Ticket #${ticket.id}: ${escapeHtml(ticket.title)}</h1>
    <p>Category: ${escapeHtml(ticket.category)}</p>
    <p>Priority: ${escapeHtml(ticket.priority)}</p>
    <p>Status: ${escapeHtml(ticket.status)}</p>
    <p>${escapeHtml(ticket.description)}</p>
    ${attachmentLink}
    <p><a href="/tickets">Back to list</a></p>`);
});

// download the file that was attached to a ticket
app.get("/tickets/:id/attachment", (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket || !ticket.attachment) {
    return res.status(404).send("Attachment not found");
  }
  // res.download makes the browser save the file with its original name
  res.download(ticket.attachment.path, ticket.attachment.name);
});

// API route: sends the tickets as JSON for the dashboard's fetch call
app.get("/api/tickets", (req, res) => {
  res.json(
    tickets.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
    }))
  );
});

// API route: changes the status of one ticket (PATCH = change part of something)
app.patch("/api/tickets/:id/status", (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  // only allow statuses from our list
  if (!STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  ticket.status = req.body.status;
  res.json({ ok: true });
});

// start the server
app.listen(PORT, "0.0.0.0", () => console.log(`Listening on ${PORT}`));