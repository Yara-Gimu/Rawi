// ===================== chatbot.js =====================
// STRICT DESIGN SYSTEM + FEATURES 1-6 + AI CHAT INTEGRATION + TYPING INDICATOR

(function() {
  // ---------- global state ----------
  let currentLanguage = 'ar';               // default arabic
  let currentLandmarkId = null;
  let activeUtterance = null;               // for speech synthesis
  let landmarksData = null;                  // will be loaded from JSON
  let qrScanner = null;                       // html5-qrcode instance
  let onboardingActionsDiv = null;            // reference to action buttons for language updates
  let welcomeMessageElement = null;           // reference to welcome message for language updates

  // DOM elements
  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const darkToggle = document.getElementById('darkModeToggle');
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langMenu = document.getElementById('langMenu');
  const qrModal = document.getElementById('qrReaderModal');
  const closeQrBtn = document.getElementById('closeQrBtn');
  const qrContainer = document.getElementById('qrReaderContainer');
  const qrStatus = document.getElementById('qrStatus');
  const memoryModal = document.getElementById('memoryModal');
  const closeMemoryBtn = document.getElementById('closeMemoryBtn');
  const memoryGallery = document.getElementById('memoryGallery');
  const visitorNameInput = document.getElementById('visitorNameInput');
  const photoFileInput = document.getElementById('photoFileInput');
  const uploadBtn = document.getElementById('uploadMemoryBtn');
  const logoText = document.getElementById('logoText'); // Logo text element

  // ---------- load landmarks JSON ----------
  function loadLandmarksData() {
    // ✅ حاول قراءة البيانات المعدَّلة من الإدارة أولاً
    const savedData = localStorage.getItem('rawi_db');
    if (savedData) {
      try {
        landmarksData = JSON.parse(savedData);
        console.log('✅ تم تحميل البيانات المعدَّلة من الإدارة');
        return;
      } catch (e) {
        console.warn('خطأ في قراءة البيانات من الإدارة');
      }
    }
    
    // إذا لم توجد بيانات معدَّلة، اقرأ الملف الأساسي
    fetch('../data/landmarks.json')
      .then(r => r.json())
      .then(data => {
        landmarksData = data;
        console.log('✅ تم تحميل المعالم من الملف الأساسي');
        // احفظ نسخة في localStorage للاستخدام السريع
        if (!localStorage.getItem('rawi_db')) {
          try {
            localStorage.setItem('rawi_db', JSON.stringify(data));
          } catch (e) {
            console.warn('⚠️ لم يتمكن من حفظ البيانات في localStorage');
          }
        }
      })
      .catch(e => console.warn('❌ landmarks.json not found:', e));
  }
  loadLandmarksData();

  // ---------- helper: translation ----------
  function getTranslation(key, lang = currentLanguage) {
    const translations = {
      welcome_message: { ar: 'مرحباً بك في راوي، مرشدك السياحي الذكي.', en: 'Welcome to Rawi, your smart tour guide.', fr: 'Bienvenue sur Rawi, votre guide touristique intelligent.', es: 'Bienvenido a Rawi, tu guía turístico inteligente.' },
      scan_qr: { ar: '📷 امسح رمز QR', en: '📷 Scan Landmark QR', fr: '📷 Scanner QR', es: '📷 Escanear QR' },
      explore_nearby: { ar: '🗺️ استكشف القريب', en: '🗺️ Explore Nearby', fr: '🗺️ Explorez les environs', es: '🗺️ Explorar alrededor' },
      explore_coming_soon: { ar: 'ميزة استكشاف المعالم القريبة قيد التفعيل قريباً', en: 'Explore feature coming soon', fr: 'La fonction d\'exploration arrive bientôt', es: 'La función de exploración vendrá pronto' },
      landmark_prompt: { ar: 'اسألني عن هذا المعلم...', en: 'Ask me about this landmark...', fr: 'Posez-moi une question...', es: 'Pregúntame algo...' },
      share_memory_btn: { ar: '📸 شارك ذكرى', en: '📸 Share a Memory', fr: '📸 Partager un souvenir', es: '📸 Compartir un recuerdo' },
      anonymous: { ar: 'زائر', en: 'Visitor', fr: 'Visiteur', es: 'Visitante' },
      ai_error: { ar: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.', en: 'Connection error, please try again.', fr: 'Erreur de connexion, veuillez réessayer.', es: 'Error de conexión, por favor intenta de nuevo.' },
      ai_offline: { ar: 'عذراً، نظام الذكاء الاصطناعي غير متصل حالياً.', en: 'Sorry, AI system is currently offline.', fr: 'Désolé, le système IA est actuellement hors ligne.', es: 'Lo sentimos, el sistema de IA está actualmente sin conexión.' }
    };
    return (translations[key]?.[lang] || translations[key]?.['ar'] || key);
  }

  // ---------- FEATURE 2: onboarding welcome + action buttons ----------
  function showOnboarding() {
    // Welcome message
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'message bot-message';
    welcomeDiv.innerText = getTranslation('welcome_message');
    chatMessages.appendChild(welcomeDiv);
    welcomeMessageElement = welcomeDiv; // Store reference
    
    // action buttons card
    onboardingActionsDiv = document.createElement('div');
    onboardingActionsDiv.className = 'message bot-message action-card';
    onboardingActionsDiv.style.backgroundColor = 'transparent'; 
    onboardingActionsDiv.style.boxShadow = 'none';
    onboardingActionsDiv.style.border = 'none';
    onboardingActionsDiv.style.maxWidth = '100%';
    onboardingActionsDiv.innerHTML = `
      <div class="action-buttons">
        <button class="primary-action" id="scanQrAction">${getTranslation('scan_qr')}</button>
        <button class="secondary-action" id="exploreAction">${getTranslation('explore_nearby')}</button>
      </div>
    `;
    chatMessages.appendChild(onboardingActionsDiv);
    
    document.getElementById('scanQrAction')?.addEventListener('click', () => {
      openQrScanner();
    });
    document.getElementById('exploreAction')?.addEventListener('click', () => {
      addBotMessage(getTranslation('explore_coming_soon'), false);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ---------- FEATURE 3 & 4: create landmark smart card with TTS ----------
  function createLandmarkCard(landmark) {
    const card = document.createElement('div');
    card.className = 'smart-card';
    const name = landmark.name?.[currentLanguage] || landmark.name?.ar || 'معلم';
    const desc = landmark.description?.[currentLanguage] || landmark.description?.ar || 'وصف غير متوفر';

    card.innerHTML = `
      <div class="card-header">
        <h3>${name}</h3>
        <button class="audio-btn" id="playAudioBtn" data-desc="${encodeURIComponent(desc)}" aria-label="Play Audio">🎧</button>
      </div>
      <div class="card-description">${desc}</div>
      <div class="card-footer">
        <button class="memory-btn" id="shareMemoryCardBtn">${getTranslation('share_memory_btn')}</button>
      </div>
    `;
    chatMessages.appendChild(card);
    
    // audio button logic (FEATURE 4)
    const audioBtn = card.querySelector('#playAudioBtn');
    audioBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const descText = decodeURIComponent(this.dataset.desc);
      toggleSpeech(descText, audioBtn);
    });
    
    // memory button: open memory modal (FEATURE 6)
    const memBtn = card.querySelector('#shareMemoryCardBtn');
    memBtn.addEventListener('click', () => {
      if (landmark.id) {
        currentLandmarkId = landmark.id;
        openMemoryModal(landmark.id);
      }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ---------- TTS using Web Speech API (FEATURE 4) ----------
  function toggleSpeech(text, btnElement) {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.cancel();
      btnElement.textContent = '🎧';
      return;
    }
    window.speechSynthesis.cancel(); // cancel any ongoing
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage === 'ar' ? 'ar-SA' :
                     currentLanguage === 'en' ? 'en-US' :
                     currentLanguage === 'fr' ? 'fr-FR' : 'es-ES';
    utterance.rate = 1.0;
    utterance.onstart = () => { btnElement.textContent = '⏹️'; };
    utterance.onend = () => { btnElement.textContent = '🎧'; };
    utterance.onerror = () => { btnElement.textContent = '🎧'; };
    window.speechSynthesis.speak(utterance);
    activeUtterance = utterance;
  }

  // ---------- QR SCANNER MODAL (FEATURE 5) ----------
  function openQrScanner() {
    qrModal.style.display = 'flex';
    qrStatus.textContent = 'جاري تشغيل الكاميرا...';
    if (qrScanner) qrScanner.stop().catch(()=>{});

    qrScanner = new Html5Qrcode("qrReaderContainer");
    qrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {   // on success
        qrScanner.stop();
        qrModal.style.display = 'none';
        qrStatus.textContent = 'تم المسح بنجاح';
        
        // assume decodedText is landmark ID like "001"
        if (landmarksData && landmarksData.landmarks) {
          const found = landmarksData.landmarks.find(l => l.id === decodedText.trim());
          if (found) {
            displayLandmarkById(found.id);
          } else {
            // For testing purposes: if QR code doesn't match, force it to '001'
            // Remove this fallback in production
            const fallback = landmarksData.landmarks[0];
            if(fallback) displayLandmarkById(fallback.id);
            else addBotMessage('لم يتم العثور على المعلم', false);
          }
        } else {
          alert('جاري تحميل البيانات، يرجى المحاولة بعد قليل.');
        }
      },
      (error) => { qrStatus.textContent = 'وجه الكاميرا نحو رمز الاستجابة السريعة (QR)'; }
    ).catch(err => {
      qrStatus.textContent = 'حدث خطأ في الوصول للكاميرا. تأكد من إعطاء الصلاحيات.';
    });
  }

  function displayLandmarkById(id) {
    if (!landmarksData) return;
    const landmark = landmarksData.landmarks.find(l => l.id === id);
    if (!landmark) return;
    currentLandmarkId = id;
    createLandmarkCard(landmark);
    enableChat(); // تفعيل الدردشة بعد مسح المعلم
  }

  // close qr modal
  closeQrBtn.addEventListener('click', ()=>{
    if (qrScanner) { qrScanner.stop().catch(()=>{}); }
    qrModal.style.display = 'none';
  });

  // ---------- MEMORY WALL MODAL (FEATURE 6) ----------
  async function openMemoryModal(landmarkId) {
    memoryModal.style.display = 'flex';
    renderGallery(landmarkId);
    // store landmarkId for upload
    uploadBtn.replaceWith(uploadBtn.cloneNode(true));
    const newUpload = document.getElementById('uploadMemoryBtn');
    newUpload.addEventListener('click', () => {
      uploadPhotoToSupabase(landmarkId);
    });
  }

  function renderGallery(landmarkId) {
    memoryGallery.innerHTML = '';
    const photos = fetchPhotosFromSupabase(landmarkId); 
    photos.forEach(p => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `<img src="${p.src}" alt="memory"><span class="gallery-caption">${p.name || 'زائر'}</span>`;
      memoryGallery.appendChild(item);
    });
  }

  // fallback localStorage 
  function fetchPhotosFromSupabase(landmarkId) {
    const stored = JSON.parse(localStorage.getItem(`mem_${landmarkId}`)) || [];
    return stored;
  }

  function uploadPhotoToSupabase(landmarkId) {
    const file = photoFileInput.files[0];
    if (!file) return alert('الرجاء اختيار صورة أولاً');
    const name = visitorNameInput.value.trim() || getTranslation('anonymous');

    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto = { src: e.target.result, name: name };
      const existing = JSON.parse(localStorage.getItem(`mem_${landmarkId}`)) || [];
      existing.push(newPhoto);
      localStorage.setItem(`mem_${landmarkId}`, JSON.stringify(existing));
      renderGallery(landmarkId);
      photoFileInput.value = '';
      visitorNameInput.value = '';
    };
    reader.readAsDataURL(file);
  }

  closeMemoryBtn.addEventListener('click', ()=>{
    memoryModal.style.display = 'none';
  });

  // ---------- dark mode ----------
  darkToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('night-mode');
    const isNight = document.body.classList.contains('night-mode');
    darkToggle.textContent = isNight ? '☀️' : '🌙';
  });

  // ---------- language dropdown ----------
  langToggleBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    langMenu.classList.toggle('show');
  });
  document.addEventListener('click', (e)=>{
    if (!e.target.closest('.lang-dropdown')) langMenu.classList.remove('show');
  });
  langMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const lang = btn.dataset.lang;
      if (lang) {
        currentLanguage = lang;
        window.currentLanguage = lang; // تحديث النطاق العام للـ AI
        
        langMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        langMenu.classList.remove('show');
        
        // تحديث نصوص الـ UI
        updateUITexts(lang);
      }
    });
  });

  // دالة لتحديث نصوص الواجهة عند تغيير اللغة
  function updateUITexts(lang) {
    // تحديث كلمة راوي في الشعار
    const logoTextContent = logoText?.getAttribute(`data-${lang}`);
    if (logoTextContent && logoText) {
      logoText.textContent = logoTextContent;
    }
    
    // تحديث زر الإرسال
    const sendBtnText = sendBtn.getAttribute(`data-${lang}`);
    if (sendBtnText) {
      sendBtn.textContent = sendBtnText;
    }
    
    // تحديث placeholder الإدخال
    if (!userInput.disabled) {
      userInput.placeholder = getTranslation('landmark_prompt', lang);
    }
    
    // تحديث رسائل الترحيب والأزرار
    updateOnboardingTexts(lang);
  }

  // دالة لتحديث رسائل الترحيب والأزرار عند تغيير اللغة
  function updateOnboardingTexts(lang) {
    // تحديث رسالة الترحيب
    if (welcomeMessageElement) {
      welcomeMessageElement.innerText = getTranslation('welcome_message', lang);
    }
    
    // تحديث أزرار الإجراءات
    if (onboardingActionsDiv) {
      const scanQrBtn = onboardingActionsDiv.querySelector('#scanQrAction');
      const exploreBtn = onboardingActionsDiv.querySelector('#exploreAction');
      
      if (scanQrBtn) {
        scanQrBtn.innerText = getTranslation('scan_qr', lang);
      }
      if (exploreBtn) {
        exploreBtn.innerText = getTranslation('explore_nearby', lang);
      }
    }
  }

  // ---------- onboarding at load ----------
  window.addEventListener('load', ()=>{
    showOnboarding();
    userInput.disabled = true;
    sendBtn.disabled = true;  
  });

  // ---------- UI logic for messages ----------
  function addBotMessage(text, typing = true) {
    const msg = document.createElement('div');
    msg.classList.add('message', 'bot-message');
    msg.innerText = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ---------- AI CHAT INTEGRATION ----------
  
  // دالة لتفعيل الشات بعد مسح المعلم
  function enableChat() {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.placeholder = getTranslation('landmark_prompt');
    
    // تحديث نصوص الزر بحسب اللغة الحالية
    const sendBtnText = sendBtn.getAttribute(`data-${currentLanguage}`);
    if (sendBtnText) {
      sendBtn.textContent = sendBtnText;
    }
  }

  // إظهار وإخفاء مؤشر الكتابة (النقاط الثلاث)
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // حدث الإرسال (زر الإرسال)
  sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. إضافة رسالة المستخدم للواجهة
    const userMsg = document.createElement('div');
    userMsg.classList.add('message', 'user-message');
    userMsg.innerText = text;
    chatMessages.appendChild(userMsg);
    
    userInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 2. تعطيل الإدخال مؤقتاً أثناء التفكير وإظهار مؤشر الكتابة
    userInput.disabled = true;
    sendBtn.disabled = true;
    userInput.placeholder = "...";
    showTypingIndicator(); // <-- ظهور النقاط هنا

    try {
      // 3. بناء السياق للذكاء الاصطناعي بنفس لغة المستخدم
      let context = '';
      if (currentLandmarkId && landmarksData) {
        const currentLM = landmarksData.landmarks.find(l => l.id === currentLandmarkId);
        if (currentLM) {
            const lmName = currentLM.name[currentLanguage] || currentLM.name.ar;
            const lmDesc = currentLM.description[currentLanguage] || currentLM.description.ar;
            
            // بناء السياق حسب اللغة
            if (currentLanguage === 'ar') {
              context = `المستخدم متواجد حالياً عند معلم: ${lmName}. وصف المعلم: ${lmDesc}. لغة المستخدم: العربية.`;
            } else if (currentLanguage === 'en') {
              context = `The user is currently at: ${lmName}. Description: ${lmDesc}. User language: English.`;
            } else if (currentLanguage === 'fr') {
              context = `L'utilisateur se trouve actuellement à: ${lmName}. Description: ${lmDesc}. Langue: Français.`;
            } else if (currentLanguage === 'es') {
              context = `El usuario se encuentra actualmente en: ${lmName}. Descripción: ${lmDesc}. Idioma: Español.`;
            }
        }
      }

      // 4. استدعاء ai.js
      if (typeof callOpenRouterAI === 'function') {
        const response = await callOpenRouterAI(text, context);
        removeTypingIndicator(); // <-- إخفاء النقاط هنا
        addBotMessage(response, false);
      } else {
         removeTypingIndicator();
         addBotMessage(getTranslation('ai_offline'), false);
      }
    } catch (error) {
      console.error(error);
      removeTypingIndicator();
      addBotMessage(getTranslation('ai_error'), false);
    } finally {
      // 5. إعادة التفعيل
      userInput.disabled = false;
      sendBtn.disabled = false;
      userInput.placeholder = getTranslation('landmark_prompt');
      userInput.focus();
    }
  });

  // حدث الإرسال (زر Enter)
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });

  // Expose necessary to global for legacy calls
  window.currentLanguage = currentLanguage; // initial value
  window.landmarksData = landmarksData;
  window.addBotMessage = addBotMessage;
  window.getTranslation = getTranslation;
  window.displayLandmarkById = displayLandmarkById; // مفيدة للاختبار من الـ Console
  window.getCurrentLanguage = function() { return currentLanguage; }; // getter for current language
  
  // Update global language reference whenever it changes
  window.updateGlobalLanguage = function(lang) {
    currentLanguage = lang;
    window.currentLanguage = lang;
  };
})();