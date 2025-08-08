FROM python:3.11-slim
WORKDIR /app
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY wait-for-db.sh ./wait-for-db.sh
COPY app/ app/ 

# TODO: 本番環境のときは --reload を外すこと
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]