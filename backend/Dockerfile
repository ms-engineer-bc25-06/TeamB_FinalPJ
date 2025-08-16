FROM python:3.11-slim
WORKDIR /app
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      postgresql-client \
      ffmpeg \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
COPY requirements-dev.txt /app/requirements-dev.txt

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# ★ CPU版 PyTorch を“先に”明示インストール（CUDAを引かない）
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
      torch==2.1.0

RUN pip install --no-cache-dir -r /app/requirements.txt \
 && pip install --no-cache-dir -r /app/requirements-dev.txt || true

COPY wait-for-db.sh /app/wait-for-db.sh
RUN chmod +x /app/wait-for-db.sh

COPY app/ /app/app/
COPY seed_db.py /app/seed_db.py

# TODO: 本番環境のときは --reload を外すこと
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]