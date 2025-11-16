from flask import Flask, request, jsonify
from emotion_report_generator import EmotionReportGenerator

app = Flask(__name__)

# Initialize the EmotionReportGenerator
report_generator = EmotionReportGenerator()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    # Process chat data here
    response = {'message': 'Chat response based on input.'}
    return jsonify(response)

@app.route('/question', methods=['POST'])
def question():
    data = request.json
    # Process question data here
    response = {'message': 'Question response based on input.'}
    return jsonify(response)

@app.route('/generate_report', methods=['POST'])
def generate_report():
    analysis_report = report_generator.analyze_responses()
    summary = report_generator.summarize_report(analysis_report)
    return jsonify(summary)

if __name__ == '__main__':
    app.run(debug=True) 