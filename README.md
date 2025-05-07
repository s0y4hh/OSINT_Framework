# OSINT Framework Web Application

## Overview

This web application provides an interactive framework for Open Source Intelligence (OSINT) gathering. It features a user authentication system (login/registration) and a dynamic dashboard where users can explore various OSINT categories and tools. The main interface presents OSINT categories from a sidebar, which, when clicked, build out an interactive mind-map-like tree structure in the main content area. The application also includes a search functionality to find tools and categories within the framework.

Built with Python (Flask) for the backend, HTML, CSS, and JavaScript for the frontend. User accounts and data are stored in an SQLite database.

## Features

* User registration and login system.
* Password hashing for security.
* Session management.
* Dynamic dashboard with a sidebar for top-level OSINT categories.
* Interactive mind-map/tree visualization of OSINT tools and sub-categories in the main content area.
* Client-side search functionality for OSINT data.
* Light/Dark theme toggle.
* Responsive design for various screen sizes.
* Data for the OSINT framework is loaded from an external `arf.json` file.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

* **Python 3.7+**: Download Python from [python.org](https://www.python.org/downloads/).
* **pip**: Python's package installer. It usually comes with Python installations. You can check by running `pip --version`.



## Setup and Installation

1.  **Clone the Repository (or Create Project Folder)**:
    If this were a Git repository, you would clone it. For now, create the `OSINT_Framework` directory and populate it with the files as described in "Project Structure".

2.  **Navigate to the Project Directory**:
    Open your terminal or command prompt and change to the project's root directory:
    ```bash
    cd path/to/OSINT_Framework
    ```

3.  **Create a Virtual Environment (Recommended)**:
    It's good practice to use a virtual environment to manage project dependencies.
    ```bash
    python -m venv venv
    ```
    Activate the virtual environment:
    * On Windows:
        ```bash
        venv\Scripts\activate
        ```
    * On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install Dependencies**:
    The application requires Flask, Flask-SQLAlchemy, and Werkzeug. Install them using pip:
    ```bash
    pip install Flask Flask-SQLAlchemy Werkzeug
    ```
   ```bash
        pip install -r requirements.txt
   ```


## Database Setup

The SQLite database (`users.db`) and the `instance` folder will be created automatically when you first run the `app.py` script, if they don't already exist. The `User` table schema is defined in `app.py` and will also be created.

## Running the Application

1.  **Ensure your virtual environment is activated** (if you created one).
2.  **Navigate to the project's root directory** (`OSINT_Framework/`) in your terminal.
3.  **Run the Flask application**:
    ```bash
    python app.py
    ```
    You should see output similar to this, indicating the server is running:
    ```
     * Serving Flask app 'app' (lazy loading)
     * Environment: development
     * Debug mode: on
     * Running on [http://127.0.0.1:5000/](http://127.0.0.1:5000/) (Press CTRL+C to quit)
     * Restarting with stat
     * Debugger is active!
     * Debugger PIN: xxx-xxx-xxx
    ```

## Accessing the Application

Open your web browser and navigate to:

[http://127.0.0.1:5000/](http://127.0.0.1:5000/)

You will be redirected to the login/registration page. You can register a new account and then log in to access the OSINT framework dashboard.

## Key Files and Customization

* **`app.py`**: Contains all backend logic, routes, database models, and configuration.
* **`arf.json`**: This file is crucial as it contains the hierarchical data for the OSINT categories and tools displayed in the mind map. You can modify this file to update the framework's content. Ensure it's valid JSON.
* **`static/css/style.css`**: All styling for the application.
* **`static/js/script.js`**: Frontend interactivity, including the mind map rendering, search, and theme toggling.
* **`templates/`**: Contains the HTML templates for the different pages.

## Troubleshooting

* **`arf.json` not found**: Ensure `arf.json` is in the root directory of the project (`OSINT_Framework/`). The application will log an error if it can't find or parse this file.
* **Dependencies not installed**: Make sure you have run `pip install Flask Flask-SQLAlchemy Werkzeug` within your activated virtual environment.
* **Port already in use**: If port 5000 is in use, Flask will usually indicate this. You can specify a different port in `app.py` if needed (e.g., `app.run(debug=True, port=5001)`).
* **Database issues**: If you encounter problems with the database, you can try deleting the `instance/users.db` file. It will be recreated on the next run. (Note: This will delete all existing user accounts).

