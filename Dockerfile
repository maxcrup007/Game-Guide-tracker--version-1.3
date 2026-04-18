FROM python:3.10-slim

WORKDIR /app

# Copy the requirements file first (Efficiency!)
COPY requirements.txt .

# Install the heavy stuff inside the container
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your files
COPY . .

# Expose the port (Flask usually uses 5000)
EXPOSE 5000

# Run the app and make it accessible externally
CMD ["python", "app.py"]