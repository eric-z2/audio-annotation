# Perspectivism Audio Annotation

A Django-based web application for convenient audio capture and storage. This project was built with Python 3.12+ and Django 6.0.

## Prerequisites

Please ensure you have Python 3.12+ installed on your system.

## Installation

### 1. Clone the repository**

```bash
git clone https://github.com/eric-z2/perspectivism-audio-annotation.git
cd perspectivism-audio-annotation
```

### 2. Setup environment**

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

## Project Structure

`main_project`: contains the main project configurations \
`audio_capture`: logic for audio capture app \
`audio_storage`: storage for recorded audio snippets

## Contact

For questions or support, please open an issue on GitHub.