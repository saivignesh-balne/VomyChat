class InterviewSession {
    constructor(data) {
        this.sessionId = data.sessionId;
        this.position = data.position;
        this.interviewer = data.interviewer;
        this.questions = data.questions;
        this.currentQuestionIndex = 0;
        this.responses = [];
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    async start() {
        this.updateUI();
        await this.askQuestion();
    }

    async askQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        document.getElementById('currentQuestion').textContent = question;
        document.getElementById('questionCount').textContent = this.currentQuestionIndex + 1;
        
        try {
            const response = await fetch('/ask_question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: question,
                    voice: this.interviewer.voice
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch question audio');
            }

            const data = await response.json();
            if (data.audio_path) {
                const audioPlayer = document.getElementById('questionAudio');
                audioPlayer.src = data.audio_path;
                audioPlayer.play();
            }
        } catch (error) {
            console.error('Error asking question:', error);
            alert('An error occurred while fetching the question audio. Please try again.');
        }
    }

    async processResponse(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'response.wav');
        formData.append('question', this.questions[this.currentQuestionIndex]);
        formData.append('session_id', this.sessionId);
        
        try {
            const response = await fetch('/process_response', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process response');
            }

            const data = await response.json();
            if (data.status === 'success') {
                this.responses.push({
                    question: this.questions[this.currentQuestionIndex],
                    answer: data.transcription,
                    analysis: data.analysis
                });
                
                this.displayAnalysis(data.analysis);
                document.getElementById('nextBtn').disabled = false;
            }
        } catch (error) {
            console.error('Error processing response:', error);
            alert('An error occurred while processing your response. Please try again.');
        }
    }

    displayAnalysis(analysis) {
        const analysisContainer = document.getElementById('analysisContent');
        analysisContainer.innerHTML = `
            <p><strong>Relevance:</strong> ${analysis.relevance.score}/5 - ${analysis.relevance.explanation}</p>
            <p><strong>Clarity:</strong> ${analysis.clarity.score}/5 - ${analysis.clarity.explanation}</p>
            <p><strong>Suggestions:</strong> ${analysis.suggestions}</p>
        `;
        document.getElementById('responseAnalysis').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('positionDisplay').textContent = this.position;
        document.getElementById('interviewerName').textContent = this.interviewer.style;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        
        const avatar = document.getElementById('interviewerAvatar');
        avatar.textContent = this.interviewer.voice.charAt(0).toUpperCase();
        avatar.style.backgroundColor = this.getAvatarColor();
    }

    getAvatarColor() {
        const colors = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#f72585'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialize interview when page loads
document.addEventListener('DOMContentLoaded', () => {
    const interview = new InterviewSession(interviewData);
    interview.start();
    
    // Set up recording
    const recordBtn = document.getElementById('recordBtn');
    let mediaRecorder;
    let audioChunks = [];
    
    recordBtn.addEventListener('mousedown', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            
            mediaRecorder.start();
            document.getElementById('recordingStatus').textContent = "Recording...";
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Unable to access your microphone. Please check your permissions.');
        }
    });
    
    recordBtn.addEventListener('mouseup', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            document.getElementById('recordingStatus').textContent = "Processing...";
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await interview.processResponse(audioBlob);
                
                // Stop all tracks
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            };
        }
    });
    
    // Navigation
    document.getElementById('nextBtn').addEventListener('click', () => {
        interview.currentQuestionIndex++;
        if (interview.currentQuestionIndex < interview.questions.length) {
            document.getElementById('nextBtn').disabled = true;
            document.getElementById('responseAnalysis').classList.add('hidden');
            interview.askQuestion();
        } else {
            completeInterview(interview);
        }
    });
    
    document.getElementById('completeBtn').addEventListener('click', () => {
        completeInterview(interview);
    });
});

async function completeInterview(interview) {
    try {
        const response = await fetch('/complete_interview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                responses: interview.responses
            })
        });

        if (!response.ok) {
            throw new Error('Failed to complete interview');
        }

        const data = await response.json();
        if (data.status === 'success') {
            sessionStorage.setItem('interviewResults', JSON.stringify(data.summary));
            window.location.href = '/results';
        }
    } catch (error) {
        console.error('Error completing interview:', error);
        alert('An error occurred while completing the interview. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const answerInput = document.getElementById('answerInput');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMsg');
    
    submitBtn.addEventListener('click', async () => {
        const answer = answerInput.value.trim();
        
        if (!answer) {
            showError("Please enter your answer");
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        errorMsg.textContent = "";
        
        try {
            const response = await fetch('/save_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answer: answer
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'complete') {
                window.location.href = '/results';
            } else if (data.status === 'success') {
                window.location.reload(); // Load next question
            } else {
                throw new Error(data.error || 'Submission failed');
            }
        } catch (error) {
            showError(error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Answer";
        }
    });
    
    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 5000);
    }
});