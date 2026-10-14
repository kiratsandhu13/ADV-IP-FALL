// gets all tickets from the server and shows them on the page
async function loadTickets() {
  // fetch sends a GET request to our API without reloading the page
  const res = await fetch("/api/tickets");
  // turn the response into a JavaScript array
  const tickets = await res.json();
  const list = document.getElementById("list");
  // clear the old list before drawing it again
  list.textContent = "";

  if (tickets.length === 0) {
    list.textContent = "No tickets yet.";
    return;
  }

  // make one box on the page for each ticket
  tickets.forEach((t) => {
    const div = document.createElement("div");
    div.className = "ticket";

    const title = document.createElement("b");
    // textContent is safer than innerHTML (prevents XSS)
    title.textContent = `#${t.id} ${t.title}`;

    const info = document.createElement("p");
    info.textContent = `${t.category} | ${t.priority} | ${t.status}`;

    // dropdown to change the ticket status
    const select = document.createElement("select");
    ["open", "in progress", "closed"].forEach((s) => {
      const option = document.createElement("option");
      option.value = s;
      option.textContent = s;
      // pre-select the current status
      if (s === t.status) option.selected = true;
      select.appendChild(option);
    });

    // when the dropdown changes, tell the server the new status
    select.addEventListener("change", async () => {
      await fetch(`/api/tickets/${t.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: select.value }),
      });
      // reload the list so the page shows the update
      loadTickets();
    });

    div.append(title, info, select);
    list.appendChild(div);
  });
}

// run when the page opens
loadTickets();