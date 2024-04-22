const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const JWT_SECRET = 'your_secret_key_here';
const path = require('path')
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 3000;


app.use(express.static(path.join("public", "static")))
app.set('trust proxy', 1)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser())


// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cashflow',
  multipleStatements: true
});

//5 min 300000
const minStockInterval = 30000
// 1.5h 5400000
const maxStockInterval = 540000


// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL.');
  const randomInterval = Math.floor(Math.random() * (maxStockInterval - minStockInterval + 1)) + minStockInterval;
  setTimeout(() => {
    updateStockPrice()
  }, randomInterval);
});




// Authentication middleware
const authMiddleware = async (req, res, next) => {
  // Get the JWT from the cookie

  try {
    // Verify the JWT and extract the user ID
    const token = req.cookies.jwt;
    const { playerId } = jwt.verify(token, JWT_SECRET);

    // Attach the user object to the request
    const playerQuery = `SELECT p.*, j.title AS job_title, e.name AS education_name, pt.time as experience, (j.salary + j.salary * p.job_raise/100) as salary
    FROM players p
    LEFT JOIN jobs j ON p.job_id = j.id
    LEFT JOIN education e ON p.education_id = e.id
    LEFT JOIN player_time pt ON pt.player_id = p.id
    WHERE p.id = '${playerId}'
    `;

    const playerRows = await new Promise((resolve, reject) => {
      db.query(playerQuery,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });


    const player = playerRows[0];
    console.log(player)

  if (!player) {
      return res.status(401).send({error:'Unauthorized'});
  }

  const currentDate = new Date().toISOString().slice(0,10)
  const time = await new Promise((resolve, reject) => {
    db.query(`UPDATE player_time SET time = time + 1, last_login = DATE('${currentDate}') WHERE player_id = '${playerId}' AND DATE(last_login) != DATE('${currentDate}');`,  (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows);
    });
  });

  if(time == 1){
        // Get all types and values from player_cashflow table
    const cashflowRows = await new Promise((resolve, reject) => {
      db.query(`SELECT type, value FROM player_cashflow WHERE player_id = '${playerId}'`, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Calculate sum of values based on type
    let sum = 0;
    cashflowRows.forEach(row => {
      if (row.type === 'income') {
        sum += row.value;
      } else if (row.type === 'expense') {
        sum -= row.value;
      }
    });

    // Update player balance in players table

    await db.query(`UPDATE players SET balance = balance + ${sum} WHERE id = '${playerId}'`, (err) => {if (err) throw err;});

    const edu_trans = await new Promise((resolve, reject) => {
      db.query(`SELECT et.*, e.completion_time
      FROM education_transactions et
      JOIN education e ON e.id = et.education_id
      WHERE et.player_id = '${playerId}'
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if(edu_trans[0] && player.experience+1 - edu_trans[0].start_time == edu_trans[0].completion_time ){
      console.log(player.experience, edu_trans[0].start_time, edu_trans[0].completion_time)
      await db.query(`UPDATE players SET education_id = ${edu_trans[0].education_id} WHERE id = '${playerId}'; DELETE FROM education_transactions WHERE id=${edu_trans[0].id}`, (err) => {if (err) throw err;});
      return authMiddleware(req, res, next)
    }



  }

  req.player = player;

  next();
  } catch (err) {
    console.log(err)
    //res.status(401).send({error:'Unauthorized'});
    res.redirect('/login')
  }
};  


app.get('/', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'));
})

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "login.html"));
});

app.get('/jobs', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "job_select.html"));
});

app.get('/education', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "education.html"));
});

app.get('/bank', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "bank.html"));
});

app.get('/market', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "market.html"));
});

app.get('/market/stock', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "market", "stock.html"));
});

app.get('/market/stock/:id', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "market", "stock_history.html"));
});

app.get('/market/real_estate', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "market", "real_estate.html"));
});

app.get('/market/vehicle', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "market", "vehicle.html"));
});

app.get('/market/vehicle/car', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "market", "car.html"));
});

app.get('/market/vehicle/motorcycle', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "market", "motorcycle.html"));
});

app.get('/garage', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "garage.html"));
});

app.get('/player/:id', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "profile.html"));
});

app.get('/time', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "time.html"));
});


app.get('/financials', authMiddleware, async (req, res) => {
  const liabilities = await new Promise((resolve, reject) => {
    db.query(`SELECT id, name, value FROM player_liabilities WHERE player_id='${req.player.id}' ORDER BY date asc, value desc`,  (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  const real_estate = await new Promise((resolve, reject) => {
    db.query(`SELECT re.name, re.value, pre.*
    FROM player_real_estate pre 
    JOIN real_estate re ON pre.real_estate_id = re.id 
    WHERE pre.player_id = '${req.player.id}' 
    ORDER BY pre.date DESC;`,  (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  const stocks = await new Promise((resolve, reject) => {
    db.query(`SELECT s.id, s.symbol, ps.amount, s.price,  CAST((s.price - ps.paid/ps.amount) * 100 AS DECIMAL(10, 2)) AS profit
    FROM player_stocks ps 
    JOIN stocks s ON ps.stock_id = s.id 
    WHERE ps.player_id = '${req.player.id}' 
    ORDER BY ps.date DESC;
    `,  (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });


  const cashflow = await new Promise((resolve, reject) => {
    db.query(`SELECT id, type, name, value FROM player_cashflow WHERE player_id='${req.player.id}' ORDER BY date asc, type`,  (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });  

  res.status(200).send({liabilities:liabilities, cashflow:cashflow, real_estate:real_estate, stocks:stocks})
})



app.get('/player-info', authMiddleware, async (req, res) => {
  var player = req.player
  //delete player.id
  delete player.password
  delete player.email
  res.status(200).send(player)
})


// GET route to display all jobs and allow selection of jobs with no requirements
app.get('/get-jobs', authMiddleware, async (req, res) => {
  try {
    // Get all jobs from the jobs table

    const jobsQuery = `SELECT j.*, e.name AS education_name 
    FROM jobs j 
    JOIN education e ON j.education_required = e.id 
    ORDER BY j.education_required, j.experience_required
    `;
    const jobs = await new Promise((resolve, reject) => {
      db.query(jobsQuery,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.status(200).send({ jobs: jobs });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/job_select/:jobId', authMiddleware, (req, res) => {
  const jobId = req.params.jobId;
  const player = req.player; // replace with function to get current player

  db.query(`SELECT experience_required, education_required, salary FROM jobs WHERE id = ${jobId}`, (err, results) => {
    if(err){
      res.status(500).send({error:error})
      throw err
    } 
    if(!results[0]) res.status(404).send({error:'Job Not Found!'})
    const job = results[0];
    console.log(player, job)
    if (player.experience >= job.experience_required && player.education_id >= job.education_required) {
      db.query(`UPDATE players SET job_id=${jobId} WHERE id='${player.id}'`)
      db.query(`UPDATE player_cashflow SET value=${job.salary} WHERE player_id="${player.id}" AND name="Job Salary";UPDATE player_cashflow SET value=${job.salary/4} WHERE player_id="${player.id}" AND name="Other Expenses";`,  (err, res) => {
        if(err) throw err;
      }) // replace with function to add cash flow
      res.status(200).send({ success: true });
    } else {
      // player does not meet job requirements
      res.status(423).send({ error: 'You do not meet the requirements for this job.' });
    }
  })

   // replace with function to get job by ID
  
  // check if player meets job requirements
  
});

// GET route to display all jobs and allow selection of jobs with no requirements
app.get('/get-educations', authMiddleware, async (req, res) => {
  try {
    // Get all jobs from the jobs table

    const eduQuery = `SELECT * FROM education`;
    const edus = await new Promise((resolve, reject) => {
      db.query(eduQuery,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const active = await new Promise((resolve, reject) => {
      db.query(`SELECT start_time, education_id FROM education_transactions WHERE player_id='${req.player.id}'`,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });


    res.status(200).send({ educations: edus, active:active });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/edu_select/:eduId', authMiddleware, async (req, res) => {
  const eduId = parseInt(req.params.eduId);
  const player = req.player;

  try{
    const edus = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM education WHERE id=${eduId}`,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if(!edus[0]) return res.status(404).send({error:"Education Not Found!"})
    if(edus[0].experience_required > player.experience) return res.status(403).send({error:"Not Enough Experience!"})
    if(edus[0].id-1 != player.education_id) return res.status(403).send({error:"Education Not High Enough!"})
    if(edus[0].cost > player.balance) return res.status(402).send({error:"Not Enough Money!"})

    await db.query(`INSERT INTO education_transactions (player_id, education_id, start_time) VALUES ('${player.id}', ${eduId}, ${player.experience});UPDATE players SET balance = balance - ${edus[0].cost} WHERE id = '${player.id}' `, err =>{ if(err) throw err })
    res.status(200).send({})
  }catch(err){
    console.error(err)
    res.status(500).send({error:"Internal Server Error!"})
  }

});


app.post('/get-loan', authMiddleware, (req, res) => {
  var {name, amount} = req.body;

  const playerId = req.player.id; // replace with function to get current player
  if(req.player.salary*6 < amount) return res.status(402).send({error:"Not Eligable, exceeds loan maximum!"})
  const liabilityId = generateId()
  const cashflowId = generateId()
  const loan = [playerId, name, amount, liabilityId]
  amount*=1.1
  const expense = [cashflowId, playerId, "expense", name + " Payment", amount*0.1]
  const liability = [liabilityId, playerId, name, amount, cashflowId]

  try{
    db.query(`INSERT INTO loans (player_id, name, amount, liability_id) VALUES ?;INSERT INTO player_cashflow (id, player_id, type, name, value) VALUES ?; INSERT INTO player_liabilities (id, player_id, name, value, cashflow_id) VALUES ?; UPDATE players SET balance=balance+${amount} WHERE id="${playerId}"`, [[loan], [expense], [liability]],  err => {if(err) throw err;})
    res.status(200).send({ success: true });
  }catch(err){
    res.status(500).send({ error: error });
  }

});

app.post('/pay-off-liability/:id', authMiddleware, async (req, res) => {
  
  const id = req.params.id;
  const player_id = req.player.id; // replace with function to get current player
  
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT value, player_id, cashflow_id FROM player_liabilities WHERE id = '${id}'`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    if(results[0]){
      if(results[0].player_id == player_id){
        const value = results[0].value
        const cashflow_id = results[0].cashflow_id
        await db.query(`UPDATE players SET balance = balance - ${value} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
        await db.query(`DELETE FROM player_liabilities WHERE id = '${id}'`, (err) => {if(err) throw err});
        await db.query(`DELETE FROM player_cashflow WHERE id = '${cashflow_id}'`, (err) => {if(err) throw err});
        await db.query(`DELETE FROM loans WHERE liability_id = '${id}'`, (err) => {if(err) throw err});
        res.status(200).send({});
      }else res.status(403).send({ error: "Unauthorized!" });
    }else res.status(404).send({ error: "Liability Not Found!" })
  } catch (err) {
    res.status(500).send({ error: err })
  }

});

app.get('/get-stocks', authMiddleware, async (req, res) => {
  try {
    // Get all jobs from the jobs table
    const stocks = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM stocks',  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.status(200).send({ stocks: stocks });
  } catch (error) {
    console.error(error);
    res.status(500).send({error:'Internal Server Error'});
  }
});

app.get('/stock-history/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    // Get all jobs from the jobs table
    const stock_history = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM stock_history WHERE stock_id=${id}`,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.status(200).send({ history: stock_history });
  } catch (error) {
    console.error(error);
    res.status(500).send({error:'Internal Server Error'});
  }
});

app.get('/get-real-estate', authMiddleware, async (req, res) => {
  try {
    // Get all jobs from the jobs table
    const real_estate = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM real_estate',  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.status(200).send({ real_estate: real_estate });
  } catch (error) {
    console.error(error);
    res.status(500).send({error:'Internal Server Error'});
  }
});

app.get('/get-cars', authMiddleware, async (req, res) => {
  try {
    // Get all jobs from the jobs table
    const cars = await new Promise((resolve, reject) => {
      db.query(`SELECT c.id, cb.name AS brand_name, c.model, c.price
      FROM cars c
      INNER JOIN car_brands cb ON c.brand = cb.id;
      `,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.status(200).send({ cars: cars });
  } catch (error) {
    console.error(error);
    res.status(500).send({error:'Internal Server Error'});
  }
});

app.get('/get-motorcycles', authMiddleware, async (req, res) => {
  try {
    // Get all jobs from the jobs table
    const motorcycles = await new Promise((resolve, reject) => {
      db.query(`SELECT m.id, mb.name AS brand_name, m.model, m.price
      FROM motorcycles m
      INNER JOIN motorcycle_brands mb ON m.brand = mb.id;
      `,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.status(200).send({ motorcycles: motorcycles });
  } catch (error) {
    console.error(error);
    res.status(500).send({error:'Internal Server Error'});
  }
});


app.get('/get-player-vehicles', authMiddleware, async (req, res) => {
  try {
    // Get all jobs from the jobs table
    const cars = await new Promise((resolve, reject) => {
      db.query(`SELECT pc.id, cb.name AS brand_name, c.model, pc.value, c.id as car_id
      FROM player_cars pc
      INNER JOIN cars c ON pc.car_id = c.id
      INNER JOIN car_brands cb ON c.brand = cb.id
      WHERE pc.player_id = '${req.player.id}';
      
`,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const motorcycles = await new Promise((resolve, reject) => {
      db.query(`SELECT pm.id, mb.name AS brand_name, m.model, pm.value, m.id as motorcycle_id
      FROM player_motorcycles pm
      INNER JOIN motorcycles m ON pm.motorcycle_id = m.id
      INNER JOIN motorcycle_brands mb ON m.brand = mb.id
      WHERE pm.player_id = '${req.player.id}';
      
`,  (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.status(200).send({ cars: cars, motorcycles: motorcycles });
  } catch (error) {
    console.error(error);
    res.status(500).send({error:'Internal Server Error'});
  }
});

app.post('/buy/car', authMiddleware, async (req, res) => {
  const car_id = parseInt(req.body.vehicleId);
  const player_id = req.player.id; // replace with function to get current player
  
  try{
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM cars WHERE id = ${car_id}`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    if(!results[0]) return res.status(404).send({ error: "Selected Car Not Found!" })
    if(results[0].price > req.player.balance) return res.status(402).send({ error: "Not Enough Money!" })

    await db.query(`UPDATE players SET balance = balance - ${results[0].price} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
    await db.query('INSERT INTO player_cars (`player_id`, `car_id`, `value`) VALUES (?);', [[player_id, car_id, results[0].price * 0.80]], (err) => {if(err) throw err});
    res.status(200).send({});
  }catch (error) {
    console.error('Buy Car Error:', error);
    res.status(500).send({error:'Internal Server Error!'});
  }

});

app.post('/buy/motorcycle', authMiddleware, async (req, res) => {
  const motorcycle_id = parseInt(req.body.vehicleId);
  const player_id = req.player.id; // replace with function to get current player
  
  try{
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM motorcycles WHERE id = ${motorcycle_id}`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    if(!results[0]) return res.status(404).send({ error: "Selected Motorcycle Not Found!" })
    if(results[0].price > req.player.balance) return res.status(402).send({ error: "Not Enough Money!" })

    await db.query(`UPDATE players SET balance = balance - ${results[0].price} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
    await db.query('INSERT INTO player_motorcycles (`player_id`, `motorcycle_id`, `value`) VALUES (?);', [[player_id, motorcycle_id, results[0].price * 0.95]], (err) => {if(err) throw err});
    res.status(200).send({});
  }catch (error) {
    console.error('Buy Motorcycle Error:', error);
    res.status(500).send({error:'Internal Server Error!'});
  }

});

app.post('/sell/car/:id', authMiddleware, async (req, res) => {
  const car_id = req.params.id;
  console.log(car_id)
  const player_id = req.player.id; // replace with function to get current player
  
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM player_cars WHERE id = '${car_id}' AND player_id ='${player_id}';`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });



    if(!results[0]) return res.status(404).send({ error: "You Don't Own The Selected Car!" })

    await db.query(`UPDATE players SET balance = balance + ${results[0].value} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
    await db.query(`DELETE FROM player_cars WHERE id=${car_id};`, (err) => {if(err) throw err});
    res.status(200).send({});

  } catch (err) {
    console.log(err)
    res.status(500).send({ error: "Internal Server Error!" })
  }

});

app.post('/sell/motorcycle/:id', authMiddleware, async (req, res) => {
  const motorcycle_id = req.params.id;
  const player_id = req.player.id; // replace with function to get current player
  
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM player_motorcycles WHERE id = '${motorcycle_id}' AND player_id ='${player_id}';`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });



    if(!results[0]) return res.status(404).send({ error: "You Don't Own The Selected Motorcycle!" })

    await db.query(`UPDATE players SET balance = balance + ${results[0].value} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
    await db.query(`DELETE FROM player_motorcycles WHERE id=${motorcycle_id};`, (err) => {if(err) throw err});
    res.status(200).send({});

  } catch (err) {
    console.log(err)
    res.status(500).send({ error: "Internal Server Error!" })
  }

});

app.post('/buy/stock', authMiddleware, async (req, res) => {
  const stock_id = req.body.stockId;
  const amount = parseInt(req.body.amount)
  const player_id = req.player.id; // replace with function to get current player
  
  try {
    const results = await getStock(stock_id)
    if(results[0]){
      const value = results[0].price * amount
      if(value <= req.player.balance){
        const stock = [generateId('ST'), player_id, amount, stock_id, value]
        await db.query(`UPDATE players SET balance = balance - ${value} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
        await db.query("INSERT INTO player_stocks (id, `player_id`, `amount`, `stock_id`, `paid`) VALUES ? ON DUPLICATE KEY UPDATE `amount` = `amount` + VALUES(`amount`), paid = paid + VALUES(paid);", [[stock]], (err) => {if(err) throw err});
        res.status(200).send({});
      }else res.status(402).send({ error: "Not Enough Money!" });
    }else res.status(404).send({ error: "Stock Not Found!" })
  } catch (err) {
    console.log(err)
    res.status(500).send({ error: "Internal Server Error!" })
  }

});

app.post('/sell/stock', authMiddleware, async (req, res) => {
  const stock_id = req.body.stockId;
  const amount = parseInt(req.body.amount)
  const player_id = req.player.id; // replace with function to get current player
  
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM player_stocks WHERE stock_id = '${stock_id}' AND player_id ='${player_id}';`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });



    if(!results[0]) return res.status(404).send({ error: "You Don't Own The Selected Stock!" })
    if(results[0].amount < amount) return res.status(400).send({ error: "You Don't Own Enough Stock!" });

    var stocks = await getStock(stock_id)

    if(!stocks[0]) return res.status(404).send({ error: "Stock Not Found!" });

    const stock = stocks[0]
    console.log(stock)

    const value = stock.price * amount
    await db.query(`UPDATE players SET balance = balance + ${value} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
    await db.query(`UPDATE player_stocks SET amount = amount - ${amount} WHERE player_id = '${player_id}' AND stock_id = ${stock_id};DELETE FROM player_stocks WHERE amount=0;`, (err) => {if(err) throw err});
    res.status(200).send({});

  } catch (err) {
    console.log(err)
    res.status(500).send({ error: "Internal Server Error!" })
  }

});

app.post('/buy/real_estate', authMiddleware, async (req, res) => {
  const re_id = parseInt(req.body.reId);
  const player_id = req.player.id; // replace with function to get current player
  
  try{
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM real_estate WHERE id = ${re_id}`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    if(!results[0]) return res.status(404).send({ error: "Selected Real Estate Not Found!" })
    if(results[0].value > req.player.balance) return res.status(402).send({ error: "Not Enough Money!" })

    const cashflow_id = generateId()
    const re = [generateId(), player_id, re_id, cashflow_id]
    const cashflow = [cashflow_id, player_id, "income", results[0].name + " Income", results[0].cashflow]

    await db.query(`UPDATE players SET balance = balance - ${results[0].value} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
    await db.query('INSERT INTO player_real_estate (`id`, `player_id`, `real_estate_id`, cashflow_id) VALUES ?;INSERT INTO player_cashflow (id, player_id, type, name, value) VALUES ?;', [[re], [cashflow]], (err) => {if(err) throw err});
    res.status(200).send({});
  }catch (error) {
    console.error('Buy Real Estate Error:', error);
    res.status(500).send({error:'Internal Server Error!'});
  }

});


app.post('/sell/real_estate', authMiddleware, async (req, res) => {
  const real_estate_id = req.body.reId;
  const player_id = req.player.id; 
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM player_real_estate WHERE id = '${real_estate_id}' AND player_id ='${player_id}';`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });



    if(!results[0]) return res.status(404).send({ error: "You Don't Own The Selected Real Estate!" })

    const re = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM real_estate WHERE id = '${results[0].real_estate_id}';`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });


    if(!re[0]) return res.status(404).send({ error: "Real Estate Not Found!" });
    await db.query(`UPDATE players SET balance = balance + ${re[0].value} WHERE id = '${player_id}'`, (err) => {if(err) throw err});
    await db.query(`DELETE FROM player_real_estate WHERE id='${results[0].id}';`, (err) => {if(err) throw err});
    await db.query(`DELETE FROM player_cashflow WHERE id='${results[0].cashflow_id}';`, (err) => {if(err) throw err});
    res.status(200).send({});

  } catch (err) {
    console.log(err)
    res.status(500).send({ error: "Internal Server Error!" })
  }

});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send('Please provide username and password');
    }
    db.query('SELECT * FROM players WHERE username = ? AND password = ?', [username, password], (error, results) => {
      if (error) {
        throw error;
      }
      if (results.length === 0) {
        return res.status(401).send({error:'Invalid username or password'});
      }
      const player = results[0];
      const token = jwt.sign({ playerId: player.id }, JWT_SECRET, { expiresIn: '1y' });
      res.cookie('jwt', token, { httpOnly: true });
      res.status(200).send({msg:'Logged in successfully'});
    });
});

app.post('/signup', async (req, res) => {
    try {
      // Check if the username already exists
      const usernameExists = await new Promise((resolve, reject) => {
        const query = `SELECT id FROM players WHERE username = ?`;
        db.query(query, [req.body.username], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.length > 0);
          }
        });
      });
      if (usernameExists) {
        return res.status(400).send({error:'Username already exists'});
      }
  
      // Insert the user to the database
      await new Promise((resolve, reject) => {
        const query = `INSERT INTO players (id, username, password) VALUES (uuid(), ?, ?)`;
        db.query(query, [req.body.username, req.body.password], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      setUpNewPlayer(req.body.username);
  
      // Respond with success message
      res.status(200).send({msg:'User created'});
    } catch (error) {
      console.error('Sign up error:', error);
      res.status(500).send({error:'Server error!'});
    }
  });


  function setUpNewPlayer(username){
    const query = `SELECT id FROM players WHERE username = ?`;
    db.query(query, [username], (error, results) => {
      if (error) throw error;
      else {
        const playerId = results[0].id;
        const cashflows = [
          [generateId(), playerId, "expense", "Mortgage Payment", 350], 
          [generateId(), playerId, "expense", "Card Credit Payment", 40],
          [generateId(), playerId, "expense", "Car Payment", 35],
          [generateId(), playerId, "expense", "Retail Payment", 35],
          [generateId(), playerId, "expense", "Other Expenses", 200],
          [generateId(), playerId, "income", "Job Salary", 0]
        ]

        const liabilities = [
          [generateId(), playerId, "Mortgage", 75000, cashflows[0][0]], 
          [generateId(), playerId, "Card Credit Debt", 10000, cashflows[1][0]],
          [generateId(), playerId, "Car Loan", 35000, cashflows[2][0]],
          [generateId(), playerId, "Retail Debt", 2000, cashflows[3][0]]
        ]

        db.query(`INSERT INTO player_cashflow (id, player_id, type, name, value) VALUES ?; INSERT INTO player_liabilities (id, player_id, name, value, cashflow_id) VALUES ?;INSERT INTO player_time (player_id, time) VALUES ('${playerId}', 0)`, [cashflows, liabilities], (error, results) => {
          if (error) throw error;
        });


      }
    });
  }




app.get('*', function(req, res){
  res.status(404).sendFile(path.join(__dirname, "public", "static", "404.html"));
});

// Start server
app.listen(port, () => {
  console.log('Server started on port ' + port);
  
});



async function getStock(stock_id){
  return await new Promise((resolve, reject) => {
    db.query(`SELECT * FROM stocks WHERE id = ${stock_id}`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}


function generateId(start=''){
  const id = start + uuidv4()
  return id.slice(0,36)
}

async function updateStockPrice() {

  const stocks = await new Promise((resolve, reject) => {
    db.query(`SELECT * FROM stocks WHERE 1`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  })

  const stock = stocks[Math.floor(Math.random() * stocks.length)];

// Define stability thresholds and corresponding max price changes
const stabilityThresholds = [
  { stability: 25, maxPriceChange: 0.33 },
  { stability: 40, maxPriceChange: 0.20 },
  { stability: 60, maxPriceChange: 0.15 },
  { stability: 80, maxPriceChange: 0.10 },
  { stability: 100, maxPriceChange: 0.05 }
];

// Find the maxPriceChange corresponding to the current stability
var currentMaxPriceChange = stabilityThresholds.find(
  threshold => stock.stability < threshold.stability
).maxPriceChange;

console.log(currentMaxPriceChange, stock.stability)

// Determine whether price should go up or down
const priceChangeDirection = Math.random() >= 0.415 ? 1 : -1;

// Calculate a volatility factor based on the stability
const volatilityFactor = (100 - stock.stability) / 100;

if(priceChangeDirection < 0) currentMaxPriceChange+0.05

// Calculate the actual price change by multiplying the modifiedMaxPriceChange by the volatilityFactor
const actualPriceChange = currentMaxPriceChange * volatilityFactor * stock.price;

const newPrice = stock.price + priceChangeDirection * actualPriceChange;



const randomInterval = Math.floor(Math.random() * (maxStockInterval - minStockInterval + 1)) + minStockInterval;
  setTimeout(() => {
    updateStockPrice()
  }, randomInterval);
  
  setStockPrice(stock, newPrice);



}

function setStockPrice(stock, price){
  console.log(`Stock Update: ${stock.id}, ${price}$`)
  db.query(`INSERT INTO stock_history (stock_id, old_price, new_price) VALUES (${stock.id}, ${stock.price}, ${price}); UPDATE stocks SET price=${price} WHERE id=${stock.id}`, err => {if(err) console.log(err)})
}

