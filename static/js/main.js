document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('interviewForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
        
        try {
            const response = await fetch('/start_interview', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Redirect to interview page with session data
                window.location.href = `/interview?session=${data.session_id}`;
            } else {
                alert('Error starting interview: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Network error: ' + error.message);
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Interview';
        }
    });
});
