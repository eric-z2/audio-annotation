# Audio Annotation

A Django-based web application for convenient audio capture and storage. This project was built with Python 3.12+ and Django 6.0.

## Prerequisites

Please ensure you have Python 3.12+ installed on your system.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/eric-z2/audio-annotation.git
cd audio-annotation
```

### 2. Setup environment

**macOS/Linux:**

If you have `uv` installed, run:

```bash
uv sync
source .venv/bin/activate
```

Or with standard Python:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows:**

If you have `uv` installed, run:

```bash
uv sync
.venv\Scripts\activate
```

Or with standard Python:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:
```bash
touch .env
```

Generate a secret key and copy the output:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Add the key to your `.env` file:
```
SECRET_KEY='secret-key-goes-here'
```

## Development

### 1. Run migrations

```bash
python manage.py migrate
```

### 2. Start development server

```bash
python manage.py runserver
```

The application should start at `http://127.0.0.1:8000/annotation/homepage/`

## Project Overview

Participants begin at a homepage where the project overview and basic instructions are displayed. They are prompted to enter their crowdworker id before continuing. Then, they have a brief microphone self test where they can test their microphone and become familiar with the testing environment. Next, the trials begin where participants receive individual instructions and prompts and record their response. Responses are saved in `db.sqlite3`. 

## Configuration

There are two necessary configuration locations: `main_project/settings.py` and `questions/questions.json`. 

### 1. main_project\settings.py

Configurations can be found at the bottom of `settings.py`. Key configuration options:
- **ALLOWED_HOSTS**: A list of host/domain names the site can serve. Values can be fully qualified names (e.g., "www.example.com") or any subdomain type (e.g., "example.com" or ".example.com")
- **CSRF_TRUSTED_ORIGINS**: A list of trusted origins for unsafe requests (e.g., `POST`). A sample entry is https://www.example.com.
- **PROJECT_NAME**: The name of your project. Default is 'Audio Annotation.'
- **INTRODUCTION TEXT**: A brief overview of your project, a description of what the annotation annotators are expected to do, and the estimated time length. This will be displayed on the project homepage.
- **ENDING TEXT**: A short ending message. This will be displayed after participants finish all trials.
- **BASE_COLOUR**: Base colour for all pages. 
- **BASE_COLOUR_DARK**: Accent to the base colour. Colour displayed when hovering over buttons.
- **MIN_LEN_TEST** and **MAX_LEN_TEST**: Time lengths (in seconds) for the microphone test before all the trials. No modifications recommended.

### 2. questions\questions.json

Questions are loaded into the project via a `questions.json` file. A sample file can be found in the `questions` folder titled `questions.json`. An exemplar file can be found in `questions` titled `questions_exemplar.json`. Each trial has a set of mandatory configurations and optional configurations. Trials are displayed in the order.

#### Mandatory configurations
- **trial_name**: The name of the trial. This should be related to what text/information the participate is annotating.
- **instructions**: Detailed instructions specific to the trial. Information like background information, what the participant has to do, and the estimated time length should go here.
- **min_time**: Minimum time in seconds the participant has to record for.
- **max_time**: Maximum time in seconds the participant can record for.
- **questions**: A list of questions as dictionaries. Questions can be as long as necessary. In cases where there are multiple questions, a question is randomly chosen for each participant.

#### Optional configurations
- **display**: When the question is displayed to the participant. Two possible options: "before" and "after." "Before" displays the question before the timer starts. "After" displays the question after the timer starts. Default is "before."
- **mc_options**: Multiple choice options that will appear after a trial. These will be stored with the trial in the database. A sample use case is participants annotating r/AmITheAsshole forum where multiple choice options represents their final verdict (e.g., NTA (Not the asshole), YTA (You're the asshole), etc.).

## Project Structure

`main_project`: contains the main project configurations \
`audio_capture`: logic for audio capture app \
`audio_storage`: storage for recorded audio snippets as `.webm` files \
`questions`: questions to be displayed

## Disclaimers

Trial questions are displayed in sequential order, meaning that refreshing the page will restart the trials from the very beginning. Session information and preceeding audio will be saved, but the participant cannot begin where they left off.

## Contact

For questions or support, please open an issue on GitHub.