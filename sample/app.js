const STORAGE_KEY = "todos";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const summary = document.getElementById("summary");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filters button");

let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let filter = "all";

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";

  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = todos.length === 0 ? "Nothing to do yet. Add a task above!" : "No tasks here.";
    list.appendChild(li);
  }

  for (const todo of visible) {
    const li = document.createElement("li");
    li.className = "todo" + (todo.done ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      update();
    });

    const text = document.createElement("span");
    text.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "delete";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "✕";
    del.addEventListener("click", () => {
      todos = todos.filter((t) => t.id !== todo.id);
      update();
    });

    li.append(checkbox, text, del);
    list.appendChild(li);
  }

  const remaining = todos.filter((t) => !t.done).length;
  summary.textContent = `${remaining} task${remaining === 1 ? "" : "s"} remaining`;
  clearBtn.style.visibility = todos.some((t) => t.done) ? "visible" : "hidden";
}

function update() {
  save();
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.unshift({ id: Date.now(), text, done: false });
  input.value = "";
  update();
});

filterBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  })
);

clearBtn.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  update();
});

render();
