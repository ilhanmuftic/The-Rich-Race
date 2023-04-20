// Get all jobs from the server
fetch('/get-educations')
  .then(response => response.json())
  .then(data => {
    const edus = data.educations.filter(edu => edu.id>player.education_id-1)
    const active = data.active[0]

    console.log(data)

    if(active){
      edus.filter(e => e.id == active.education_id)[0].completion_time -= player.experience- active.start_time
      edus.filter(e => e.id == active.education_id)[0].active = true
    }

    const eduList = document.getElementById('education-list');
    edus.forEach(edu => {
    edu = stringToHTML(`
    <li class="job ${player.education_id >= edu.id ? 'selected' : ''} ${ edu.active ? 'yellow' : ''}" id="${edu.id}">
      <h2 class="job-title">${edu.name}</h2>
      ${ edu.active && player.education_id >= edu.id ? '' : `<p class="job-salary">Cost: ${edu.cost}$</p><p class="job-experience">Experience Required: ${edu.experience_required}</p>`}
      
      ${edu.id>0 && !edu.active && player.education_id < edu.id ? 
      `<p class="job-education">Education Required: ${edus.filter(e => e.id == edu.id-1)[0].name}</p>` : '' }
      <p class="job-education">Time To Complete: ${edu.completion_time}</p>
      ${player.experience >= edu.experience_required && player.education_id == edu.id-1 && !edu.active ? 
        `<button class="job-select-btn" onclick="enroll('${edu.id}')">Enroll</button>` : ''}
    </li>
  `)


    eduList.appendChild(edu);
    });

  });


// Select the given job and update the UI
function enroll(eduId) {
    fetch(`/edu_select/${eduId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eduId: eduId
      })
    })
    .then(response => response.json())
    .then(data => {
      // handle response from server
      if (data.error) alert(data.error);
      else location.reload();
    
    })
    .catch(error => {
      alert('Error selecting education:', error);
    });
  }