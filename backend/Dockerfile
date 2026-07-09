FROM python:3.12-slim

WORKDIR /app

ARG INSTALL_CREWAI=false

COPY requirements.txt requirements-agents.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN if [ "$INSTALL_CREWAI" = "true" ]; then pip install --no-cache-dir -r requirements-agents.txt; fi

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
