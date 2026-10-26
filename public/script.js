
const API = "/api";

function showSection(id) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(id).classList.remove("hidden");

    if (id === "dashboard") loadDashboard();
    else loadRecords(id);
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

function safeText(value) {
    const span = document.createElement("span");
    span.textContent = value ?? "";
    return span.innerHTML;
}

async function loadDashboard() {
    try {
        const collections = ["students", "clubs", "events", "memberships"];

        for (const collection of collections) {
            const records = await request(`${API}/${collection}`);
            const elementId = collection === "students" ? "studentCount"
                : collection === "clubs" ? "clubCount"
                : collection === "events" ? "eventCount"
                : "membershipCount";

            document.getElementById(elementId).textContent = records.length;
        }
    } catch (error) {
        alert("Could not load dashboard: " + error.message);
    }
}

async function loadRecords(collection) {
    const list = document.getElementById(
        collection === "students" ? "studentList"
        : collection === "clubs" ? "clubList"
        : collection === "events" ? "eventList"
        : "membershipList"
    );

    try {
        const records = await request(`${API}/${collection}`);
        list.replaceChildren();

        if (records.length === 0) {
            list.textContent = "No records yet. Add your first record above.";
            return;
        }

        records.forEach(record => {
            const div = document.createElement("div");
            div.className = "record";

            const details = document.createElement("span");

            if (collection === "students") {
                details.innerHTML = `<strong>${safeText(record.name)}</strong> — ${safeText(record.email)} | ${safeText(record.department)}`;
            } else if (collection === "clubs") {
                details.innerHTML = `<strong>${safeText(record.name)}</strong> — ${safeText(record.description)} | Coordinator: ${safeText(record.coordinator)}`;
            } else if (collection === "events") {
                details.innerHTML = `<strong>${safeText(record.name)}</strong> — ${safeText(record.date)} | ${safeText(record.venue)}`;
            } else {
                details.textContent = `Student: ${record.studentId} | Club: ${record.clubId}`;
            }

            div.appendChild(details);

            const del = document.createElement("button");
            del.textContent = "Delete";
            del.className = "delete-btn";
            del.onclick = () => deleteRecord(collection, record._id);

            div.appendChild(del);
            list.appendChild(div);
        });
    } catch (error) {
        list.textContent = "Could not load records: " + error.message;
    }
}

async function addRecord(collection, record) {
    try {
        await request(`${API}/${collection}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record)
        });

        alert("Record added successfully!");
        await loadDashboard();
        await loadRecords(collection);
    } catch (error) {
        alert(error.message);
    }
}

async function deleteRecord(collection, id) {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
        await request(`${API}/${collection}/${id}`, {
            method: "DELETE"
        });

        await loadDashboard();
        await loadRecords(collection);
    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("studentForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);

    addRecord("students", {
        name: form.get("name").trim(),
        email: form.get("email").trim(),
        phone: form.get("phone").trim(),
        department: form.get("department").trim(),
        year: Number(form.get("year")) || null
    });

    event.target.reset();
});

document.getElementById("clubForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);

    addRecord("clubs", {
        name: form.get("name").trim(),
        description: form.get("description").trim(),
        coordinator: form.get("coordinator").trim()
    });

    event.target.reset();
});

document.getElementById("eventForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);

    addRecord("events", {
        name: form.get("name").trim(),
        clubId: form.get("clubId").trim(),
        date: form.get("date"),
        venue: form.get("venue").trim()
    });

    event.target.reset();
});

document.getElementById("membershipForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);

    addRecord("memberships", {
        studentId: form.get("studentId").trim(),
        clubId: form.get("clubId").trim(),
        joinDate: new Date().toISOString().slice(0, 10)
    });

    event.target.reset();
});

loadDashboard();
