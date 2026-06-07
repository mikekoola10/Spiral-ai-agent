FROM python:3.11-slim
RUN pip install flask
WORKDIR /app
COPY sandbox_server.py .
CMD ["python", "sandbox_server.py"]