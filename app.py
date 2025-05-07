import os
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import json

# Initialize Flask App
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your_super_secret_key_12345' 
project_dir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(project_dir, 'instance')
if not os.path.exists(instance_path):
    os.makedirs(instance_path)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(instance_path, 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(days=7)

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# --- Database Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

# --- Load OSINT Framework Data from JSON ---
def load_osint_data():
    json_file_path = os.path.join(project_dir, 'arf.json') 
    if not os.path.exists(json_file_path):
        app.logger.error(f"CRITICAL: arf.json not found at {json_file_path}")
        return {"name": "Error", "type": "folder", "children": [{"name": "arf.json not found", "type": "item"}]}
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        app.logger.error(f"Error loading or parsing arf.json: {e}")
        return {"name": "Error", "type": "folder", "children": [{"name": f"Error loading arf.json: {e}", "type": "item"}]}

osint_framework_data = load_osint_data()

# Icon mapping for top-level categories
category_icon_map = {
    "Username": "fa-user-secret",
    "Email Address": "fa-envelope-open-text",
    "Domain Name": "fa-network-wired",
    "IP & MAC Address": "fa-laptop-code",
    "Images / Videos / Docs": "fa-photo-video",
    "Social Networks": "fa-users-cog",
    "Instant Messaging": "fa-comments",
    "People Search Engines": "fa-address-book",
    "Dating": "fa-heart",
    "Telephone Numbers": "fa-phone-square-alt",
    "Public Records": "fa-landmark",
    "Business Records": "fa-building",
    "Transportation": "fa-car-side",
    "Geolocation Tools / Maps": "fa-map-marked-alt",
    "Search Engines": "fa-search-plus",
    "Forums / Blogs / IRC": "fa-rss-square",
    "Archives": "fa-archive",
    "Language Translation": "fa-language",
    "Metadata": "fa-cogs",
    "Mobile Emulation": "fa-mobile-alt",
    "Terrorism": "fa-biohazard",
    "Dark Web": "fa-user-ninja",
    "Digital Currency": "fa-coins", # Using fa-coins as a generic one from free set
    "Classifieds": "fa-bullhorn",
    "Encoding / Decoding": "fa-terminal",
    "Tools": "fa-tools",
    "AI Tools": "fa-brain",
    "Malicious File Analysis": "fa-file-medical-alt",
    "Exploits & Advisories": "fa-shield-virus",
    "Threat Intelligence": "fa-chart-line",
    "OpSec": "fa-user-shield",
    "Documentation / Evidence Capture": "fa-camera-retro",
    "Training": "fa-graduation-cap"
}

# --- Routes ---
@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login_register'))

@app.route('/login_register')
def login_register():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login_register.html', title="Login or Register")

@app.route('/register_process', methods=['POST'])
def register_process():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        if not username or not email or not password:
            flash('All fields are required for registration.', 'danger')
            return redirect(url_for('login_register', _anchor='register'))

        existing_user_by_username = User.query.filter_by(username=username).first()
        if existing_user_by_username:
            flash('Username already exists. Please choose a different one.', 'warning')
            return redirect(url_for('login_register', _anchor='register'))

        existing_user_by_email = User.query.filter_by(email=email).first()
        if existing_user_by_email:
            flash('Email address already registered. Please use a different one or login.', 'warning')
            return redirect(url_for('login_register', _anchor='register'))

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login_register'))
        except Exception as e:
            db.session.rollback()
            flash(f'An error occurred during registration: {str(e)}', 'danger')
            app.logger.error(f"Registration error: {e}")
            return redirect(url_for('login_register', _anchor='register'))
            
    return redirect(url_for('login_register'))


@app.route('/login_process', methods=['POST'])
def login_process():
    if request.method == 'POST':
        username_form = request.form.get('username')
        password = request.form.get('password')

        if not username_form or not password:
            flash('Username and password are required.', 'danger')
            return redirect(url_for('login_register'))

        user = User.query.filter_by(username=username_form).first()

        if user and user.check_password(password):
            session.permanent = True
            session['user_id'] = user.id
            session['username'] = user.username 
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'danger')
            return redirect(url_for('login_register'))
            
    return redirect(url_for('login_register'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Please log in to access the dashboard.', 'info')
        return redirect(url_for('login_register'))
    
    session_username = session.get('username', 'User') 
    
    sidebar_categories = []
    if osint_framework_data and 'children' in osint_framework_data:
        for child in osint_framework_data['children']:
            category_name = child.get("name", "Unknown Category")
            sidebar_categories.append({
                "name": category_name,
                "icon": category_icon_map.get(category_name, "fa-folder-open"), # Use mapped icon or default
                "data_id": category_name.lower().replace(" ", "-").replace("/", "-") # Sanitize for data-id
            })
    
    default_active_category_name = "Domain Name" 
    if not any(cat['name'] == default_active_category_name for cat in sidebar_categories) and sidebar_categories:
        default_active_category_name = sidebar_categories[0]['name']


    return render_template('index.html', 
                           title="OSINT Framework Dashboard", 
                           username=session_username, 
                           sidebar_categories=sidebar_categories,
                           default_active_category_name=default_active_category_name,
                           osint_data_json=json.dumps(osint_framework_data) 
                          )

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('login_register'))

def create_tables():
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    if osint_framework_data.get("name") == "Error":
        print(f"Failed to load OSINT data: {osint_framework_data['children'][0]['name']}")
    
    create_tables()
    app.run(debug=True)
