// Get all jobs from the server
fetch('/get-motorcycles')
  .then(response => response.json())
  .then(data => {
console.log(data)
    const vehicleContainer = document.querySelector('#vehicle-container');
    data.motorcycles.forEach(vehicle => {
        vehicle.name = vehicle.brand_name + " " + vehicle.model
        vehicleElement = stringToHTML(`<div class="vehicle-card" id=${vehicle.id}>
        <img src="/img/markets/motorcycles/${vehicle.id}.png" alt="${vehicle.name}">
        <h3>${vehicle.name}</h3>
        <p>${vehicle.brand_name}</p>
        <p>${dollars(vehicle.price)}</p>
        <button class="buy-button" onclick="buyMotorcycle(${vehicle.id}, '${vehicle.name}', ${vehicle.price})">Buy</button>
      </div>`)

      vehicleContainer.appendChild(vehicleElement);
    });



    });



function buyMotorcycle(id, name, value){
  if (player.balance < value) return offerLoan(name, value-player.balance, '/market/vehicle/motorcycle')
  if (!window.confirm(`Are you sure you want to pay buy ${name}?`)) return;

  fetch(`/buy/motorcycle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vehicleId: id
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

