import streamlit as st
from pathlib import Path
import base64
import os
from dotenv import load_dotenv

# تحميل متغيرات البيئة
load_dotenv()

# ============================================================================
# ⚙️ إعدادات Gemini API
# ============================================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ============================================================================
# ⚙️ إعدادات Supabase
# ============================================================================
# محاولة استيراد Supabase (اختياري في البداية)
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    st.warning("⚠️ مكتبة Supabase غير مثبتة. استخدم: pip install supabase")

if SUPABASE_AVAILABLE:
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    else:
        st.warning("⚠️ مفاتيح Supabase غير موجودة في متغيرات البيئة")
        supabase = None
else:
    supabase = None

# ============================================================================
# 📊 وظائف Supabase
# ============================================================================

@st.cache_data(ttl=3600)  # تخزين مؤقت لمدة ساعة
def get_landmarks_from_supabase():
    """جلب المعالم من قاعدة بيانات Supabase"""
    if not supabase:
        return None
    
    try:
        response = supabase.table("landmarks").select("*").execute()
        return response.data
    except Exception as e:
        st.error(f"❌ خطأ في جلب البيانات من Supabase: {str(e)}")
        return None

def get_landmarks_from_local():
    """جلب المعالم من ملف محلي كبديل"""
    try:
        import json
        landmarks_file = Path(__file__).parent / "src" / "data" / "landmarks.json"
        if landmarks_file.exists():
            with open(landmarks_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("landmarks", [])
    except Exception as e:
        st.error(f"❌ خطأ في قراءة الملف المحلي: {str(e)}")
    return []

# ============================================================================
# ⚙️ إعدادات الصفحة الاحترافية
# ============================================================================
st.set_page_config(
    page_title="راوي | Rawi.ai - النظام السحابي",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ============================================================================
# 🎨 أنماط CSS مخصصة
# ============================================================================
st.markdown("""
    <style>
        [data-testid="stSidebar"] {
            background-color: #2C4A3B;
            background-image: linear-gradient(135deg, #2C4A3B 0%, #1a2f26 100%);
        }
        [data-testid="stSidebar"] * {
            color: white !important;
        }
        .stButton>button {
            width: 100%;
            border-radius: 20px;
            border: 2px solid #D4AF37;
            background: linear-gradient(135deg, #2C4A3B 0%, #1a2f26 100%);
            color: #D4AF37;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .stButton>button:hover {
            background-color: #D4AF37;
            color: #2C4A3B;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }
        iframe {
            border-radius: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        [data-testid="stSidebar"] .css-1y4p8pa {
            padding: 2rem 1rem;
        }
    </style>
""", unsafe_allow_html=True)

# ============================================================================
# 📂 وظيفة تحويل الصور إلى Data URLs
# ============================================================================
def image_to_base64(image_path):
    """تحويل صورة إلى Base64 لتضمينها في HTML"""
    try:
        with open(image_path, 'rb') as img:
            return base64.b64encode(img.read()).decode('utf-8')
    except:
        return None

# ============================================================================
# 📂 وظيفة دمج ملفات HTML + CSS + JS في ملف واحد
# ============================================================================
def build_complete_html(html_path, css_paths, js_paths, app_type="src"):
    """
    توحيد ملف HTML مع CSS و JS بدون روابط خارجية
    يقرأ الملفات ويدمجها في HTML واحد
    """
    try:
        # قراءة ملف HTML الأساسي
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # قراءة جميع ملفات CSS
        css_content = ""
        for css_file in css_paths:
            if Path(css_file).exists():
                with open(css_file, 'r', encoding='utf-8') as f:
                    css_content += f.read() + "\n"
        
        # قراءة جميع ملفات JS
        js_content = ""
        for js_file in js_paths:
            if Path(js_file).exists():
                with open(js_file, 'r', encoding='utf-8') as f:
                    js_content += f.read() + "\n"
        
        # معالجة الصور (تحويلها إلى Base64)
        workspace_root = Path(__file__).parent
        
        if app_type == "src":
            logo_path = workspace_root / "public" / "logo.png"
            if logo_path.exists():
                logo_b64 = image_to_base64(logo_path)
                if logo_b64:
                    html_content = html_content.replace(
                        'src="../public/logo.png"',
                        f'src="data:image/png;base64,{logo_b64}"'
                    )
        
        elif app_type == "admin":
            admin_logo_path = workspace_root / "admin" / "public" / "admin-logo.png"
            if admin_logo_path.exists():
                admin_logo_b64 = image_to_base64(admin_logo_path)
                if admin_logo_b64:
                    html_content = html_content.replace(
                        'src="public/admin-logo.png"',
                        f'src="data:image/png;base64,{admin_logo_b64}"'
                    )
        
        # إضافة مكتبة Chart.js للأدمن
        chart_js = '<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>'
        
        # تمرير اعدادات Supabase و Gemini API إلى JavaScript
        config_script = f"""
        <script>
            // ✅ إعدادات Supabase
            window.SUPABASE_CONFIG = {{
                enabled: {str(SUPABASE_AVAILABLE).lower()},
                url: "{SUPABASE_URL or ''}",
                key: "{SUPABASE_KEY or ''}"
            }};
            
            // ✅ إعدادات Google Gemini API
            window.GEMINI_CONFIG = {{
                key: "{GEMINI_API_KEY or ''}"
            }};
            
            console.log('✅ تم تحميل جميع الإعدادات من Backend');
        </script>
        """
        
        # إنشاء HTML محسّن مع CSS و JS مدمجين
        optimized_html = html_content.replace(
            '</head>',
            f'{chart_js}{config_script}<style>{css_content}</style></head>'
        ).replace(
            '</body>',
            f'<script>{js_content}</script></body>'
        )
        
        return optimized_html
        
    except Exception as e:
        st.error(f"❌ خطأ في دمج الملفات: {str(e)}")
        return None

# ============================================================================
# 🎨 دالة عرض الملفات بجميع مكوناتها
# ============================================================================
def render_complete_app(app_type="src", admin_page="dashboard"):
    """
    عرض تطبيق كامل مع جميع ملفات CSS و JS المدمجة
    app_type: "src" (شات بوت) أو "admin" (لوحة تحكم)
    admin_page: "dashboard" أو "cms" (للأدمن فقط)
    """
    try:
        workspace_root = Path(__file__).parent
        
        if app_type == "src":
            html_path = workspace_root / "src" / "index.html"
            css_paths = [
                workspace_root / "src" / "styles" / "style.css"
            ]
            js_paths = [
                workspace_root / "src" / "js" / "chatbot.js",
                workspace_root / "src" / "js" / "ai.js"
            ]
        elif app_type == "admin":
            # اختيار الصفحة الإدارية
            if admin_page == "dashboard":
                html_path = workspace_root / "admin" / "dashboard.html"
            else:  # cms
                html_path = workspace_root / "admin" / "cms.html"
            
            css_paths = [
                workspace_root / "admin" / "src" / "styles" / "style.css"
            ]
            js_paths = [
                workspace_root / "admin" / "src" / "js" / "admin.js"
            ]
        else:
            st.error("❌ نوع التطبيق غير معروف")
            return
        
        # التحقق من وجود الملفات
        if not html_path.exists():
            st.error(f"❌ لم يتم العثور على: {html_path}")
            return
        
        # بناء HTML المدمج
        complete_html = build_complete_html(html_path, css_paths, js_paths, app_type)
        
        if complete_html:
            # عرض داخل Streamlit
            st.components.v1.html(complete_html, height=850, scrolling=True)
        
    except Exception as e:
        st.error(f"❌ حدث خطأ: {str(e)}")

# ============================================================================
# 🧭 القائمة الجانبية للتنقل
# ============================================================================
with st.sidebar:
    # شعار التطبيق (اختياري - إذا كان الشعار موجود)
    try:
        st.image("src/assets/images/logo.png", width=100)
    except:
        pass  # إذا لم يكن الشعار موجود، تجاهل الخطأ
    
    st.title("🎙️ نظام راوي")
    st.markdown("### الدليل السياحي الذكي")
    st.write("---")
    
    # عرض حالة الاتصال (Supabase)
    if supabase:
        st.success("✅ متصل بـ Supabase")
    else:
        st.warning("⚠️ بدون اتصال سحابي")
    
    st.write("---")
    
    # خيارات الملاحة
    choice = st.radio(
        "اختر الواجهة:",
        ["🤖 شات بوت راوي", "🔐 لوحة التحكم (Admin)"],
        index=0,
        label_visibility="collapsed"
    )
    
    st.write("---")
    st.info("🌟 مرشدك الذكي لاستكشاف التراث السعودي في منطقة عسير")
    
    st.write("---")
    st.caption("© 2026 راوي | رؤية المملكة 2030 🇸🇦")

# ============================================================================
# 🖼️ عرض المحتوى بناءً على الاختيار
# ============================================================================

if choice == "🤖 شات بوت راوي":
    st.subheader("📱 تجربة السائح التفاعلية الذكية")
    st.caption("استكشف التراث السعودي مع راوي - مرشدك الذكي")
    render_complete_app("src")

elif choice == "🔐 لوحة التحكم (Admin)":
    st.subheader("⚙️ إدارة نظام راوي")
    st.caption("لوحة التحكم الإدارية - إدارة المعالم والبيانات")
    
    # تنبيه بسيط لبيانات الدخول
    with st.container():
        col1, col2 = st.columns([1, 2])
        with col1:
            st.warning("🔑 بيانات الدخول:")
        with col2:
            st.code("المستخدم: admin | كلمة المرور: admin123", language=None)
    
    # اختيار الصفحة الإدارية
    col1, col2 = st.columns(2)
    with col1:
        dashboard_btn = st.button("📊 الإحصائيات", key="dashboard", use_container_width=True)
    with col2:
        cms_btn = st.button("🗺️ إدارة المعالم", key="cms", use_container_width=True)
    
    # عرض الصفحة المناسبة
    if "admin_page" not in st.session_state:
        st.session_state.admin_page = "dashboard"
    
    if dashboard_btn:
        st.session_state.admin_page = "dashboard"
    if cms_btn:
        st.session_state.admin_page = "cms"
    
    render_complete_app("admin", admin_page=st.session_state.admin_page)

# ============================================================================
# 👨‍💻 تذييل الصفحة
# ============================================================================
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #999; font-size: 11px; margin-top: 20px; padding: 10px;">
    <p><b>🎙️ راوي - دليل عسير السياحي الذكي (النسخة السحابية)</b></p>
    <p>الإصدار 2.1 | التحديث الأخير: فبراير 2026</p>
    <p>© 2026 جميع الحقوق محفوظة | تطوير بـ ❤️</p>
</div>
""", unsafe_allow_html=True)
