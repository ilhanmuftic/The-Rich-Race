// Get all jobs from the server
fetch('/get-jobs')
  .then(response => response.json())
  .then(data => {
    const jobs = data.jobs


    const jobList = document.getElementById('job-list');
    jobs.forEach(job => {
    job = stringToHTML(`
    <li class="job ${player.job_id === job.id ? 'selected' : ''}" id="${job.id}">
      <h2 class="job-title">${job.title}</h2>
      <p class="job-salary">Salary: ${job.salary}$</p>
      <p class="job-education">Education Required: ${job.education_name}</p>
      <p class="job-experience">Experience Required: ${job.experience_required}</p>
      ${player.experience >= job.experience_required && player.education_id >= job.education_required && player.job_id != job.id ? 
        `<button class="job-select-btn" onclick="selectJob('${job.id}')">Select</button>` : ''}
    </li>
  `)


      jobList.appendChild(job);
    });

  });


// Select the given job and update the UI
function selectJob(jobId) {
    fetch(`/job_select/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId: jobId
      })
    })
    .then(response => response.json())
    .then(data => {
      // handle response from server
      if (data.error) alert(data.error);
      else location.reload();
    
    })
    .catch(error => {
      alert('Error selecting job:', error);
    });
  }