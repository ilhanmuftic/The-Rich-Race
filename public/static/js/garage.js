// Get all jobs from the server
fetch('/get-player-vehicles')
  .then(response => response.json())
  .then(data => {
console.log(data)
    const vehicleContainer = document.querySelector('#vehicle-container');
    data.cars.forEach(vehicle => {
        vehicle.name = vehicle.brand_name + " " + vehicle.model
        vehicleElement = stringToHTML(`<div class="vehicle-card" id=${vehicle.id}>
        <img src="/img/markets/cars/${vehicle.car_id}.png" alt="${vehicle.name}">
        <h3>${vehicle.name}</h3>
        <p>${vehicle.brand_name}</p>
        <p>${dollars(vehicle.value)}</p>
        <button class="red" onclick="sellCar(${vehicle.id}, '${vehicle.name}')">Sell</button>
      </div>`)

      vehicleContainer.appendChild(vehicleElement);
    });

    data.motorcycles.forEach(vehicle => {
      vehicle.name = vehicle.brand_name + " " + vehicle.model
      vehicleElement = stringToHTML(`<div class="vehicle-card" id=${vehicle.id}>
      <img class="motorcycle" src="/img/markets/motorcycles/${vehicle.motorcycle_id}.png" alt="${vehicle.name}">
      <h3>${vehicle.name}</h3>
      <p>${vehicle.brand_name}</p>
      <p>${dollars(vehicle.value)}</p>
      <button class="red" onclick="sellMotorcycle(${vehicle.id}, '${vehicle.name}')">Sell</button>
    </div>`)

    vehicleContainer.appendChild(vehicleElement);
  });



    });



function sellCar(id, name){
    if (!window.confirm(`Are you sure you want to sell ${name}?`)) return;

  fetch(`/sell/car/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    // handle response from server
    if (data.error) alert(data.error);
    else location.href = "/";
  
  })
  .catch(error => {
    alert(`Error selling ${name}:`, error);
  });
}


function sellMotorcycle(id, name){
  if (!window.confirm(`Are you sure you want to sell ${name}?`)) return;

fetch(`/sell/motorcycle/${id}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  // handle response from server
  if (data.error) alert(data.error);
  else location.href = "/";

})
.catch(error => {
  alert(`Error selling ${name}:`, error);
});
}


