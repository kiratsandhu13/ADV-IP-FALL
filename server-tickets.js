const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Tickets live in memory for now (a database comes later in the course)
let tickets = [];
let nextId = 1;

// Stops users from injecting HTML/scripts into the page (XSS)
function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Read form data from req.body and save it
app.post("/tickets", (req, res) => {
  const { title, category, priority, description } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).send("Title is required");
  }
  tickets.push({
    id: nextId++,
    title: title.trim(),
    category,
    priority,
    description,
    status: "open",
  });
  res.redirect("/tickets");
});

// List tickets, optionally filtered by a query string
app.get("/tickets", (req, res) => {
  let list = tickets;
  if (req.query.status) {
    list = list.filter((t) => t.status === req.query.status);
  }
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
    <p><a href="/">New ticket</a></p>`);
});

// One ticket using a route param
app.get("/tickets/:id", (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) {
    return res.status(404).send("Ticket not found");
  }
  res.send(`<link rel="stylesheet" href="/style.css">
    <h1>Ticket #${ticket.id}: ${escapeHtml(ticket.title)}</h1>
    <p>Category: ${escapeHtml(ticket.category)}</p>
    <p>Priority: ${escapeHtml(ticket.priority)}</p>
    <p>Status: ${escapeHtml(ticket.status)}</p>
    <p>${escapeHtml(ticket.description)}</p>
    <p><a href="/tickets">Back to list</a></p>`);
});

app.listen(PORT, "0.0.0.0", () => console.log(`Listening on ${PORT}`));