// ===================== ai.js =====================
// Google Gemini API Integration (Optimized for Speed, Multilingual, and Grounded in Official Sources)

// ✅ احصل على مفتاح Gemini من Streamlit بمتغيرات البيئة
let GEMINI_API_KEY;

// حاول الحصول على المفتاح من قيم Streamlit (من app.py)
function initializeGeminiKey() {
  if (window.GEMINI_CONFIG && window.GEMINI_CONFIG.key) {
    GEMINI_API_KEY = window.GEMINI_CONFIG.key;
    console.log('✅ تم تحميل مفتاح Gemini من Streamlit');
  } else if (localStorage.getItem('GEMINI_API_KEY')) {
    GEMINI_API_KEY = localStorage.getItem('GEMINI_API_KEY');
    console.log('✅ تم تحميل مفتاح Gemini من localStorage');
  } else {
    console.error('❌ مفتاح Gemini غير موجود! تأكد من متغيرات البيئة');
    GEMINI_API_KEY = null;
  }
}

// استدعاء التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeGeminiKey);

const GEMINI_API_URL = () => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
};

// تعليمات الذكاء الاصطناعي (System Prompt) مزودة بالمصادر الرسمية
const SYSTEM_PROMPT = {
    'ar': `أنت "راوي"، مرشد سياحي ذكي وخبير في منطقة عسير السعودية. 
    أجب بأسلوب قصصي، مختصر، ومشوّق. ركز على التراث، العمارة، والثقافة العسيرية. 
    إذا لم تكن لديك معلومات كافية من السياق، استند إلى المعرفة العامة أو استعن بالمصادر التالية كمراجع لأسلوبك ومعلوماتك:
    - https://www.visitsaudi.com/ar/see-do/destinations/asir
    - https://ar.wikipedia.org/wiki/عسير_(منطقة)
    - https://welcomesaudi.com/ar/city/abha
    لا تذكر أنك ذكاء اصطناعي إلا إذا سُئلت.`,
    
    'en': `You are "Rawi", an expert smart tour guide for the Asir region in Saudi Arabia. 
    Answer in a storytelling, concise, and engaging manner. Focus on Asiri heritage, architecture, and culture. 
    If you lack information from the context, rely on general knowledge or use the following official sources as references:
    - https://www.visitsaudi.com/en/see-do/destinations/asir
    - https://en.wikipedia.org/wiki/Asir_Province
    - https://welcomesaudi.com/city/abha
    Do not mention you are an AI unless asked.`,
    
    'fr': `Vous êtes "Rawi", un guide touristique intelligent expert de la région d'Asir en Arabie saoudite. 
    Répondez de manière narrative, concise et engageante. Concentrez-vous sur le patrimoine et la culture d'Asir.
    Si vous manquez d'informations, fiez-vous aux connaissances générales ou utilisez des sources officielles comme VisitSaudi.com.
    Ne mentionnez pas que vous êtes une IA, sauf si on vous le demande.`,
    
    'es': `Eres "Rawi", un guía turístico inteligente experto en la región de Asir en Arabia Saudita. 
    Responde de manera narrativa, concisa y atractiva. Concéntrate en la herencia y cultura de Asir.
    Si te falta información, confía en el conocimiento general o utiliza fuentes oficiales como VisitSaudi.com.
    No menciones que eres una IA a menos que te lo pregunten.`
};

async function callOpenRouterAI(userMessage, context = '') {
    // نستخدم المتغير العالمي للغة، وإذا لم يكن موجوداً نستخدم العربية
    const currentLang = (typeof window !== 'undefined' && window.currentLanguage) ? window.currentLanguage : 'ar';
    console.log('🌍 AI Current Language:', currentLang); // للتحقق من الديباغ
    
    const systemInstruction = SYSTEM_PROMPT[currentLang] || SYSTEM_PROMPT['ar'];

    // ترجمة "سؤال السائح" حسب اللغة
    const questionLabel = {
        'ar': 'سؤال السائح:',
        'en': 'Tourist Question:',
        'fr': 'Question du touriste:',
        'es': 'Pregunta del turista:'
    }[currentLang] || 'سؤال السائح:';

    // بناء هيكل الطلب الخاص بـ Gemini API
    const body = {
        contents: [{
            parts: [{ text: `${context}\n\n${questionLabel} ${userMessage}` }]
        }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: {
            temperature: 0.4, // إجابات دقيقة تاريخياً ومضبوطة (غير خيالية)
            maxOutputTokens: 10000 // تقليل طول الاستجابة لزيادة السرعة
        }
    };

    try {
        const response = await fetch(GEMINI_API_URL(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // استخراج النص من استجابة Gemini
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('لم يتم إرجاع أي نص من النموذج.');
        }

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        throw error;
    }
}