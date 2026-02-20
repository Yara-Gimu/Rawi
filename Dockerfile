# استخدمنا نسخة بايثون خفيفة
FROM python:3.9-slim

# تنظيف وتحديث النظام
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملف المكتبات وتثبيتها
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ كود الشات بوت (تأكدي أن ملفك الأساسي اسمه app.py أو غيريه هنا)
COPY . .

# البورت اللي يشتغل عليه الشات بوت (غالباً 8501 لـ Streamlit أو 5000 لـ Flask)
EXPOSE 8501

# أمر التشغيل
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]