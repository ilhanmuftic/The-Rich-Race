// Get all jobs from the server
var stocks
fetch('/get-stocks')
  .then(response => response.json())
  .then(data => {

    const stockList = document.querySelector('.market-table tbody');
    stocks = data.stocks
    data.stocks.forEach(stock => {
        var color
        if(stock.stability >= 80) color="dark-green"
        else if(stock.stability >= 60) color="green"
        else if(stock.stability >= 40) color="yellow"
        else if(stock.stability >= 25) color="orange"
        else color="red"
        stockElement = stringToHTML(`<table><tr id="${stock.id}" onclick="selectAmountPrompt('Select amount of ${stock.symbol}!', 'buyStock(${stock.id})', ${stock.price})">
        <td name="name">${stock.name}</td>
        <td name="symbol">${stock.symbol}</td>
        <td name="price">${stock.price}$</td>
        <td name="stability" class="stability ${color}">${stock.stability}</td>
      </tr></table>`).firstChild.firstChild

      stockList.appendChild(stockElement);
    });



    });

function buyStock(id){
  const amount = amountPrompt.querySelector('#amount').value
  if(amount%1 != 0) {alert("Invalid Input! Amount must be a whole number!");return;}
  deleteAmountPrompt()
  console.log('Buy ', id, amount)

  fetch(`/buy/stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stockId: id,
      amount: amount
    })
  })
  .then(response => response.json())
  .then(data => {
    // handle response from server
    if (data.error) alert(data.error);
    else location.href = "/";
  
  })
  .catch(error => {
    alert('Error buying stock:', error);
  });

}    
