// Fetch the data from the server


fetch('/financials')
    .then(response => response.json())
    .then(data => {
        /*
        const playerInfo = document.querySelector('.player-info');
        // Display all jobs to the user in the UI
        playerInfo.appendChild(stringToHTML(`<div class="player-details"><h2 class="player-name">${data.username}</h2>
        <p class="player-experience">Experience: ${data.experience}</p>
        <p class="player-education">Education: ${data.education}</p>
        <p class="player-job">Job: ${ data.job }</p></div>`))
*/

        const incomesTable = document.querySelector('table[name="incomes"] tbody');
        const expensesTable = document.querySelector('table[name="expenses"] tbody');
        const assetsTable = document.querySelector('table[name="assets"] tbody');
        const liabilitiesTable = document.querySelector('table[name="liabilities"] tbody');
        const paydayElement = document.getElementById('payday')
        var payday = 0;

        console.log(data)

        data.cashflow.forEach(cf => {
            cfElement = stringToHTML(`<table><tr id="${cf.id}">
            <td name="name">${cf.name}</td>
            <td name="value">${cf.value}$</td>
          </tr></table>`).firstChild.firstChild

            if(cf.type == "income"){
              incomesTable.append(cfElement)
              payday += cf.value
            } 
            else if(cf.type == "expense"){ 
              expensesTable.append(cfElement)
              payday -= cf.value
            }
        });

        paydayElement.innerText = `Payday: ${payday}$`

        data.real_estate.forEach(re => {
            reElement = stringToHTML(`<table><tr id="${re.id}" class="clickable" onclick="sellRealEstate('${re.id}', '${re.name}')">
            <td name="name">${re.name}</td>
            <td name="value">${re.value}$</td><td></td>
            </tr></table>`).firstChild.firstChild

            assetsTable.querySelector(`tr[name="real estate"]`).insertAdjacentElement('afterend', reElement);
        });

        data.stocks.forEach(stock => {
          stockElement = stringToHTML(`<table><tr id="${stock.id}" class="stock" onclick="selectAmountPrompt('Select amount of ${stock.symbol} you want to sell!', 'sellStock(\`${stock.id}\`)', ${stock.price})">
          <td name="name">${stock.symbol}</td>
          <td name="price">${dollars(stock.price)}</td>
          <td name="amount">${stock.amount}</td>
          </tr></table>`).firstChild.firstChild

          assetsTable.querySelector('tr[name="stock"]').insertAdjacentElement('afterend', stockElement);
      });

        data.liabilities.forEach(l => {
            lElement = stringToHTML(`<table><tr ${player.balance >= l.value ? `onclick='payOffLiability("${l.id}")' class="clickable"` : ''} id="${l.id}">
            <td name="name">${l.name}</td>
            <td name="value">${l.value}$</td>
          </tr></table>`).firstChild.firstChild

          liabilitiesTable.append(lElement)

        });


    });

    function payOffLiability(id) {
      // Prompt user to confirm payment
      if (window.confirm("Are you sure you want to pay off this loan?")) {
        // If user confirms payment, send POST request to API endpoint
        fetch(`/pay-off-liability/${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id })
        })
        .then(response => response.json())
        .then(data => {
          // handle response from server
          if (data.error) alert(data.error);
          else location.reload();
        })
        .catch(error => {
          console.error(`Error paying off loan ${id}: ${error}`);
        });
      }
    }

    function sellStock(id){
      const amount = amountPrompt.querySelector('#amount').value
      if(amount%1 != 0 || amount<1) {alert("Invalid Input! Amount must be a positive whole number!");return;}
      deleteAmountPrompt()
      console.log('Sell ', id, amount)
    
      fetch(`/sell/stock`, {
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
        else location.reload();
      
      })
      .catch(error => {
        alert('Error selling stock:', error);
      });
    
    }    
    
    function sellRealEstate(id, name){
      if (!window.confirm(`Are you sure you want to sell ${name}?`)) return;
      fetch(`/sell/real_estate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reId: id,
        })
      })
      .then(response => response.json())
      .then(data => {
        // handle response from server
        if (data.error) alert(data.error);
        else location.reload();
      
      })
      .catch(error => {
        alert('Error selling real estate:', error);
      });
    }
    
