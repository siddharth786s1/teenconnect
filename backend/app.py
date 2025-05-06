import os
import random  # Moved import random to the top
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate
from dotenv import load_dotenv
from datetime import datetime, timedelta  # Added timedelta
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity  # Added JWT imports
from flask_cors import CORS  # Import CORS

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})  # Enable CORS for /api routes from frontend origin
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_super_secret_key_here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///teenconnect.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'bb9763511a46cb9a39609fce23d818dd5f0aadba88a1ee38b040b4b190032a0a')  # Added JWT Secret Key
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)  # Example: token expires in 1 hour

db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)
jwt = JWTManager(app)  # Initialize JWTManager

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))  # Increased length for potentially longer hashes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class WellnessData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    stress_level = db.Column(db.Integer, nullable=False)  # Scale 1-10
    mood = db.Column(db.String(50), nullable=False)  # e.g., happy, sad, anxious, calm
    sleep_quality = db.Column(db.String(50), nullable=False)  # e.g., good, average, poor
    heart_rate = db.Column(db.Integer, nullable=True)  # Optional

    user = db.relationship('User', backref=db.backref('wellness_data', lazy=True))

def ensure_dev_user(flask_app_instance):
    with flask_app_instance.app_context():
        dev_username = "devuser"
        dev_user_email = "dev@example.com"
        dev_password = "devpassword"

        # Check if user with this email already exists
        user_by_email = User.query.filter_by(email=dev_user_email).first()
        if user_by_email:
            print(f"User with email '{dev_user_email}' (username: '{user_by_email.username}') already exists. Skipping dev user creation.")
            # You could uncomment the lines below to reset the password for an existing dev user
            # print(f"Attempting to reset password for existing dev user '{user_by_email.username}' to '{dev_password}'.")
            # user_by_email.set_password(dev_password)
            # try:
            #     db.session.commit()
            #     print(f"Password for existing dev user '{user_by_email.username}' has been reset.")
            # except Exception as e:
            #     db.session.rollback()
            #     print(f"Error resetting password for dev user '{user_by_email.username}': {e}")
            return

        # Check if user with this username already exists (in case email is different but username is taken)
        user_by_username = User.query.filter_by(username=dev_username).first()
        if user_by_username:
            print(f"User with username '{dev_username}' (email: '{user_by_username.email}') already exists. Cannot create new dev user with this username. Skipping dev user creation.")
            return

        print(f"Creating development user: Username='{dev_username}', Email='{dev_user_email}'")
        new_user = User(username=dev_username, email=dev_user_email)
        new_user.set_password(dev_password)
        db.session.add(new_user)
        try:
            db.session.commit()
            print(f"Development user '{dev_username}' created successfully with password '{dev_password}'.")
            print("You can now log in using the identifier '{dev_username}' or '{dev_user_email}' and password '{dev_password}'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating development user '{dev_username}': {e}")
            print("Please ensure your database is initialized and migrated correctly (e.g., run 'flask db upgrade' in the backend directory).")

# Call the function to ensure the dev user exists.
# This is placed here so 'app', 'db', and 'User' class are defined.
# ensure_dev_user(app) # Temporarily commented out to allow migrations to run first

# --- Authentication API Endpoints ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Missing username, email, or password'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('identifier')  # Can be username or email
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'message': 'Missing identifier or password'}), 400

    user_by_email = User.query.filter_by(email=identifier).first()
    user_by_username = User.query.filter_by(username=identifier).first()
    user = user_by_email or user_by_username

    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token, user_id=user.id, username=user.username), 200  # Return token and basic user info
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
@jwt_required()  # Optional: if you want to protect logout, though often client just clears token
def logout_api():
    # For JWT, logout is typically handled client-side by deleting the token.
    # If you need server-side blacklisting, it's more complex.
    # For this MVP, we'll assume client-side handling.
    return jsonify({'message': 'Logout successful (token should be cleared client-side)'}), 200

@app.route('/api/user/me', methods=['GET'])
@jwt_required()
def get_current_user_info():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user:
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat()
        }), 200
    return jsonify({'message': 'User not found'}), 404

# --- Wellness Data API Endpoints ---
@app.route('/api/wellness-data', methods=['POST'])
@jwt_required()
def add_wellness_data():
    data = request.get_json()
    stress_level = data.get('stress_level')
    mood = data.get('mood')
    sleep_quality = data.get('sleep_quality')
    heart_rate = data.get('heart_rate')  # Optional

    if stress_level is None or not mood or not sleep_quality:
        return jsonify({'message': 'Missing required wellness data (stress_level, mood, sleep_quality)'}), 400

    try:
        stress_level = int(stress_level)
        if not (1 <= stress_level <= 10):
            raise ValueError("Stress level must be between 1 and 10.")
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    
    if heart_rate is not None:
        try:
            heart_rate = int(heart_rate)
        except ValueError:
            return jsonify({'message': "Heart rate must be an integer."}), 400

    new_data = WellnessData(
        user_id=get_jwt_identity(),
        stress_level=stress_level,
        mood=mood,
        sleep_quality=sleep_quality,
        heart_rate=heart_rate
    )
    db.session.add(new_data)
    db.session.commit()
    return jsonify({'message': 'Wellness data added successfully'}), 201

@app.route('/api/wellness-data', methods=['GET'])
@jwt_required()
def get_wellness_data():
    user_wellness_data = WellnessData.query.filter_by(user_id=get_jwt_identity()).order_by(WellnessData.date.desc()).all()
    
    data_list = []
    for item in user_wellness_data:
        data_list.append({
            'date': item.date.isoformat(),
            'stress_level': item.stress_level,
            'mood': item.mood,
            'sleep_quality': item.sleep_quality,
            'heart_rate': item.heart_rate
        })
    return jsonify(data_list), 200

# --- Basic Stress Detection ---
def detect_stress(user_id):
    # Get the most recent wellness data for the user
    latest_data = WellnessData.query.filter_by(user_id=user_id).order_by(WellnessData.date.desc()).first()

    if not latest_data:
        return "Not enough data"

    stress_level = "Low"  # Default
    
    # Example rule: High stress + poor sleep = potential high stress state
    if latest_data.stress_level >= 7 and latest_data.sleep_quality == 'poor':
        stress_level = "Potentially High"
    elif latest_data.stress_level >= 7:
        stress_level = "Moderate"  # If only stress is high
    elif latest_data.stress_level >= 4:
        stress_level = "Moderate"
    
    return stress_level

@app.route('/api/stress-level', methods=['GET'])
@jwt_required()
def get_stress_level():
    detected_stress = detect_stress(get_jwt_identity())
    return jsonify({'detected_stress': detected_stress}), 200

# --- Chatbot (ConnectBot) ---
# For MVP, chat history is not stored.
# Basic rule-based responses.

# Pre-defined crisis information
CRISIS_HOTLINES = [
    {"name": "National Suicide Prevention Lifeline", "number": "988", "url": "https://988lifeline.org/"},
    {"name": "Crisis Text Line", "text": "Text HOME to 741741", "url": "https://www.crisistextline.org/"},
    {"name": "The Trevor Project (for LGBTQ youth)", "number": "1-866-488-7386", "url": "https://www.thetrevorproject.org/"}
]

RELAXATION_TECHNIQUES = {
    "breathing_exercise": {
        "title": "Simple Breathing Exercise",
        "steps": [
            "Find a comfortable position, sitting or lying down.",
            "Close your eyes gently if you feel comfortable doing so.",
            "Inhale slowly and deeply through your nose, feeling your abdomen expand. Count to 4 as you inhale.",
            "Hold your breath for a count of 4.",
            "Exhale slowly and completely through your mouth, feeling your abdomen contract. Count to 6 as you exhale.",
            "Repeat this cycle for a few minutes, focusing on your breath."
        ],
        "offer_more": "Would you like another relaxation tip?"
    },
    "grounding_technique": {
        "title": "5-4-3-2-1 Grounding Technique",
        "steps": [
            "Acknowledge 5 things you see around you.",
            "Acknowledge 4 things you can touch around you.",
            "Acknowledge 3 things you can hear.",
            "Acknowledge 2 things you can smell.",
            "Acknowledge 1 thing you can taste."
        ],
        "offer_more": "Would you like another relaxation tip?"
    }
}

CHATBOT_RESPONSES = {
    "greetings": ["Hello! How are you feeling today?", "Hi there! What's on your mind?", "Hey! I'm here to listen. How's it going?"],
    "farewell": ["Goodbye! Take care.", "Talk to you later!", "Stay strong!"],
    "positive_mood": ["That's great to hear!", "Glad you're feeling good.", "Awesome!"],
    "default_fallback": ["I'm here to listen. Could you tell me a bit more about how you're feeling?", "I'm not sure I understand completely. Can you rephrase that?", "Tell me more."],
    "stress_keywords": ["stressed", "overwhelmed", "pressure", "anxious", "worried"],
    "sadness_keywords": ["sad", "down", "lonely", "empty", "crying"],
    "anxiety_keywords": ["anxious", "nervous", "panic", "scared", "worry"],
    "help_keywords": ["help", "support"],
    "relaxation_keywords": ["relax", "calm", "breathing", "grounding"],
    "crisis_keywords": ["kill myself", "want to die", "suicide", "hopeless and want to end it", "self-harm", "no reason to live"],  # Simplified for MVP
    "supportive_messages": {
        "stress": "It sounds like you're dealing with a lot of stress. Remember to be kind to yourself. Sometimes just acknowledging the stress is a first step. Would you like a tip to help you relax?",
        "sadness": "I'm sorry to hear you're feeling sad. It's okay to feel this way. Talking about it can sometimes help. I'm here to listen. Would you like a simple relaxation exercise?",
        "anxiety": "Feeling anxious can be really tough. You're not alone in this. Deep breaths can sometimes help manage anxiety. Would you like to try a breathing exercise?"
    }
}

def get_chatbot_response(user_message):
    user_message_lower = user_message.lower()

    # Crisis detection - CRITICAL
    for keyword in CHATBOT_RESPONSES["crisis_keywords"]:
        if keyword in user_message_lower:
            response_text = "It sounds like you are going through a very difficult time. Please know that there's support available and you don't have to carry this alone. I strongly encourage you to reach out to a trusted adult, a mental health professional, or use one of these crisis hotlines immediately:"
            hotlines_info = "\n".join([f"- {h['name']}: {h.get('number', '')} {h.get('text', '')} ({h['url']})" for h in CRISIS_HOTLINES])
            return {"response": f"{response_text}\n{hotlines_info}\n\nRemember, your safety is most important. This app is a supportive tool, but not a replacement for professional help.", "action": "crisis_intervention"}

    if any(keyword in user_message_lower for keyword in CHATBOT_RESPONSES["greetings"] + ["hi", "hello", "hey"]):
        return {"response": random.choice(CHATBOT_RESPONSES["greetings"]), "action": "greet"}

    if any(keyword in user_message_lower for keyword in CHATBOT_RESPONSES["farewell"] + ["bye", "goodbye"]):
        return {"response": random.choice(CHATBOT_RESPONSES["farewell"]), "action": "farewell"}

    if "yes" in user_message_lower and "breathing exercise guide" in user_message_lower:  # Specific follow-up
         return {"response": RELAXATION_TECHNIQUES["breathing_exercise"]["title"] + "\n" + "\n".join(RELAXATION_TECHNIQUES["breathing_exercise"]["steps"]) + "\n" + RELAXATION_TECHNIQUES["breathing_exercise"]["offer_more"], "action": "technique_provided"}

    if any(keyword in user_message_lower for keyword in CHATBOT_RESPONSES["relaxation_keywords"]):
        # Offer a random technique
        technique_key = random.choice(list(RELAXATION_TECHNIQUES.keys()))
        technique = RELAXATION_TECHNIQUES[technique_key]
        return {"response": f"Sure, here's a {technique['title']}:\n" + "\n".join(technique['steps']) + "\n" + technique['offer_more'], "action": "technique_provided"}

    for keyword_type, keywords in [("stress", CHATBOT_RESPONSES["stress_keywords"]),
                                   ("sadness", CHATBOT_RESPONSES["sadness_keywords"]),
                                   ("anxiety", CHATBOT_RESPONSES["anxiety_keywords"])]:
        if any(keyword in user_message_lower for keyword in keywords):
            return {"response": CHATBOT_RESPONSES["supportive_messages"][keyword_type], "action": f"support_{keyword_type}"}
    
    if any(keyword in user_message_lower for keyword in CHATBOT_RESPONSES["help_keywords"]):
        return {"response": "I can offer some simple relaxation techniques or point you to resources. What kind of support are you looking for?", "action": "offer_help"}

    # Basic small talk examples
    if "how are you" in user_message_lower:
        return {"response": "I'm a bot, so I don't have feelings, but I'm here to help you! How are you doing?", "action": "small_talk"}
    if "your name" in user_message_lower:
        return {"response": "You can call me ConnectBot. What's on your mind today?", "action": "small_talk"}

    return {"response": random.choice(CHATBOT_RESPONSES["default_fallback"]), "action": "default"}

@app.route('/api/chatbot', methods=['POST'])
@jwt_required()
def chatbot():
    data = request.get_json()
    user_message = data.get('message', '')
    if not user_message:
        return jsonify({'message': 'No message provided'}), 400

    response = get_chatbot_response(user_message)
    return jsonify(response), 200
