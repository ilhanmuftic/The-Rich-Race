const parts = window.location.href.split('/');
const stockId = parts[parts.length - 1];
var stockHistory = []; // populate this with stock prices from database
//var dates = []; 
console.log(stockId)
var stocks
fetch('/get-stocks')
  .then(response => response.json())
  .then(data => {

    const stockList = document.querySelector('#s-list');
    stocks = data.stocks

    const stock = stocks.filter(s=>s.id==stockId)[0]
    fetch(`/stock-history/${stockId}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
    // populate this with dates from database
    
        data.history.forEach(s => {
            stockHistory.push(s.new_price)
            //dates.push(s.date.slice(0,19).replace('T', ' '))
        })
            
            new Chart(document.getElementById('chart'), {
              type: 'line',
              data: {
                labels: [...Array(stockHistory.length).keys()].map(x => ++x),
                datasets: [{
                  label: stock.name,
                  data: stockHistory,
                  fill: false,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
                }]
              },
              options: {
                responsive: false,
                scales: {
                  x: {
                    type: 'time',
                    time: {
                      unit: 'day'
                    },
                    ticks: {
                      source: 'auto'
                    }
                  },
                  y: {
                    ticks: {
                      beginAtZero: true
                    }
                  }
                }
              }
            });
       });

    data.stocks.forEach(stock => {

        stockElement = stringToHTML(`<li><a href="/market/stock/${stock.id}">${stock.symbol}</a></li>`)

      stockList.appendChild(stockElement);
    });



    });








