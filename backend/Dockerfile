FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
COPY ./app/. .

# TODO: 本番環境のときは --reload を外すこと
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]