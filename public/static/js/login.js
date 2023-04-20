// Select DOM elements
const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");
const sign_in_form = document.querySelector(".sign-in-form");
const sign_up_form = document.querySelector(".sign-up-form");

// Add event listeners
sign_up_btn.addEventListener("click", () => {
  sign_in_form.classList.add("disabled");
  sign_up_form.classList.remove("disabled");
  sign_up_btn.classList.add("disabled");
  sign_in_btn.classList.remove("disabled");
});

sign_in_btn.addEventListener("click", () => {
  signInMode();
});

// Prevent form submission


// Prevent form submission
sign_in_form.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = sign_in_form.username.value;
  const password = sign_in_form.password.value;
  const data = { username, password };
  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        window.location.href = "/";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
    });
});

sign_up_form.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = sign_up_form.username.value;
  const password = sign_up_form.password.value;
  const data = { username, password };
  fetch("/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        alert("Account created successfully. Please log in.");
        signInMode();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
    });
});

function signInMode(){
  sign_in_form.classList.remove("disabled");
  sign_up_form.classList.add("disabled");
  sign_in_btn.classList.add("disabled");
  sign_up_btn.classList.remove("disabled");
}