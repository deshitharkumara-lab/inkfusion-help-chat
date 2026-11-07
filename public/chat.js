"use strict";
// iNK Fusion Breakdown Help — customer chat.
// Guided flow (buttons) works without AI. Typed messages and translations use the AI when available.

/* ===================== interface text ===================== */
// Sinhala, Tamil and Singlish text: please have a native speaker check before public launch.
const T = {
  en: {
    greet: "Hello! 👋 I'm the iNK Fusion breakdown helper. I'll guide you step by step.",
    chooseLang: "Please choose your language:",
    chooseMachine: "Which machine has the problem?",
    m_dtf: "DTF printer", m_epson: "Epson printer", m_sublimation: "Large-format sublimation printer", m_heatpress: "Heat press",
    machineSet: "Machine: {m}",
    askModel: "Do you know the model? Type it below (for example L1800), or tap Skip.",
    skip: "Skip",
    askWarranty: "Is the machine under warranty?",
    yes: "Yes", no: "No", notSure: "Not sure",
    askProblem: "What is the problem? Tap one, or type it in your own words. You can also send a photo 📷.",
    otherProblem: "✍️ Something else (type below)",
    typeBelow: "Please type the problem in the box below.",
    noGuides: "I don't have approved fixes for this machine yet.",
    safety: "Safety first",
    step: "Step {n} of {t}",
    didItWork: "Did that work?",
    fixedBtn: "✅ Yes, it works now",
    nextBtn: "❌ No, still a problem",
    helpBtn: "🙋 Talk to iNK Fusion",
    stopIf: "Stop and ask for help if:",
    fixed: "Great, I'm glad it's working! 🎉",
    tip: "Tip to stop it happening again:",
    thanks: "Thank you for using iNK Fusion help.",
    startAgain: "🔄 Start again",
    escalate: "Let's get you help from iNK Fusion.",
    stepsDone: "We tried the basic steps and it is still not fixed. This needs our technician.",
    call: "📞 Call iNK Fusion ({n})",
    closed: "We're closed now (Mon–Sat, 9 AM–6 PM). Request a technician and we'll contact you.",
    requestTech: "🛠️ Request a technician",
    formTitle: "Technician request",
    name: "Your name", phone: "Phone number", town: "Town / district", model: "Machine model (if known)",
    photo: "Photo of the problem (optional)", addPhoto: "📷 Add photo", photoAdded: "Photo added ✅",
    chargeable: "I understand technician visits are chargeable.",
    submit: "Send request", sending: "Sending…",
    sent: "Thank you! Your request was sent. iNK Fusion will contact you soon.",
    aiDown: "Sorry, I can't read typed messages right now. Please use the buttons, or get help below.",
    typeHere: "Type here…",
    photoReceived: "Photo received. We'll attach it if you request a technician.",
    uploadFail: "The photo could not be sent. Please try again.",
    error: "Something went wrong. Please try again, or call us.",
    privacy: "We save this chat, your phone number and photos to help you. We delete them after 24 months.",
    watchVideo: "▶️ Watch the video",
    answerOrSkip: "Type your answer below, or tap Skip.",
    notTranslated: "(Showing English — translation not available right now.)",
    thinking: "Typing…",
    fillAll: "Please fill in your name, phone and town, and tick the box.",
    subtitle: "Breakdown help",
    callShort: "📞 Call",
  },
  si: {
    greet: "ආයුබෝවන්! 👋 මම iNK Fusion බිඳවැටීම් සහායකයා. මම ඔබට පියවරෙන් පියවර උදව් කරන්නම්.",
    chooseLang: "ඔබේ භාෂාව තෝරන්න:",
    chooseMachine: "ගැටලුව තියෙන්නේ කුමන යන්ත්‍රයේද?",
    m_dtf: "DTF ප්‍රින්ටරය", m_epson: "Epson ප්‍රින්ටරය", m_sublimation: "විශාල Sublimation ප්‍රින්ටරය", m_heatpress: "හීට් ප්‍රෙස් (Heat press)",
    machineSet: "යන්ත්‍රය: {m}",
    askModel: "මොඩලය දන්නවාද? පහතින් ටයිප් කරන්න (උදා: L1800), නැත්නම් මඟ හරින්න.",
    skip: "මඟ හරින්න",
    askWarranty: "යන්ත්‍රය වගකීම් (warranty) කාලය තුළද?",
    yes: "ඔව්", no: "නැත", notSure: "විශ්වාස නැත",
    askProblem: "ගැටලුව කුමක්ද? එකක් තෝරන්න, නැත්නම් ඔබේම වචනවලින් ටයිප් කරන්න. ඡායාරූපයක් 📷 ද එවිය හැක.",
    otherProblem: "✍️ වෙනත් ගැටලුවක් (පහතින් ටයිප් කරන්න)",
    typeBelow: "කරුණාකර ගැටලුව පහත කොටුවේ ටයිප් කරන්න.",
    noGuides: "මෙම යන්ත්‍රය සඳහා අනුමත විසඳුම් තවම නැත.",
    safety: "ආරක්ෂාව මුලින්ම",
    step: "පියවර {n} / {t}",
    didItWork: "එය සාර්ථකද?",
    fixedBtn: "✅ ඔව්, දැන් හරි",
    nextBtn: "❌ නැත, තවමත් ගැටලුව තියෙනවා",
    helpBtn: "🙋 iNK Fusion සමඟ කතා කරන්න",
    stopIf: "මේවා සිදුවුවහොත් නවතා උදව් ඉල්ලන්න:",
    fixed: "නියමයි, දැන් හරි! 🎉",
    tip: "නැවත සිදු නොවීමට උපදෙස:",
    thanks: "iNK Fusion සහාය භාවිතා කළාට ස්තූතියි.",
    startAgain: "🔄 නැවත අරඹන්න",
    escalate: "iNK Fusion වෙතින් ඔබට උදව් ලබා දෙමු.",
    stepsDone: "මූලික පියවර සියල්ල උත්සාහ කළත් තවමත් හරි නැත. මේ සඳහා අපගේ තාක්ෂණ ශිල්පියෙක් අවශ්‍යයි.",
    call: "📞 iNK Fusion අමතන්න ({n})",
    closed: "අපි දැන් වසා ඇත (සඳුදා–සෙනසුරාදා, පෙ.ව. 9 – ප.ව. 6). තාක්ෂණ ශිල්පියෙක් ඉල්ලන්න, අපි ඔබව සම්බන්ධ කරගන්නම්.",
    requestTech: "🛠️ තාක්ෂණ ශිල්පියෙක් ඉල්ලන්න",
    formTitle: "තාක්ෂණ ශිල්පී ඉල්ලීම",
    name: "ඔබේ නම", phone: "දුරකථන අංකය", town: "නගරය / දිස්ත්‍රික්කය", model: "යන්ත්‍රයේ මොඩලය (දන්නේ නම්)",
    photo: "ගැටලුවේ ඡායාරූපය (අවශ්‍ය නම්)", addPhoto: "📷 ඡායාරූපය එක් කරන්න", photoAdded: "ඡායාරූපය එක් කළා ✅",
    chargeable: "තාක්ෂණ ශිල්පී පැමිණීම් සඳහා ගාස්තු අය කරන බව මම තේරුම් ගනිමි.",
    submit: "ඉල්ලීම යවන්න", sending: "යවමින්…",
    sent: "ස්තූතියි! ඔබේ ඉල්ලීම යැව්වා. iNK Fusion ඉක්මනින් ඔබව සම්බන්ධ කරගනීවි.",
    aiDown: "සමාවන්න, දැන් ටයිප් කළ පණිවිඩ කියවිය නොහැක. බොත්තම් භාවිතා කරන්න, නැත්නම් පහතින් උදව් ලබාගන්න.",
    typeHere: "මෙහි ටයිප් කරන්න…",
    photoReceived: "ඡායාරූපය ලැබුණා. තාක්ෂණ ශිල්පියෙක් ඉල්ලුවොත් එය එක් කරන්නම්.",
    uploadFail: "ඡායාරූපය යැවිය නොහැකි විය. නැවත උත්සාහ කරන්න.",
    error: "යම් දෝෂයක් සිදුවුණා. නැවත උත්සාහ කරන්න, නැත්නම් අපව අමතන්න.",
    privacy: "ඔබට උදව් කිරීමට මෙම chat එක, ඔබේ දුරකථන අංකය සහ ඡායාරූප සුරකිනු ලැබේ. මාස 24කට පසු ඒවා මකා දමනු ලැබේ.",
    watchVideo: "▶️ වීඩියෝව බලන්න",
    answerOrSkip: "ඔබේ පිළිතුර පහතින් ටයිප් කරන්න, නැත්නම් මඟ හරින්න.",
    notTranslated: "(දැනට පරිවර්තනය නොමැති නිසා ඉංග්‍රීසියෙන් පෙන්වයි.)",
    thinking: "ටයිප් කරමින්…",
    fillAll: "කරුණාකර නම, දුරකථන අංකය සහ නගරය ඇතුළත් කර කොටුව සලකුණු කරන්න.",
    subtitle: "බිඳවැටීම් සහාය",
    callShort: "📞 අමතන්න",
  },
  ta: {
    greet: "வணக்கம்! 👋 நான் iNK Fusion பழுது உதவியாளர். படிப்படியாக உங்களுக்கு வழிகாட்டுகிறேன்.",
    chooseLang: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்:",
    chooseMachine: "எந்த இயந்திரத்தில் பிரச்சனை உள்ளது?",
    m_dtf: "DTF பிரிண்டர்", m_epson: "Epson பிரிண்டர்", m_sublimation: "பெரிய Sublimation பிரிண்டர்", m_heatpress: "ஹீட் பிரஸ் (Heat press)",
    machineSet: "இயந்திரம்: {m}",
    askModel: "மாடல் தெரியுமா? கீழே தட்டச்சு செய்யவும் (எ.கா. L1800), அல்லது தவிர்க்கவும்.",
    skip: "தவிர்",
    askWarranty: "இயந்திரம் உத்தரவாதக் காலத்தில் (warranty) உள்ளதா?",
    yes: "ஆம்", no: "இல்லை", notSure: "தெரியவில்லை",
    askProblem: "என்ன பிரச்சனை? ஒன்றைத் தேர்ந்தெடுக்கவும், அல்லது உங்கள் சொந்த வார்த்தைகளில் தட்டச்சு செய்யவும். புகைப்படமும் 📷 அனுப்பலாம்.",
    otherProblem: "✍️ வேறு பிரச்சனை (கீழே தட்டச்சு செய்யவும்)",
    typeBelow: "பிரச்சனையைக் கீழே உள்ள பெட்டியில் தட்டச்சு செய்யவும்.",
    noGuides: "இந்த இயந்திரத்திற்கு அங்கீகரிக்கப்பட்ட தீர்வுகள் இன்னும் இல்லை.",
    safety: "முதலில் பாதுகாப்பு",
    step: "படி {n} / {t}",
    didItWork: "அது சரியாகிவிட்டதா?",
    fixedBtn: "✅ ஆம், இப்போது சரி",
    nextBtn: "❌ இல்லை, இன்னும் பிரச்சனை",
    helpBtn: "🙋 iNK Fusion உடன் பேசுங்கள்",
    stopIf: "இவை நடந்தால் நிறுத்தி உதவி கேளுங்கள்:",
    fixed: "அருமை, இப்போது வேலை செய்கிறது! 🎉",
    tip: "மீண்டும் நடக்காமல் இருக்க குறிப்பு:",
    thanks: "iNK Fusion உதவியைப் பயன்படுத்தியதற்கு நன்றி.",
    startAgain: "🔄 மீண்டும் தொடங்கு",
    escalate: "iNK Fusion இடமிருந்து உங்களுக்கு உதவி பெறுவோம்.",
    stepsDone: "அடிப்படை படிகளை முயற்சித்தும் இன்னும் சரியாகவில்லை. இதற்கு எங்கள் தொழில்நுட்ப வல்லுநர் தேவை.",
    call: "📞 iNK Fusion ஐ அழைக்கவும் ({n})",
    closed: "நாங்கள் இப்போது மூடியுள்ளோம் (திங்கள்–சனி, காலை 9 – மாலை 6). தொழில்நுட்ப வல்லுநரைக் கோருங்கள், நாங்கள் உங்களைத் தொடர்புகொள்வோம்.",
    requestTech: "🛠️ தொழில்நுட்ப வல்லுநரைக் கோருங்கள்",
    formTitle: "தொழில்நுட்ப வல்லுநர் கோரிக்கை",
    name: "உங்கள் பெயர்", phone: "தொலைபேசி எண்", town: "நகரம் / மாவட்டம்", model: "இயந்திர மாடல் (தெரிந்தால்)",
    photo: "பிரச்சனையின் புகைப்படம் (விருப்பம்)", addPhoto: "📷 புகைப்படம் சேர்க்கவும்", photoAdded: "புகைப்படம் சேர்க்கப்பட்டது ✅",
    chargeable: "தொழில்நுட்ப வல்லுநர் வருகைக்கு கட்டணம் உண்டு என்பதை நான் புரிந்துகொள்கிறேன்.",
    submit: "கோரிக்கையை அனுப்பு", sending: "அனுப்புகிறது…",
    sent: "நன்றி! உங்கள் கோரிக்கை அனுப்பப்பட்டது. iNK Fusion விரைவில் உங்களைத் தொடர்புகொள்ளும்.",
    aiDown: "மன்னிக்கவும், இப்போது தட்டச்சு செய்த செய்திகளைப் படிக்க முடியவில்லை. பொத்தான்களைப் பயன்படுத்தவும், அல்லது கீழே உதவி பெறவும்.",
    typeHere: "இங்கே தட்டச்சு செய்யவும்…",
    photoReceived: "புகைப்படம் கிடைத்தது. தொழில்நுட்ப வல்லுநரைக் கோரினால் அதை இணைப்போம்.",
    uploadFail: "புகைப்படத்தை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    error: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும், அல்லது எங்களை அழைக்கவும்.",
    privacy: "உங்களுக்கு உதவ இந்த உரையாடல், உங்கள் தொலைபேசி எண் மற்றும் புகைப்படங்களைச் சேமிக்கிறோம். 24 மாதங்களுக்குப் பிறகு அவற்றை நீக்குவோம்.",
    watchVideo: "▶️ வீடியோவைப் பாருங்கள்",
    answerOrSkip: "உங்கள் பதிலைக் கீழே தட்டச்சு செய்யவும், அல்லது தவிர்க்கவும்.",
    notTranslated: "(இப்போது மொழிபெயர்ப்பு இல்லை — ஆங்கிலத்தில் காட்டப்படுகிறது.)",
    thinking: "தட்டச்சு செய்கிறது…",
    fillAll: "பெயர், தொலைபேசி எண், நகரம் ஆகியவற்றை நிரப்பி, பெட்டியைத் தேர்வு செய்யவும்.",
    subtitle: "பழுது உதவி",
    callShort: "📞 அழைக்க",
  },
  singlish: {
    greet: "Ayubowan! 👋 Mama iNK Fusion breakdown helper. Mama oyata step by step help karannam.",
    chooseLang: "Please choose your language:",
    chooseMachine: "Mona machine eke da prashne thiyenne?",
    m_dtf: "DTF printer", m_epson: "Epson printer", m_sublimation: "Large-format sublimation printer", m_heatpress: "Heat press",
    machineSet: "Machine: {m}",
    askModel: "Model eka dannawada? Pahala type karanna (e.g. L1800), nathnam Skip karanna.",
    skip: "Skip",
    askWarranty: "Machine eka warranty eke thiyenawada?",
    yes: "Ow", no: "Na", notSure: "Danne na",
    askProblem: "Mokakda prashne? Ekak select karanna, nathnam oyage wachana walin type karanna. Photo ekakuth 📷 ewanna puluwan.",
    otherProblem: "✍️ Wena prashnayak (pahala type karanna)",
    typeBelow: "Prashne pahala box eke type karanna.",
    noGuides: "Me machine ekata approved fixes thama na.",
    safety: "Safety mulinma",
    step: "Step {n} / {t}",
    didItWork: "Eka hari giyada?",
    fixedBtn: "✅ Ow, dan hari",
    nextBtn: "❌ Na, thama prashne",
    helpBtn: "🙋 iNK Fusion ekka katha karanna",
    stopIf: "Mewa unoth nawaththala help illanna:",
    fixed: "Niyamai, dan hari! 🎉",
    tip: "Ayeth wenne nathi wenna tip eka:",
    thanks: "iNK Fusion help use karata sthuthi.",
    startAgain: "🔄 Aye patan ganna",
    escalate: "iNK Fusion walin oyata help ekak ganna.",
    stepsDone: "Basic steps okkoma try kalath thama hari na. Meekata apey technician kenek ona.",
    call: "📞 iNK Fusion call karanna ({n})",
    closed: "Api dan close (Mon–Sat, 9 AM–6 PM). Technician kenek request karanna, api oyawa contact karannam.",
    requestTech: "🛠️ Technician kenek request karanna",
    formTitle: "Technician request",
    name: "Oyage nama", phone: "Phone number", town: "Town / district", model: "Machine model (dannawanam)",
    photo: "Prashne photo eka (optional)", addPhoto: "📷 Photo add karanna", photoAdded: "Photo add kala ✅",
    chargeable: "Technician visit ekata charge karana bawa mata therenawa.",
    submit: "Request eka yawanna", sending: "Yawanawa…",
    sent: "Sthuthi! Oyage request eka yewwa. iNK Fusion ikmanata oyawa contact karai.",
    aiDown: "Sorry, dan type karana messages kiyawanna ba. Buttons use karanna, nathnam pahalin help ganna.",
    typeHere: "Methana type karanna…",
    photoReceived: "Photo eka labuna. Technician kenek request kaloth eka attach karannam.",
    uploadFail: "Photo eka yawanna bari una. Ayeth try karanna.",
    error: "Monawa hari waraddak una. Ayeth try karanna, nathnam apita call karanna.",
    privacy: "Oyata help karanna me chat eka, phone number eka saha photos save karanawa. Masa 24kata passe delete karanawa.",
    watchVideo: "▶️ Video eka balanna",
    answerOrSkip: "Oyage uththaraya pahala type karanna, nathnam Skip karanna.",
    notTranslated: "(Dan translation na — English walin pennanawa.)",
    thinking: "Type karanawa…",
    fillAll: "Nama, phone number, town fill karala box eka tick karanna.",
    subtitle: "Breakdown help",
    callShort: "📞 Call",
  },
};
const MACHINES = ["dtf", "epson", "sublimation", "heatpress"];
const LANG_BUTTONS = [["en", "English"], ["si", "සිංහල"], ["ta", "தமிழ்"], ["singlish", "Singlish"]];

/* ===================== state ===================== */
const S = {
  lang: "en",
  config: { open: false, callNumber: "", callDisplay: "" },
  chatId: null,
  machine: null,
  model: "",
  warranty: "",
  phase: "lang", // lang | machine | model | warranty | problem | askFirst | steps | done | escalated
  guide: null,
  stepIdx: 0,
  askIdx: 0,
  stepsTried: [],
  photoKey: null,
  transcript: [], // {from, text, at}
  history: [], // AI context {role, text}
  aiDown: false,
};
const t = (k, vars) => {
  let s = (T[S.lang] && T[S.lang][k]) || T.en[k] || k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
  return s;
};

/* ===================== DOM helpers ===================== */
const $log = document.getElementById("log");
const $text = document.getElementById("text");
const $form = document.getElementById("composer");
const $photoBtn = document.getElementById("photoBtn");
const $photoInput = document.getElementById("photoInput");

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
function scroll() {
  requestAnimationFrame(() => ($log.scrollTop = $log.scrollHeight));
}
function log(from, text) {
  S.transcript.push({ from, text, at: new Date().toISOString() });
  if (from === "user" || from === "bot") S.history.push({ role: from === "user" ? "user" : "assistant", text });
  save();
}
function bot(text, cls = "", extra) {
  const m = el("div", { class: `msg bot ${cls}` }, text, extra);
  $log.append(m);
  log("bot", text);
  scroll();
  return m;
}
function user(text) {
  $log.append(el("div", { class: "msg user" }, text));
  log("user", text);
  scroll();
}
function note(text) {
  $log.append(el("div", { class: "note" }, text));
  scroll();
}
/** Buttons: [{label, cls, onClick, href}] — one tap disables the group. */
function choices(items, stack = false) {
  const box = el("div", { class: "choices" + (stack ? " stack" : "") });
  for (const it of items) {
    if (it.href) {
      box.append(el("a", { class: `btn ${it.cls || ""}`, href: it.href }, it.label));
      continue;
    }
    const b = el("button", { type: "button", class: `btn ${it.cls || ""}` }, it.label);
    b.addEventListener("click", () => {
      if (!it.keep) box.querySelectorAll("button").forEach((x) => (x.disabled = true));
      b.classList.add("chosen");
      it.onClick();
    });
    box.append(b);
  }
  $log.append(box);
  scroll();
  return box;
}
let typingEl = null;
function typing(on) {
  if (on && !typingEl) {
    typingEl = el("div", { class: "typing" }, t("thinking"));
    $log.append(typingEl);
    scroll();
  } else if (!on && typingEl) {
    typingEl.remove();
    typingEl = null;
  }
}

/* ===================== server calls ===================== */
async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "error"), { data });
  return data;
}
let saveTimer = null;
function save(extra = {}) {
  if (!S.chatId) return;
  clearTimeout(saveTimer);
  const body = {
    machine: S.machine, model: S.model, warranty: S.warranty, lang: S.lang,
    guide_id: S.guide ? S.guide.id : null, transcript: S.transcript, ...extra,
  };
  const go = () => api(`/api/chat/${S.chatId}/save`, body).catch(() => {});
  if (extra.outcome) go();
  else saveTimer = setTimeout(go, 800);
}

/* ===================== flow ===================== */
function applyLangUi() {
  document.documentElement.lang = S.lang === "singlish" ? "en" : S.lang;
  $text.placeholder = t("typeHere");
  document.getElementById("subtitle").textContent = t("subtitle");
  document.getElementById("privacy").textContent = t("privacy");
  const top = document.getElementById("callTop");
  top.textContent = t("callShort");
}

function start() {
  $log.textContent = "";
  Object.assign(S, { phase: "lang", guide: null, stepIdx: 0, askIdx: 0, stepsTried: [], transcript: [], history: [], chatId: null, model: "", warranty: "" });
  S.machine = MACHINES.includes(new URLSearchParams(location.search).get("machine")) ? new URLSearchParams(location.search).get("machine") : null;
  applyLangUi();
  bot(T.en.greet);
  bot(T.en.chooseLang);
  choices(LANG_BUTTONS.map(([code, label]) => ({ label, onClick: () => chooseLang(code, label) })));
}

async function chooseLang(code, label) {
  S.lang = code;
  applyLangUi();
  user(label);
  try {
    S.chatId = (await api("/api/chat/start", { machine: S.machine, lang: S.lang })).id;
  } catch {
    /* chat still works without saving */
  }
  if (S.lang !== "en") bot(t("greet"));
  if (S.machine) {
    bot(t("machineSet", { m: t("m_" + S.machine) }));
    askModel();
  } else askMachine();
}

function askMachine() {
  S.phase = "machine";
  bot(t("chooseMachine"));
  choices(MACHINES.map((m) => ({ label: t("m_" + m), onClick: () => { S.machine = m; user(t("m_" + m)); askModel(); } })), true);
}

function askModel() {
  S.phase = "model";
  bot(t("askModel"));
  S.modelChoices = choices([{ label: t("skip"), cls: "ghost", onClick: () => { user(t("skip")); askWarranty(); } }]);
  $text.focus();
}

function askWarranty() {
  S.phase = "warranty";
  bot(t("askWarranty"));
  const pick = (v, label) => { S.warranty = v; user(label); askProblem(); };
  choices([
    { label: t("yes"), onClick: () => pick("yes", t("yes")) },
    { label: t("no"), onClick: () => pick("no", t("no")) },
    { label: t("notSure"), onClick: () => pick("not sure", t("notSure")) },
  ]);
}

async function askProblem() {
  S.phase = "problem";
  typing(true);
  let data = { problems: [] };
  try {
    data = await api(`/api/problems?machine=${S.machine}&lang=${S.lang}`);
  } catch {
    /* show escalate options below */
  }
  typing(false);
  bot(t("askProblem"));
  if (!data.translated && S.lang !== "en") note(t("notTranslated"));
  if (!data.problems.length) {
    bot(t("noGuides"));
    escalate();
    return;
  }
  choices(
    [
      ...data.problems.map((p) => ({ label: p.problem, onClick: () => { user(p.problem); startGuide(p.id); } })),
      { label: t("otherProblem"), cls: "ghost", keep: true, onClick: () => { bot(t("typeBelow")); $text.focus(); } },
    ],
    true,
  );
}

async function startGuide(id) {
  typing(true);
  try {
    S.guide = await api(`/api/guide/${encodeURIComponent(id)}?lang=${S.lang}`);
  } catch {
    typing(false);
    bot(t("error"));
    escalate();
    return;
  }
  typing(false);
  if (!S.guide.translated && S.lang !== "en") note(t("notTranslated"));
  S.stepIdx = 0;
  S.askIdx = 0;
  save();
  nextAskFirst();
}

function nextAskFirst() {
  const qs = S.guide.ask_first || [];
  if (S.askIdx < qs.length) {
    S.phase = "askFirst";
    bot(qs[S.askIdx]);
    note(t("answerOrSkip"));
    S.askChoices = choices([{ label: t("skip"), cls: "ghost", onClick: () => { user(t("skip")); S.askIdx++; nextAskFirst(); } }]);
    $text.focus();
    return;
  }
  showSafety();
}

function showSafety() {
  const g = S.guide;
  if (g.safety) {
    const m = bot(g.safety, "safety");
    m.prepend(el("span", { class: "step-no" }, "⚠️ " + t("safety")));
  }
  if (g.escalate_if && g.escalate_if.length) {
    const m = el("div", { class: "msg bot" }, t("stopIf"), el("ul", {}, g.escalate_if.map((x) => el("li", {}, x))));
    $log.append(m);
    log("bot", t("stopIf") + " " + g.escalate_if.join("; "));
  }
  showStep();
}

function mediaEl(url) {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/.test(url)) return el("div", { class: "choices" }, el("a", { class: "btn", href: url, target: "_blank", rel: "noopener" }, t("watchVideo")));
  if (/\.(mp4|webm)$/i.test(url)) return el("video", { src: url, controls: true, preload: "none", playsinline: true });
  if (/\.(jpe?g|png|webp)$/i.test(url)) return el("img", { class: "media", src: url, alt: "", loading: "lazy" });
  return el("div", { class: "choices" }, el("a", { class: "btn", href: url, target: "_blank", rel: "noopener" }, t("watchVideo")));
}

function showStep() {
  S.phase = "steps";
  const g = S.guide;
  const s = g.steps[S.stepIdx];
  const m = bot(s.text, "", mediaEl(s.media));
  m.prepend(el("span", { class: "step-no" }, t("step", { n: S.stepIdx + 1, t: g.steps.length })));
  bot(t("didItWork"));
  choices([
    { label: t("fixedBtn"), cls: "yes", onClick: () => { user(t("fixedBtn")); S.stepsTried.push(`${S.stepIdx + 1}. ${s.text} → fixed`); fixed(); } },
    { label: t("nextBtn"), cls: "no", onClick: () => {
      user(t("nextBtn"));
      S.stepsTried.push(`${S.stepIdx + 1}. ${s.text} → not fixed`);
      S.stepIdx++;
      if (S.stepIdx < g.steps.length) showStep();
      else { bot(t("stepsDone")); escalate(); }
    } },
    { label: t("helpBtn"), cls: "ghost", onClick: () => { user(t("helpBtn")); escalate(); } },
  ], true);
}

function fixed() {
  S.phase = "done";
  bot(t("fixed"), "ok");
  if (S.guide && S.guide.prevention_tip) bot(`💡 ${t("tip")}\n${S.guide.prevention_tip}`);
  bot(t("thanks"));
  save({ outcome: "fixed" });
  choices([{ label: t("startAgain"), cls: "ghost", onClick: start }]);
}

function escalate() {
  if (S.phase === "escalated") return;
  S.phase = "escalated";
  bot(t("escalate"));
  const items = [];
  if (S.config.open) items.push({ label: t("call", { n: S.config.callDisplay }), cls: "primary", href: `tel:${S.config.callNumber}` });
  else bot(t("closed"));
  items.push({ label: t("requestTech"), cls: S.config.open ? "" : "primary", keep: true, onClick: techForm });
  choices(items, true);
}

/* ===================== technician form ===================== */
function techForm() {
  if (document.getElementById("techForm")) return document.getElementById("techForm").scrollIntoView();
  const err = el("div", { class: "err", role: "alert" });
  const photoState = el("span", {}, S.photoKey ? t("photoAdded") : "");
  const f = el("form", { class: "card", id: "techForm" },
    el("strong", {}, t("formTitle")),
    el("label", { for: "f_name" }, t("name")), el("input", { type: "text", id: "f_name", autocomplete: "name", required: true, maxlength: 100 }),
    el("label", { for: "f_phone" }, t("phone")), el("input", { type: "tel", id: "f_phone", autocomplete: "tel", inputmode: "tel", required: true, maxlength: 20, placeholder: "07X XXX XXXX" }),
    el("label", { for: "f_town" }, t("town")), el("input", { type: "text", id: "f_town", required: true, maxlength: 100 }),
    el("label", { for: "f_model" }, t("model")), el("input", { type: "text", id: "f_model", maxlength: 100, value: S.model }),
    el("label", {}, t("photo")),
    el("div", { class: "choices" }, el("button", { type: "button", class: "btn ghost", onclick: () => $photoInput.click() }, t("addPhoto")), photoState),
    el("label", { class: "check" }, el("input", { type: "checkbox", id: "f_ack" }), el("span", {}, t("chargeable"))),
    err,
    el("button", { type: "submit", class: "btn primary" }, t("submit")),
  );
  S.photoStateEl = photoState;
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value.trim();
    if (!v("f_name") || !v("f_phone") || !v("f_town") || !document.getElementById("f_ack").checked) {
      err.textContent = t("fillAll");
      return;
    }
    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = t("sending");
    err.textContent = "";
    const firstUser = S.transcript.find((x) => x.from === "user" && x.text.length > 15);
    try {
      await api("/api/tech-request", {
        chat_id: S.chatId, name: v("f_name"), phone: v("f_phone"), town: v("f_town"),
        machine: S.machine, model: v("f_model") || S.model, warranty: S.warranty,
        summary: S.guide ? S.guide.problem : firstUser ? firstUser.text : "(see chat)",
        steps_tried: S.stepsTried.join("\n"), photo_key: S.photoKey, chargeable_ack: true,
      });
      f.remove();
      bot(t("sent"), "ok");
      save({ outcome: "escalated" });
      choices([{ label: t("startAgain"), cls: "ghost", onClick: start }]);
    } catch (ex) {
      err.textContent = ex.message && ex.message !== "error" ? ex.message : t("error");
      btn.disabled = false;
      btn.textContent = t("submit");
    }
  });
  $log.append(f);
  scroll();
  document.getElementById("f_name").focus();
}

/* ===================== typing and photos ===================== */
$form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $text.value.trim();
  if (!text) return;
  $text.value = "";
  if (S.phase === "lang") return chooseLang("en", "English").then(() => handleText(text));
  user(text);
  if (S.phase === "model") {
    S.model = text.slice(0, 100);
    S.modelChoices && S.modelChoices.querySelectorAll("button").forEach((b) => (b.disabled = true));
    return askWarranty();
  }
  if (S.phase === "askFirst") {
    S.askChoices && S.askChoices.querySelectorAll("button").forEach((b) => (b.disabled = true));
    S.askIdx++;
    return nextAskFirst();
  }
  handleText(text, true);
});

async function handleText(text, alreadyShown) {
  if (!alreadyShown) user(text);
  if (S.aiDown) return aiUnavailable();
  typing(true);
  let ans;
  try {
    ans = await api(`/api/chat/${S.chatId || "none"}/message`, {
      text, lang: S.lang, machine: S.machine, guide_id: S.guide ? S.guide.id : null,
      step: S.phase === "steps" ? S.stepIdx : null, history: S.history.slice(0, -1).slice(-12),
    });
  } catch {
    ans = { unavailable: "error" };
  }
  typing(false);
  if (ans.unavailable) return aiUnavailable(ans.unavailable);
  if (ans.language && ans.language !== S.lang && T[ans.language]) {
    S.lang = ans.language;
    applyLangUi();
  }
  bot(ans.reply);
  if (ans.action === "start_guide" && ans.guide_id) startGuide(ans.guide_id);
  else if (ans.action === "escalate") escalate();
}

function aiUnavailable(reason) {
  if (reason === "no_key" || reason === "daily_cap") S.aiDown = true;
  bot(t("aiDown"));
  S.phase = "ai-down"; // always show the call / technician options again
  escalate();
}

$photoBtn.addEventListener("click", () => $photoInput.click());
$photoInput.addEventListener("change", async () => {
  const file = $photoInput.files[0];
  $photoInput.value = "";
  if (!file) return;
  const preview = el("div", { class: "msg user" }, el("img", { class: "photo", src: URL.createObjectURL(file), alt: "Photo" }));
  $log.append(preview);
  scroll();
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    S.photoKey = data.key;
    log("user", `[photo: ${data.key}]`);
    if (S.photoStateEl) S.photoStateEl.textContent = t("photoAdded");
    else bot(t("photoReceived"));
  } catch (ex) {
    preview.remove();
    bot(ex.message || t("uploadFail"));
  }
});

/* ===================== boot ===================== */
(async function boot() {
  try {
    S.config = await api("/api/config");
  } catch {
    /* offline: buttons still show */
  }
  const top = document.getElementById("callTop");
  if (S.config.open && S.config.callNumber) {
    top.href = `tel:${S.config.callNumber}`;
    top.hidden = false;
  }
  start();
})();
