// Get all jobs from the server
fetch('/get-real-estate')
  .then(response => response.json())
  .then(data => {

    const reList = document.querySelector('.market-table tbody');
    data.real_estate.forEach(re => {
        reElement = stringToHTML(`<table><tr id="${re.id}" onclick="buyRealEstate('${re.id}', '${re.name}', ${re.value})">
        <td name="name">${re.name}</td>
        <td name="type">${re.type}</td>
        <td name="cashflow">${dollars(re.cashflow)}</td>
        <td name="value" class="">${dollars(re.value)}</td>
      </tr></table>`).firstChild.firstChild

      reList.appendChild(reElement);
    });



    });



function buyRealEstate(id, name, value){
  if (player.balance < value) return offerLoan(name, value-player.balance, '/market/real_estate')
  if (!window.confirm(`Are you sure you want to pay buy ${name}?`)) return;

  fetch(`/buy/real_estate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reId: id
    })
  })
  .then(response => response.json())
  .then(data => {
    // handle response from server
    if (data.error) alert(data.error);
    else location.href = "/";
  
  })
  .catch(error => {
    alert(`Error buying ${name}:`, error);
  });
}

