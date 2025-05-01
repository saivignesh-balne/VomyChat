import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'txt'}

# Interview Questions
QUESTIONS_DB = {
    "Software Engineer": [
        "Explain your experience with programming.",
        "Describe a challenging project.",
        "How do you approach problem-solving?"
    ],
    "Data Scientist": [
        "Explain machine learning concepts.",
        "How do you clean datasets?",
        "Describe your experience with Python."
    ]
}

INTERVIEWER_PROFILES = {
    "default": {"name": "AI Interviewer"},
    "technical": {"name": "Technical Evaluator"},
    "friendly": {"name": "Friendly HR"}
}

@app.route('/')
def home():
    return render_template('index.html',
                           positions=list(QUESTIONS_DB.keys()),
                           interviewers=INTERVIEWER_PROFILES)

@app.route('/start_interview', methods=['POST'])
def start_interview():
    position = request.form['position']
    interviewer = request.form.get('interviewer', 'default')
    
    session['interview'] = {
        'position': position,
        'interviewer': INTERVIEWER_PROFILES[interviewer],
        'questions': QUESTIONS_DB[position],
        'current_question': 0,
        'responses': [],
        'start_time': datetime.now().isoformat()
    }
    
    return redirect(url_for('interview'))

@app.route('/interview')
def interview():
    if 'interview' not in session:
        return redirect(url_for('home'))
    
    return render_template('interview.html',
                           position=session['interview']['position'],
                           interviewer=session['interview']['interviewer'],
                           questions=session['interview']['questions'],
                           current_q=session['interview']['current_question'])

@app.route('/save_answer', methods=['POST'])
def save_answer():
    if 'interview' not in session:
        return jsonify({"error": "Session expired"}), 401
    
    data = request.get_json()
    answer = data.get('answer', '').strip()
    
    if not answer:
        return jsonify({"error": "Answer cannot be empty"}), 400
    
    current_q = session['interview']['current_question']
    question = session['interview']['questions'][current_q]
    
    # Simple analysis
    analysis = {
        "score": min(5, max(1, len(answer) // 50 + 3)),
        "feedback": "Good answer" if len(answer) > 50 else "Could be more detailed"
    }
    
    session['interview']['responses'].append({
        "question": question,
        "answer": answer,
        "analysis": analysis
    })
    
    session['interview']['current_question'] += 1
    session.modified = True
    
    if session['interview']['current_question'] >= len(session['interview']['questions']):
        return jsonify({"status": "complete"})
    
    return jsonify({"status": "success"})

@app.route('/results')
def results():
    if 'interview' not in session or not session['interview']['responses']:
        return redirect(url_for('home'))
    
    scores = [r['analysis']['score'] for r in session['interview']['responses']]
    overall_score = sum(scores) / len(scores) if scores else 0
    
    return render_template('results.html',
                           results=session['interview']['responses'],
                           overall_score=round(overall_score, 1),
                           position=session['interview']['position'])

@app.route('/restart')
def restart():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)
