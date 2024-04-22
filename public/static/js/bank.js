const loanForm = document.getElementById("loan-form")

const urlParams = new URLSearchParams(window.location.search);
const loanName = urlParams.get('name');
const loanValue = urlParams.get('value');
var to = urlParams.get('to');



if(loanName) document.getElementById('name').value = loanName;
if(loanValue) document.getElementById('amount').value = loanValue;
if(!to) to = "/"




loanForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = loanForm.name.value;
    const amount = loanForm.amount.value;
    const data = { name, amount };
    if(parseInt(amount) > player.salary*6) return alert("You can't take that loan. Maximum amount is " + dollars(player.salary*6))
    fetch("/get-loan", {
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
          window.location.href = to;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
      });
  });