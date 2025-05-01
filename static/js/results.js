document.addEventListener('DOMContentLoaded', () => {
    // Load results from session storage or direct data
    const results = interviewResults || JSON.parse(sessionStorage.getItem('interviewResults'));
    
    if (!results) {
        alert('No interview results found');
        window.location.href = '/';
        return;
    }

    // Display results
    document.getElementById('resultPosition').textContent = results.position || 'N/A';
    document.getElementById('overallScore').textContent = results.overall_score || 0;
    document.getElementById('recommendation').textContent = results.recommendation || 'No recommendation available';
    
    // Display strengths
    const strengthsList = document.getElementById('strengthsList');
    if (results.key_strengths && results.key_strengths.length > 0) {
        results.key_strengths.forEach(strength => {
            const li = document.createElement('li');
            li.textContent = strength;
            strengthsList.appendChild(li);
        });
    } else {
        strengthsList.innerHTML = '<li>No strengths identified</li>';
    }
    
    // Display improvements
    const improvementsList = document.getElementById('improvementsList');
    if (results.areas_for_improvement && results.areas_for_improvement.length > 0) {
        results.areas_for_improvement.forEach(area => {
            const li = document.createElement('li');
            li.textContent = area;
            improvementsList.appendChild(li);
        });
    } else {
        improvementsList.innerHTML = '<li>No areas for improvement identified</li>';
    }
    
    // Display skills to develop
    const skillsList = document.getElementById('skillsList');
    if (results.suggested_skills_to_develop && results.suggested_skills_to_develop.length > 0) {
        results.suggested_skills_to_develop.forEach(skill => {
            const li = document.createElement('li');
            li.textContent = skill;
            skillsList.appendChild(li);
        });
    } else {
        skillsList.innerHTML = '<li>No specific skills recommended</li>';
    }
    
    // Display detailed responses
    const responsesContainer = document.getElementById('responsesContainer');
    if (results.responses && results.responses.length > 0) {
        results.responses.forEach((response, index) => {
            const responseDiv = document.createElement('div');
            responseDiv.className = 'response-item';
            responseDiv.innerHTML = `
                <h4>Question ${index + 1}: ${response.question}</h4>
                <p><strong>Your Answer:</strong> ${response.answer || 'No answer recorded'}</p>
                <div class="feedback">
                    <p><strong>Relevance:</strong> ${response.analysis?.relevance?.score || 'N/A'}/5 - ${response.analysis?.relevance?.explanation || 'No feedback'}</p>
                    <p><strong>Clarity:</strong> ${response.analysis?.clarity?.score || 'N/A'}/5 - ${response.analysis?.clarity?.explanation || 'No feedback'}</p>
                    <p><strong>Suggestions:</strong> ${response.analysis?.suggestions || 'No suggestions'}</p>
                </div>
            `;
            responsesContainer.appendChild(responseDiv);
        });
    } else {
        responsesContainer.innerHTML = '<p>No detailed responses available</p>';
    }
    
    // Button actions
    document.getElementById('downloadBtn').addEventListener('click', () => {
        alert('In a production app, this would generate a PDF report');
        // Implement PDF generation or download
    });
    
    document.getElementById('newInterviewBtn').addEventListener('click', () => {
        sessionStorage.removeItem('interviewResults');
        window.location.href = '/';
    });
});