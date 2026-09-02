export type Locale = "fr" | "ar";

export const SERVICE_IDS = ["fast", "crm", "erp", "ai"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export const SERVICES = SERVICE_IDS.map((id, index) => ({
  id,
  num: String(index + 1).padStart(2, "0"),
  short: id === "fast" ? "FAST" : id === "ai" ? "AI" : id.toUpperCase(),
}));

export function serviceFromParam(value: string | null) {
  if (!value) return "";
  const id = value.toLowerCase();
  return SERVICE_IDS.includes(id as ServiceId) ? id : "";
}

type ServiceCopy = {
  name: string;
  tag: string;
  promise: string;
  fit: string;
  price: string;
  timing: string;
  points: [string, string, string];
};

export type Copy = {
  metaTitle: string;
  metaDescription: string;
  skip: string;
  nav: { services: string; process: string; about: string; work: string; book: string; menu: string };
  hero: { title: string; lede: string; seeOffers: string };
  why: { mark: string; title: string; lead: string };
  offers: { mark: string; title: string; lead: string; choose: string };
  process: {
    mark: string;
    title: string;
    steps: [{ title: string; text: string }, { title: string; text: string }, { title: string; text: string }];
  };
  pricing: { mark: string; title: string; lead: string };
  about: { mark: string; title: string; bio: string; creds: [string, string, string, string]; linkedin: string };
  work: {
    mark: string;
    title: string;
    cta: string;
    items: [{ name: string; kind: string; text: string }, { name: string; kind: string; text: string }, { name: string; kind: string; text: string }];
  };
  faq: {
    mark: string;
    title: string;
    items: [{ q: string; a: string }, { q: string; a: string }, { q: string; a: string }, { q: string; a: string }, { q: string; a: string }];
  };
  start: { mark: string; title: string; lead: string; book: string; whatsapp: string };
  form: {
    eyebrow: string;
    title: string;
    sub: string;
    name: string;
    namePh: string;
    business: string;
    businessPh: string;
    service: string;
    select: string;
    mix: string;
    phone: string;
    email: string;
    city: string;
    cityPh: string;
    type: string;
    need: string;
    optional: string;
    needPh: string;
    submit: string;
    saving: string;
    micro: string;
    successTitle: string;
    successBody: string;
    successLink: string;
    missingEnv: string;
    fail: string;
  };
  types: string[];
  services: Record<ServiceId, ServiceCopy>;
  footer: { blurb: string; contact: string; rights: string; inbox: string };
  sticky: { label: string; book: string };
  waIntro: string;
};

export const copy: Record<Locale, Copy> = {
  fr: {
    metaTitle: "Pluss.dev — Sites Fast, CRM, ERP et IA | Algérie",
    metaDescription: "Systèmes personnalisés : site web Fast, CRM, ERP et IA pour les entreprises en Algérie. Appel gratuit.",
    skip: "Aller au formulaire",
    nav: {
      services: "Offres",
      process: "Parcours",
      about: "À propos",
      work: "Travaux",
      book: "Appel gratuit",
      menu: "Menu",
    },
    hero: {
      title: "Quatre systèmes, autour de votre entreprise.",
      lede: "Site Fast, CRM, ERP et systèmes d’IA. Chacun est personnalisé selon la façon dont vous vendez, opérez et parlez à vos clients.",
      seeOffers: "Voir les offres",
    },
    why: {
      mark: "POURQUOI",
      title: "La plupart des entreprises n’ont pas besoin de plus d’outils. Elles ont besoin de systèmes qui collent.",
      lead: "Pas de vrai site. Clients perdus dans WhatsApp. Stock et factures dans des fichiers séparés. Travail répétitif à la main. Je regarde d’abord votre activité, puis je construis le site Fast, le CRM, l’ERP ou l’IA autour d’elle.",
    },
    offers: {
      mark: "OFFRES",
      title: "Une vue claire de ce que vous pouvez obtenir",
      lead: "Quatre services personnalisés. Prenez-en un, ou combinez-les. Tout part de votre entreprise : votre offre, votre process, votre langue.",
      choose: "Choisir →",
    },
    process: {
      mark: "PARCOURS",
      title: "Le même chemin pour chaque service : votre entreprise d’abord",
      steps: [
        {
          title: "Appel",
          text: "Vous expliquez l’activité : comment vous vendez, ce qui coince, ce que vous voulez faire grandir. Gratuit, sans pression.",
        },
        {
          title: "Construction",
          text: "Site Fast, CRM, ERP, IA — ou un mix. Conçu autour de votre process, pas d’un modèle générique.",
        },
        {
          title: "Lancement",
          text: "Vous obtenez un système à votre taille, dans votre langue, comme vous travaillez déjà.",
        },
      ],
    },
    pricing: {
      mark: "PRIX",
      title: "Fast a un prix fixe. Le reste se calibre avec vous.",
      lead: "CRM, ERP et IA dépendent de votre taille et de votre process. L’appel gratuit sert à décider ce qui entre dans la première version. Aucun paiement juste pour parler.",
    },
    about: {
      mark: "À PROPOS",
      title: "Qui est derrière Pluss.dev",
      bio: "Je suis Mehdi Kernou, fondateur de Pluss.dev — une agence qui construit des apps web, CRM, ERP et systèmes d’IA pour les startups et entreprises en Algérie et au-delà.",
      creds: [
        "Développeur full-stack — React, React Native, Node.js, Supabase",
        "VP, Digital Valley Club · GDG — FinTech, événements tech et leadership",
        "Gagnant de hackathons nationaux — Headway, Business Road, Innov…",
        "Automatisation et prototypage — Figma, n8n, et plus",
      ],
      linkedin: "LinkedIn →",
    },
    work: {
      mark: "TRAVAUX",
      title: "Travaux récents",
      cta: "Voir le portfolio",
      items: [
        {
          name: "Multicampus",
          kind: "FAST + CRM",
          text: "Site d’agence à Béjaïa — tunnel de vente, vitrine de services, CMS et tableau d’admin.",
        },
        {
          name: "Carta",
          kind: "IA + OPS",
          text: "Cartes de fidélité digitales pour cafés, commerces et entreprises algériennes.",
        },
        {
          name: "Systèmes métier",
          kind: "MIX",
          text: "Sites, CRM et outils d’exploitation personnalisés — selon le fonctionnement réel de chaque client.",
        },
      ],
    },
    faq: {
      mark: "FAQ",
      title: "Questions fréquentes",
      items: [
        {
          q: "Dois-je choisir un seul service ?",
          a: "Non. Beaucoup commencent par Fast, puis ajoutent CRM, ERP ou IA. On mappe l’essentiel maintenant vs. plus tard pendant l’appel.",
        },
        {
          q: "Tout est vraiment personnalisé ?",
          a: "Oui. Pages, pipeline, modules et IA partent de votre offre, votre process et votre langue — pas d’un produit copié-collé.",
        },
        {
          q: "Le site Fast est-il vraiment livré en 3 jours ?",
          a: "Oui — une fois l’appel fait et vos éléments reçus (logo, contenus, préférences), le site est en ligne sous 3 jours.",
        },
        {
          q: "Comment sont tarifés CRM, ERP et IA ?",
          a: "Ils se calent sur l’appel, selon la taille et la complexité. Je vous dis clairement ce qui entre dans une première version.",
        },
        {
          q: "Comment je paie ?",
          a: "On confirme les détails à l’appel — aucun paiement n’est demandé juste pour parler.",
        },
      ],
    },
    start: {
      mark: "DÉMARRER",
      title: "Prêt pour un système qui colle vraiment à votre entreprise ?",
      lead: "Réservez un appel gratuit — je vous montre lequel des quatre services vous convient, sans obligation.",
      book: "Appel gratuit",
      whatsapp: "WhatsApp",
    },
    form: {
      eyebrow: "Inscription",
      title: "Dites-moi ce dont vous avez besoin",
      sub: "Choisissez un service. Je vous contacte sur WhatsApp pour caler l’appel.",
      name: "Nom complet",
      namePh: "Votre nom",
      business: "Entreprise",
      businessPh: "Votre société",
      service: "Service",
      select: "Choisir…",
      mix: "Pas sûr / mix",
      phone: "Numéro WhatsApp",
      email: "E-mail",
      city: "Ville",
      cityPh: "Alger, Oran, Béjaïa…",
      type: "Type d’activité",
      need: "Que doit-il faire pour vous ?",
      optional: "(optionnel)",
      needPh: "Comment vous travaillez aujourd’hui, et ce que le système doit gérer…",
      submit: "S’inscrire pour un appel gratuit",
      saving: "Enregistrement…",
      micro: "Pas de paiement maintenant. On voit tout pendant l’appel.",
      successTitle: "C’est noté — à très vite.",
      successBody: "Vos infos sont enregistrées. WhatsApp devrait s’ouvrir avec votre demande. S’il ne s’ouvre pas,",
      successLink: "tapez ici pour m’écrire",
      missingEnv: "Ajoutez l’URL et la clé anon Supabase dans `.env` pour collecter les leads.",
      fail: "Impossible d’enregistrer l’inscription.",
    },
    types: ["Commerce", "Agence / Services", "Restaurant / Café", "Clinique / Profession libérale", "Startup", "Autre"],
    services: {
      fast: {
        name: "Site Fast",
        tag: "3 JOURS",
        promise: "Un site professionnel en ligne en 3 jours — pour qu’on vous trouve et qu’on vous prenne au sérieux.",
        fit: "Personnalisé à votre marque, votre ville, votre offre et votre façon de vendre.",
        price: "32 000 DA",
        timing: "Livraison en 3 jours",
        points: [
          "Domaine .dz, hébergement en Algérie, SSL et e-mail professionnel",
          "Pages mobiles que vous pouvez modifier vous-même",
          "Structure basée sur vos vrais services, pas un modèle générique",
        ],
      },
      crm: {
        name: "CRM",
        tag: "CLIENTS",
        promise: "Un seul système pour clients, relances et ventes — à la place des chats WhatsApp et des carnets éparpillés.",
        fit: "Personnalisé à votre pipeline : étapes, champs et habitudes de suivi que vous utilisez déjà.",
        price: "Sur appel",
        timing: "Calé sur votre process",
        points: [
          "Contacts, deals, notes et rappels au même endroit",
          "Relances alignées sur la façon dont vous concluez (appels, WhatsApp, visites)",
          "Uniquement les modules dont vous avez besoin — commerce, clinique, agence ou équipe commerciale",
        ],
      },
      erp: {
        name: "ERP",
        tag: "OPS",
        promise: "Les opérations dans un seul système : stock, factures, équipe et reporting — à votre taille, pas un outil d’entreprise géant.",
        fit: "Personnalisé à ce que vous faites au quotidien : produits, lieux, équipe et papiers.",
        price: "Sur appel",
        timing: "Calé sur vos opérations",
        points: [
          "Stock, facturation et dossiers internes qui se parlent",
          "Rôles pour vous et votre équipe, sans complexité inutile",
          "Des rapports utiles pour décider, pas des tableaux que personne n’ouvre",
        ],
      },
      ai: {
        name: "Système IA",
        tag: "AUTO",
        promise: "Une IA qui travaille sur votre business : vos produits, votre langue, vos tâches répétitives.",
        fit: "Personnalisée à vos documents, FAQ, ton et au travail que vous voulez enlever de votre assiette.",
        price: "Sur appel",
        timing: "Configurée sur vos données",
        points: [
          "Assistants pour le support, la vente ou les questions internes",
          "Automatisation des relances, documents et routines",
          "Français, arabe ou anglais — calée sur la façon dont votre entreprise parle vraiment",
        ],
      },
    },
    footer: {
      blurb: "Apps web, CRM, ERP et systèmes d’IA — personnalisés pour les entreprises en Algérie et au-delà.",
      contact: "Contact",
      rights: "Tous droits réservés.",
      inbox: "Boîte leads",
    },
    sticky: { label: "FAST · CRM · ERP · IA", book: "Appel gratuit" },
    waIntro: "Salut Mehdi — je veux un système personnalisé pour mon entreprise (site Fast, CRM, ERP ou IA). On peut caler un appel gratuit ?",
  },
  ar: {
    metaTitle: "Pluss.dev — مواقع سريعة، CRM، ERP والذكاء الاصطناعي | الجزائر",
    metaDescription: "أنظمة مخصّصة: موقع سريع، CRM، ERP وذكاء اصطناعي للمؤسسات في الجزائر. مكالمة مجانية.",
    skip: "الانتقال إلى الاستمارة",
    nav: {
      services: "العروض",
      process: "المسار",
      about: "من نحن",
      work: "أعمال",
      book: "مكالمة مجانية",
      menu: "القائمة",
    },
    hero: {
      title: "أربعة أنظمة، حول مؤسستك.",
      lede: "موقع سريع، CRM، ERP وأنظمة ذكاء اصطناعي. كل واحد يُخصَّص حسب طريقة بيعك وتشغيلك وتواصلك مع الزبائن.",
      seeOffers: "عرض العروض",
    },
    why: {
      mark: "لماذا",
      title: "أغلب المؤسسات لا تحتاج أدوات أكثر. تحتاج أنظمة تناسبها.",
      lead: "لا موقع حقيقي. الزبائن ضائعون في واتساب. المخزون والفواتير في ملفات متفرقة. عمل متكرر باليد. أنظر أوّلاً إلى نشاطك، ثم أبني الموقع السريع أو CRM أو ERP أو الذكاء الاصطناعي حوله.",
    },
    offers: {
      mark: "العروض",
      title: "صورة واضحة لما يمكنك الحصول عليه",
      lead: "أربع خدمات مخصّصة. اختر واحدة أو اجمعها. كل شيء ينطلق من مؤسستك: عرضك، مسارك، لغتك.",
      choose: "اختيار هذا",
    },
    process: {
      mark: "المسار",
      title: "نفس الطريق لكل خدمة: مؤسستك أولاً",
      steps: [
        {
          title: "مكالمة",
          text: "تشرح النشاط: كيف تبيع، أين العطل، وماذا تريد أن ينمو. مجاناً ومن دون ضغط.",
        },
        {
          title: "البناء",
          text: "موقع سريع، CRM، ERP، ذكاء اصطناعي — أو مزيج. يُصمم حول مسارك، لا قالب عام.",
        },
        {
          title: "الإطلاق",
          text: "تحصل على نظام يناسب حجمك ولغتك وطريقة عملك الحالية.",
        },
      ],
    },
    pricing: {
      mark: "السعر",
      title: "Fast بسعر ثابت. الباقي يُضبط معك.",
      lead: "CRM وERP والذكاء الاصطناعي يتوقفان على حجمك ومسارك. المكالمة المجانية لتحديد ما يدخل في النسخة الأولى. لا دفع لمجرد الحديث.",
    },
    about: {
      mark: "من نحن",
      title: "من وراء Pluss.dev",
      bio: "أنا مهدي كرنو، مؤسّس Pluss.dev — وكالة تبني تطبيقات ويب وCRM وERP وأنظمة ذكاء اصطناعي للشركات الناشئة والمؤسسات في الجزائر وخارجها.",
      creds: [
        "مطوّر full-stack — React وReact Native وNode.js وSupabase",
        "نائب رئيس Digital Valley Club · GDG — التكنولوجيا المالية والفعاليات والقيادة",
        "فائز في هاكاثونات وطنية — Headway وBusiness Road وInnov…",
        "أتمتة النماذج الأولية — Figma وn8n والمزيد",
      ],
      linkedin: "LinkedIn",
    },
    work: {
      mark: "أعمال",
      title: "أعمال حديثة",
      cta: "عرض الأعمال",
      items: [
        {
          name: "Multicampus",
          kind: "FAST + CRM",
          text: "موقع وكالة في بجاية — قمع مبيعات، عرض خدمات، نظام محتوى ولوحة إدارة.",
        },
        {
          name: "Carta",
          kind: "AI + OPS",
          text: "بطاقات ولاء رقمية للمقاهي والمتاجر والمؤسسات الجزائرية.",
        },
        {
          name: "أنظمة الأعمال",
          kind: "MIX",
          text: "مواقع وCRM وأدوات تشغيل مخصّصة — حسب طريقة عمل كل عميل فعلياً.",
        },
      ],
    },
    faq: {
      mark: "أسئلة",
      title: "أسئلة قد تخطر لك",
      items: [
        {
          q: "هل يجب اختيار خدمة واحدة فقط؟",
          a: "لا. كثيرون يبدأون بـ Fast ثم يضيفون CRM أو ERP أو الذكاء الاصطناعي. نحدّد في المكالمة ما تحتاجه الآن وما يمكن لاحقاً.",
        },
        {
          q: "هل كل شيء مخصّص فعلاً؟",
          a: "نعم. الصفحات والمسار والوحدات والذكاء الاصطناعي تُبنى من عرضك ومسارك ولغتك — ليست منتجاً منسوخاً.",
        },
        {
          q: "هل يصل الموقع السريع خلال 3 أيام حقاً؟",
          a: "نعم — بعد المكالمة واستلام ما أحتاجه (الشعار، المحتوى، التفضيلات)، الموقع يكون جاهزاً خلال 3 أيام.",
        },
        {
          q: "كيف يُسعَّر CRM وERP والذكاء الاصطناعي؟",
          a: "يُحدَّد في المكالمة حسب الحجم والتعقيد. أقول لك بوضوح ما يدخل في النسخة الأولى وما يمكن تأجيله.",
        },
        {
          q: "كيف أدفع؟",
          a: "نؤكد التفاصيل في المكالمة — لا دفع لمجرد الحديث.",
        },
      ],
    },
    start: {
      mark: "ابدأ",
      title: "جاهز لنظام يناسب مؤسستك فعلاً؟",
      lead: "احجز مكالمة مجانية — أريك أي الخدمات الأربع تحتاجها، دون التزام.",
      book: "مكالمة مجانية",
      whatsapp: "واتساب",
    },
    form: {
      eyebrow: "تسجيل",
      title: "أخبرني ماذا تحتاج",
      sub: "اختر خدمة. أتواصل معك على واتساب لتحديد المكالمة.",
      name: "الاسم الكامل",
      namePh: "اسمك",
      business: "اسم المؤسسة",
      businessPh: "شركتك",
      service: "الخدمة",
      select: "اختر…",
      mix: "غير متأكد / مزيج",
      phone: "رقم واتساب",
      email: "البريد الإلكتروني",
      city: "المدينة",
      cityPh: "الجزائر، وهران، بجاية…",
      type: "نوع النشاط",
      need: "ماذا يجب أن يفعل النظام لك؟",
      optional: "(اختياري)",
      needPh: "كيف تعمل اليوم، وماذا تريد أن يدير النظام…",
      submit: "التسجيل لمكالمة مجانية",
      saving: "جاري الحفظ…",
      micro: "لا دفع الآن. نمرّ على كل شيء في المكالمة أولاً.",
      successTitle: "تم — نتحدث قريباً.",
      successBody: "تم حفظ بياناتك. يفترض أن يفتح واتساب بطلبك. إن لم يفتح،",
      successLink: "اضغط هنا لمراسلتي",
      missingEnv: "أضف رابط ومفتاح Supabase في `.env` لجمع الطلبات.",
      fail: "تعذّر حفظ التسجيل.",
    },
    types: ["تجارة", "وكالة / خدمات", "مطعم / مقهى", "عيادة / مهنة حرّة", "شركة ناشئة", "أخرى"],
    services: {
      fast: {
        name: "موقع سريع",
        tag: "٣ أيام",
        promise: "موقع احترافي حيّ خلال 3 أيام — ليجدك الزبائن ويأخذوك على محمل الجد.",
        fit: "مخصّص لعلامتك ومدينتك وعرضك وطريقة بيعك.",
        price: "32 000 دج",
        timing: "تسليم خلال 3 أيام",
        points: [
          "نطاق .dz واستضافة في الجزائر وشهادة SSL وبريد مهني",
          "صفحات للهاتف يمكنك تعديلها بنفسك",
          "هيكل مبني على خدماتك الحقيقية لا قالب عام",
        ],
      },
      crm: {
        name: "CRM",
        tag: "زبائن",
        promise: "نظام واحد للزبائن والمتابعات والمبيعات — بدل محادثات واتساب ودفاتر متفرقة.",
        fit: "مخصّص لمسار البيع عندك: المراحل والحقول وعادات المتابعة التي تستخدمها أصلاً.",
        price: "يُحدَّد في المكالمة",
        timing: "حول مسارك",
        points: [
          "جهات اتصال وصفقات وملاحظات وتذكيرات في مكان واحد",
          "متابعات توافق طريقة إغلاقك (مكالمات، واتساب، زيارات)",
          "فقط الوحدات التي تحتاجها — تجارة، عيادة، وكالة أو فريق مبيعات",
        ],
      },
      erp: {
        name: "ERP",
        tag: "تشغيل",
        promise: "التشغيل في نظام واحد: مخزون، فواتير، فريق وتقارير — بحجمك، لا أداة مؤسسات عملاقة.",
        fit: "مخصّص لما تديره يومياً: منتجات، مواقع، فريق وأوراق.",
        price: "يُحدَّد في المكالمة",
        timing: "حول عملياتك",
        points: [
          "مخزون وفوترة وملفات داخلية تتحدث فيما بينها",
          "صلاحيات لك ولفريقك دون تعقيد زائد",
          "تقارير تفيد القرار لا لوحات لا يفتحها أحد",
        ],
      },
      ai: {
        name: "نظام ذكاء اصطناعي",
        tag: "أتمتة",
        promise: "ذكاء اصطناعي يعمل على نشاطك: منتجاتك، لغتك، مهامك المتكررة.",
        fit: "مخصّص لوثائقك وأسئلة زبائنك ونبرتك والعمل الذي تريد إخراجه من يومك.",
        price: "يُحدَّد في المكالمة",
        timing: "على بياناتك",
        points: [
          "مساعدون للدعم أو البيع أو الأسئلة الداخلية",
          "أتمتة المتابعات والوثائق والأعمال الروتينية",
          "عربية أو فرنسية أو إنجليزية — مضبوطة على طريقة حديث مؤسستك",
        ],
      },
    },
    footer: {
      blurb: "تطبيقات ويب وCRM وERP وأنظمة ذكاء اصطناعي — مخصّصة للمؤسسات في الجزائر وخارجها.",
      contact: "تواصل",
      rights: "جميع الحقوق محفوظة.",
      inbox: "صندوق الطلبات",
    },
    sticky: { label: "FAST · CRM · ERP · AI", book: "مكالمة مجانية" },
    waIntro: "مرحبا مهدي — أريد نظاماً مخصّصاً لمؤسستي (موقع سريع، CRM، ERP أو ذكاء اصطناعي). هل نحدد مكالمة مجانية؟",
  },
};
