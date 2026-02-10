# Perspectivism Audio Annotation

A Django-based web application for convenient audio capture and storage. This project was built with Python 3.12+ and Django 6.0.

## Prerequisites

Please ensure you have Python 3.12+ and uv installed on your system.

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/eric-z2/perspectivism-audio-annotation.git
cd perspectivism-audio-annotation
```

**2. Activate the virtual environment**

```bash
uv .venv
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

**3. Install dependencies**

```bash
uv sync
```

## Development

1. Run migrations

```bash
python manage.py migrate
```

2. Start development server

```bash
python manage.py runserver
```

The application should start available at `http://127.0.0.1:8000/homepage/`

## Project Structure

`main_project`: contains the main project configurations \
`audio_capture`: logic for audio capture app \
`audio_storage`: storage for recorded audio snippets

## Contact

For questions or support, please open an issue on GitHub.