var stringToHTML = function (str) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(str, 'text/html');
	return doc.body.getElementsByTagName('*')[0];
};

const playerInfo = document.querySelector('.player-info');
const username = document.querySelector('#username');
const balance = document.querySelector('#balance');
const max = document.getElementById('max')
var amountPrompt
var player;


if(playerInfo || username || balance){
	fetch('/player-info')
	.then(response => response.json())
	.then(data => {
		player = data
		if(username) {
			username.innerText = data.username
			username.href = `/player/${player.id}`
		}

		if(playerInfo){
			playerInfo.appendChild(stringToHTML(`<div class="player-details">
			<p class="player-experience">Experience: ${data.experience}</p>
			<p class="player-education">Education: ${data.education_name}</p>
			<p class="player-job">Job: ${data.job_title}</p>
			<p class="player-balance">Balance: ${dollars(data.balance)}</p></div>`))
		}else if(balance){
			balance.innerText = "Balance: " + dollars(data.balance)
			const mt = document.querySelector('.market-table')
			if(mt) mt.style="margin-top:0;"

		}else if(max){
			max.innerText = "Highest loan amount: " + dollars(player.salary * 6)
		}


	});
}

function logout(){
	  // Delete the JWT cookie
	  document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

	  // Redirect to the login page
	  window.location.href = "/login";
}


function dollars(number){
	return number.toLocaleString('en-US', { style: 'decimal' }) + '$'
}

function selectAmountPrompt(title, action, price, profit){
	profit = profit || null
	if(profit) profit = price-price/(profit/100 + 1)
	if(!amountPrompt){
		document.body.append(
			stringToHTML(`<div class="modal">
			<div class="modal-content">
			  <h2>${title}</h2>
			  <div style="display:flex;flex-direction:row;">
				<input type="number" id="amount" min=1 value=1 onkeypress="return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))" placeholder="Enter amount" onchange="updateTotal(${price}, ${profit})">
				<div class="prompt-info" name="info">${dollars(price)} <span style="${profit>0? "color:green":"color:red"}"> ${profit? dollars(profit): ""}</span></div>
				<div class="prompt-alert"></div>
			  </div>
			  <div class="button-container">
				<button class="cancel-button" onclick="deleteAmountPrompt()">Cancel</button>
				<button class="submit-button" onclick="${action}">Submit</button>
			  </div>
			</div>
		  </div>`)
		)


		amountPrompt = document.querySelector('.modal')
		
	}else{
		amountPrompt.classList.remove('disabled')
	}
}

function deleteAmountPrompt(){
	amountPrompt.remove()
	amountPrompt = undefined
}

function updateTotal(price, profit){
	profit = profit || null
	const amount = amountPrompt.querySelector('#amount').value
	amountPrompt.querySelector('.prompt-info').innerHTML = `${dollars(price*amount)} <span style="${profit>0? "color:green":"color:red"}"> ${profit? dollars(profit*amount): ""}</span>`
}

function offerLoan(name, value, to='/'){
	if (!window.confirm(`Do you want to take a ${dollars(value)} loan for ${name}?`)) return;
  
	location.href=`/bank?name=${name.replaceAll(/ /g, "%20")}%20Loan&value=${value}&to=${to}`
  }    