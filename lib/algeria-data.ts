/**
 * Algeria Geographic Data
 * Contains all 58 wilayas (provinces) with their communes (baladiyahs)
 * Format: wilaya number - French name - Arabic name
 */

export interface Commune {
  french: string;
  arabic: string;
}

export interface Wilaya {
  id: number;
  french: string;
  arabic: string;
  communes: Commune[];
}

export const algeriaWilayas: Wilaya[] = [
  {
    id: 1,
    french: "Adrar",
    arabic: "أدرار",
    communes: [
      { french: "Adrar", arabic: "أدرار" },
      { french: "Tamest", arabic: "تامت" },
      { french: "Ouargla", arabic: "ورقلة" },
      { french: "In Salah", arabic: "عين صالح" },
      { french: "In Guezzam", arabic: "عين قزّام" },
      { french: "Timanet", arabic: "تيمنيت" },
      { french: "Zaouiet Kounta", arabic: "زاوية كنتة" },
      { french: "Boudou", arabic: "بودو" },
      { french: "Metarfa", arabic: "المطارفة" },
      { french: "Ouled Ahmed Timmi", arabic: "أولاد أحمد تيمي" },
      { french: "Sali", arabic: "سالي" },
      { french: "Akabli", arabic: "أكابلي" },
      { french: "Tit", arabic: "تيت" },
      { french: "Sahara", arabic: "الصحرا" },
      { french: "Djenny", arabic: "جني" },
      { french: "Tinou", arabic: "تينو" }
    ]
  },
  {
    id: 2,
    french: "Chlef",
    arabic: "الشلف",
    communes: [
      { french: "Chlef", arabic: "الشلف" },
      { french: "El Karimia", arabic: "كريمية" },
      { french: "Ténès", arabic: "تينس" },
      { french: "El Marsa", arabic: "المرسى" },
      { french: "Beni Haoua", arabic: "بني حوا" },
      { french: "Sidi Akkacha", arabic: "سيدي عكاشة" },
      { french: "Boukadir", arabic: "بوقادير" },
      { french: "Oued Sly", arabic: "وادي سلى" },
      { french: "Oued Fodda", arabic: "وادي فودا" },
      { french: "El Astara", arabic: "العستارة" },
      { french: "Talassa", arabic: "تلاسة" },
      { french: "Hadjout", arabic: "حاجوط" },
      { french: "Mostaaganem", arabic: "مستغانم" },
      { french: "Kheir", arabic: "خير" },
      { french: "Sidi M'Hamed Benaouda", arabic: "سيدي محمد بنعودة" }
    ]
  },
  {
    id: 3,
    french: "Laghouat",
    arabic: "الأغواط",
    communes: [
      { french: "Laghouat", arabic: "الأغواط" },
      { french: "Aflou", arabic: "أفلو" },
      { french: "Brida", arabic: "بريدة" },
      { french: "Ghardaïa", arabic: "غرداية" },
      { french: "El Mesrane", arabic: "المسران" },
      { french: "Hassi R'mel", arabic: "حاسي الرمل" },
      { french: "Tadjemout", arabic: "تاجموت" },
      { french: "Oued M'Zi", arabic: "وادي مزي" },
      { french: "Sidi Makhlouf", arabic: "سيدي مخلوف" },
      { french: "Bouchaoui", arabic: "بوشاوي" },
      { french: "El Beidha", arabic: "البيضاء" },
      { french: "Ksar El Hadjaj", arabic: "قسر الحجاج" },
      { french: "Hassi Delaa", arabic: "حاسي دلاعة" },
      { french: "Tazarine", arabic: "تزرين" },
      { french: "Oued Krorfa", arabic: "وادي كرفرا" }
    ]
  },
  {
    id: 4,
    french: "Oum El Bouaghi",
    arabic: "أم البواقي",
    communes: [
      { french: "Oum El Bouaghi", arabic: "أم البواقي" },
      { french: "Aïn Beida", arabic: "عين البيضاء" },
      { french: "Aïn M'lila", arabic: "عين مليلا" },
      { french: "Souk Naâmane", arabic: "سوق نعمان" },
      { french: "Ksar Sbahi", arabic: "قصر الصباحي" },
      { french: "Dhala", arabic: "ذالة" },
      { french: "Hanchir Toumghani", arabic: "حانشير تومقني" },
      { french: "Aïn Babouche", arabic: "عين بابوش" },
      { french: "Berriche", arabic: "بريش" },
      { french: "Ouled Gacem", arabic: "ولاد قاسم" },
      { french: "Salam", arabic: "سلام" },
      { french: "Fkirina", arabic: "فكيرينا" },
      { french: "El Belala", arabic: "البلالة" },
      { french: "Aïn Diss", arabic: "عين ديس" },
      { french: "Bougaa", arabic: "بوقاعة" }
    ]
  },
  {
    id: 5,
    french: "Batna",
    arabic: "باتنة",
    communes: [
      { french: "Batna", arabic: "باتنة" },
      { french: "Timgad", arabic: "تيمقاد" },
      { french: "Djemila", arabic: "جميلة" },
      { french: "Setif", arabic: "سطيف" },
      { french: "El Khroub", arabic: "الخروب" },
      { french: "Constantine", arabic: "قسنطينة" },
      { french: "Mila", arabic: "ميلة" },
      { french: "Jijel", arabic: "جيجل" },
      { french: "Skikda", arabic: "سكيكدة" },
      { french: "Sétif", arabic: "سطيف" },
      { french: "Barika", arabic: "باريكة" },
      { french: "Biskra", arabic: "بسكرة" },
      { french: "Tébessa", arabic: "تبسة" },
      { french: "Khenchela", arabic: "خنشلة" },
      { french: "Aïn Témouchent", arabic: "عين تموشنت" },
      { french: "Oran", arabic: "وهران" },
      { french: "Mostaganem", arabic: "مستغانم" },
      { french: "Relizane", arabic: "غليزان" }
    ]
  },
  {
    id: 6,
    french: "Béjaïa",
    arabic: "بجاية",
    communes: [
      { french: "Béjaïa", arabic: "بجاية" },
      { french: "Jijel", arabic: "جيجل" },
      { french: "Cité des 906", arabic: "مدينة 906" },
      { french: "Tichy", arabic: "تيشي" },
      { french: "Amizour", arabic: "أميزور" },
      { french: "Seddouk", arabic: "سدouk" },
      { french: "Akbou", arabic: "أكبو" },
      { french: "Timezrit", arabic: "تمزيرت" },
      { french: "Sidi Aïch", arabic: "سيدي عياش" },
      { french: "Chemini", arabic: "شميني" },
      { french: "Draa El Mizan", arabic: "دراع الميزان" },
      { french: "Tizi Ouzou", arabic: "تيزي وزو" },
      { french: "Boudjima", arabic: "بوجيما" },
      { french: "Makouda", arabic: "ماكودة" },
      { french: "Freha", arabic: "فريحة" }
    ]
  },
  {
    id: 7,
    french: "Biskra",
    arabic: "بسكرة",
    communes: [
      { french: "Biskra", arabic: "بسكرة" },
      { french: "Ouled Djellal", arabic: "أولاد جلال" },
      { french: "Timgad", arabic: "تيمقاد" },
      { french: "Tolga", arabic: "تولقة" },
      { french: "El Outaya", arabic: "العطاية" },
      { french: "Djemorah", arabic: "جمرة" },
      { french: "M'Lili", arabic: "مليلي" },
      { french: "El Ghrous", arabic: "الغروس" },
      { french: "Ouled Rahma", arabic: "ولاد رحمة" },
      { french: "Foughala", arabic: "فوغالة" },
      { french: "Bouchagroun", arabic: "بشقرون" },
      { french: "Oued El Ma", arabic: "وادي الما" },
      { french: "Mekhadma", arabic: "مخادما" },
      { french: "Lioua", arabic: "ليوة" }
    ]
  },
  {
    id: 8,
    french: "Béchar",
    arabic: "بشار",
    communes: [
      { french: "Béchar", arabic: "بشار" },
      { french: "Fendi", arabic: "فendi" },
      { french: "Taghit", arabic: "تاغيت" },
      { french: "Beni Abbès", arabic: "بني عباس" },
      { french: "Kenadsa", arabic: "قنادسة" },
      { french: "Boudou", arabic: "بودو" },
      { french: "Mogheul", arabic: "مقgol" },
      { french: "Ksabi", arabic: "قسابي" },
      { french: "Timoudi", arabic: "تيمودي" },
      { french: "Oued Ksob", arabic: "وادي ksop" },
      { french: "Mekmene Ben Amar", arabic: "مقمان بن عمر" },
      { french: "Sidi Safi", arabic: "سيدي سافي" }
    ]
  },
  {
    id: 9,
    french: "Blida",
    arabic: "البليدة",
    communes: [
      { french: "Blida", arabic: "البليدة" },
      { french: "Boouf", arabic: "بوف" },
      { french: "Chebli", arabic: "شلي" },
      { french: "Meftah", arabic: "مفتاح" },
      { french: "Oued Djer", arabic: "وادي جر" },
      { french: "Boufarik", arabic: "بوفاريك" },
      { french: "Ben Khelil", arabic: "بن خليل" },
      { french: "Sidi Nasreddine", arabic: "سيدي نسرين" },
      { french: "Larbaâ", arabic: "عرابة" },
      { french: "El Affroun", arabic: "العفرون" },
      { french: "Chiffa", arabic: "شفة" },
      { french: "Médéa", arabic: "المدية" },
      { french: "Berrouaghia", arabic: "البرواقية" },
      { french: "Bouira", arabic: "البويرة" }
    ]
  },
  {
    id: 10,
    french: "Bouira",
    arabic: "البويرة",
    communes: [
      { french: "Bouira", arabic: "البويرة" },
      { french: "M'Chedallah", arabic: "مشnedallah" },
      { french: "Bechloul", arabic: "بشلول" },
      { french: "Kadiria", arabic: "قديرية" },
      { french: "Aïn Bessem", arabic: "عين بessem" },
      { french: "Hadjera Zerga", arabic: "حاجرة زرقة" },
      { french: "Aomar", arabic: "عمر" },
      { french: "El Hachimia", arabic: "الحاشمية" },
      { french: "Ath Laziz", arabic: "آث لعزيز" },
      { french: "Sour El Ghozlane", arabic: "صور الغزلان" },
      { french: "Lakhdaria", arabic: "لخضارية" },
      { french: "Boudou", arabic: "بودو" },
      { french: "Djebahia", arabic: "جباحية" },
      { french: "Haizer", arabic: "حيزر" }
    ]
  },
  {
    id: 11,
    french: "Tamanrasset",
    arabic: "تمنراست",
    communes: [
      { french: "Tamanrasset", arabic: "تمنراست" },
      { french: "In Salah", arabic: "عين صالح" },
      { french: "In Guezzam", arabic: "عين قزّام" },
      { french: "Djanet", arabic: "جانت" },
      { french: "Tazrouk", arabic: "تاذروك" },
      { french: "Tamalhat", arabic: "تامالحات" },
      { french: "Tinzaouatine", arabic: "تينزاواتين" },
      { french: "Abalessa", arabic: "أباليسا" },
      { french: "Idles", arabic: "ادلس" },
      { french: "Hoggar", arabic: "هقار" }
    ]
  },
  {
    id: 12,
    french: "Tébessa",
    arabic: "تبسة",
    communes: [
      { french: "Tébessa", arabic: "تبسة" },
      { french: "El Ouenza", arabic: "الونزة" },
      { french: "Khourashba", arabic: "خورشبا" },
      { french: "Morsott", arabic: "مرسوط" },
      { french: "Negrine", arabic: "نقرين" },
      { french: "Bekkaria", arabic: "بكارية" },
      { french: "Bordj Omar Driss", arabic: "برج عمر إدريس" },
      { french: "Sidi Amar", arabic: "سيدي عمار" },
      { french: "El Aouinet", arabic: "العوينات" },
      { french: "Bouchebroun", arabic: "بوشبرون" },
      { french: "Ferdj", arabic: "فردج" },
      { french: "Oued Sbaa", arabic: "وادي SBA" },
      { french: "Saf Saf", arabic: "صصاف" },
      { french: "Bir Dheheb", arabic: "bir dheheb" }
    ]
  },
  {
    id: 13,
    french: "Tlemcen",
    arabic: "تلمسان",
    communes: [
      { french: "Tlemcen", arabic: "تلمسان" },
      { french: "M'Sila", arabic: "المسيلة" },
      { french: "Sidi Bel Abbès", arabic: "سيدي بلعباس" },
      { french: "Mascara", arabic: "معسكر" },
      { french: "Oran", arabic: "وهران" },
      { french: "Mostaganem", arabic: "مستغانم" },
      { french: "Aïn Témouchent", arabic: "عين تموشنت" },
      { french: "El Bayadh", arabic: "البيض" },
      { french: "Naâma", arabic: "النعامة" },
      { french: "Tiaret", arabic: "تيارت" },
      { french: "Relizane", arabic: "غليزان" },
      { french: "Sidi Lakhdar", arabic: "سيدي الأخضر" },
      { french: "Sebdou", arabic: "سبدو" },
      { french: "Nedroma", arabic: "ندرومة" },
      { french: "Maghnia", arabic: "مغنية" }
    ]
  },
  {
    id: 14,
    french: "Tiaret",
    arabic: "تيارت",
    communes: [
      { french: "Tiaret", arabic: "تيارت" },
      { french: "Frenda", arabic: "فرندة" },
      { french: "Ksar Chellala", arabic: "قصر الشلالة" },
      { french: "Mahdia", arabic: "مهدية" },
      { french: "Mechraa Sfa", arabic: "مشارع sfà" },
      { french: "Sougueur", arabic: "سقور" },
      { french: "Djebilet Rosfa", arabic: "جبلتروسفة" },
      { french: "Takhemaret", arabic: "تاخمرت" },
      { french: "Naima", arabic: "نايما" },
      { french: "Aïn Bouchekif", arabic: "عين بوشكيف" },
      { french: "Medrissa", arabic: "مدرissa" },
      { french: "Zeddine", arabic: "زدين" },
      { french: "Oued Lilli", arabic: "وادي ليلي" },
      { french: "Moulay Larbi", arabic: "مولاي العربي" }
    ]
  },
  {
    id: 15,
    french: "Tizi Ouzou",
    arabic: "تيزي وزو",
    communes: [
      { french: "Tizi Ouzou", arabic: "تيزي وزو" },
      { french: "Draa El Mizan", arabic: "دراع الميزان" },
      { french: "Tizi Gheniff", arabic: "تيزي غنيف" },
      { french: "Azazga", arabic: "أزازقة" },
      { french: "Yakouren", arabic: "ياقوران" },
      { french: "L'Arbaa Nath Irathen", arabic: "الرايس نثراثن" },
      { french: "Mekla", arabic: "مقلع" },
      { french: "Timizart", arabic: "تيميزارت" },
      { french: "Boudjima", arabic: "بوجيما" },
      { french: "Makouda", arabic: "ماكودة" },
      { french: "Freha", arabic: "فريحة" },
      { french: "Iferhounene", arabic: "إفرحونن" },
      { french: "In Ezzane", arabic: "عين إيزان" },
      { french: "Ait Boumahdi", arabic: "آيت بومهدي" },
      { french: "Ait Aggouacha", arabic: "آيت أقواشة" }
    ]
  },
  {
    id: 16,
    french: "Alger",
    arabic: "الجزائر",
    communes: [
      { french: "Alger Centre", arabic: "الجزائر الوسطى" },
      { french: "Sidi M'Hamed", arabic: "سيدي محمد" },
      { french: "El Biar", arabic: "البيار" },
      { french: "Belouizdad", arabic: "بلوزداد" },
      { french: "Bab El Oued", arabic: "باب الوادي" },
      { french: "Casbah", arabic: "القصبة" },
      { french: "Birmandreis", arabic: "بیرماندرس" },
      { french: "Hussein Dey", arabic: "حسين دي" },
      { french: "Kouba", arabic: "قuba" },
      { french: "Bachdjerrah", arabic: "باش جراح" },
      { french: "Harraoua", arabic: "حراوة" },
      { french: "Rahmania", arabic: "رحمانية" },
      { french: "Staoueli", arabic: "سطاولي" },
      { french: "Zéralda", arabic: "زرالدة" },
      { french: "Bab Ezzouar", arabic: "باب الزوار" },
      { french: "Dar El Beïda", arabic: "دار البيضا" },
      { french: "Aïn Benian", arabic: "عين بنيان" },
      { french: "Bordj El Bahri", arabic: "برج البحري" },
      { french: "El Hammamet", arabic: "الحمامات" },
      { french: "Ain Taya", arabic: "عين طاية" }
    ]
  },
  {
    id: 17,
    french: "Djelfa",
    arabic: "الجلفة",
    communes: [
      { french: "Djelfa", arabic: "الجلفة" },
      { french: "Messaad", arabic: "مساعد" },
      { french: "Bousaâda", arabic: "بوسعادة" },
      { french: "Aïn Oussera", arabic: "عينüssera" },
      { french: "Had Sahary", arabic: "حد صحراي" },
      { french: "Guerrara", arabic: "قرارة" },
      { french: "Sidi Ladjel", arabic: "سيدي لعجل" },
      { french: "Faidh", arabic: "فيدح" },
      { french: "El Khenguia", arabic: "الخنقية" },
      { french: "Hassi Bahbah", arabic: "حاسي bahbah" },
      { french: "Aïn Maabed", arabic: "عين معبد" },
      { french: "Zaccar", arabic: "زكار" },
      { french: "M'lili", arabic: "مليلي" },
      { french: "Selmana", arabic: "سلمانة" }
    ]
  },
  {
    id: 18,
    french: "Jijel",
    arabic: "جيجل",
    communes: [
      { french: "Jijel", arabic: "جيجل" },
      { french: "Taher", arabic: "طاهر" },
      { french: "Erraguene", arabic: "اراغن" },
      { french: "El Milia", arabic: "الميلية" },
      { french: "Sidi Maarouf", arabic: "سيدي معروف" },
      { french: "Kimet", arabic: "كيمت" },
      { french: "Boudriaa", arabic: "بودريعة" },
      { french: "Djemaa", arabic: "جمة" },
      { french: "Emir Abdelkader", arabic: "أمير عبد القادر" },
      { french: "Bordj Tahar", arabic: "برج طاهر" },
      { french: "Ghebala", arabic: "غبالة" },
      { french: "Kaous", arabic: "كاوس" },
      { french: "Ziama Mansouria", arabic: "زيانة المنصورية" },
      { french: "Ouled Yahia", arabic: "ولاد يحيى" }
    ]
  },
  {
    id: 19,
    french: "Sétif",
    arabic: "سطيف",
    communes: [
      { french: "Sétif", arabic: "سطيف" },
      { french: "Aïn Arnat", arabic: "عين أرناط" },
      { french: "El Eulma", arabic: "العula" },
      { french: "Aïn Oulmene", arabic: "عين علمين" },
      { french: "Aïn Azel", arabic: "عين عazel" },
      { french: "Babor", arabic: "بابور" },
      { french: "Bougaa", arabic: "بوقاعة" },
      { french: "Aïn Kébira", arabic: "عين كبيرة" },
      { french: "Beni Ourtilane", arabic: "بني ورتلان" },
      { french: "Bordj Bou Arréridj", arabic: "برج بوعريريج" },
      { french: "Mansourah", arabic: "منصورة" },
      { french: "Ksar El Abtal", arabic: "قصر الأبطال" },
      { french: "Aïn Sdour", arabic: "عين سدور" },
      { french: "Beni Hocine", arabic: "بني hocine" },
      { french: "Sérif", arabic: "سيريف" }
    ]
  },
  {
    id: 20,
    french: "Saïda",
    arabic: "سعيدة",
    communes: [
      { french: "Saïda", arabic: "سعيدة" },
      { french: "Moulay Larbi", arabic: "مولاي العربي" },
      { french: "Sidi Ahmed", arabic: "سيدي أحمد" },
      { french: "Ouled Khaled", arabic: "ولاد خالد" },
      { french: "Sidi Amar", arabic: "سيدي عمار" },
      { french: "Maamora", arabic: "المعمورة" },
      { french: "Doukhane", arabic: "دوقان" },
      { french: "Sidi Boubekeur", arabic: "سيدي بوبكر" },
      { french: "Aïn Soltane", arabic: "عين سلطانة" },
      { french: "Youb", arabic: "يوب" },
      { french: "El Hassasna", arabic: "الحساسنة" },
      { french: "Hounet", arabic: "حنت" }
    ]
  },
  {
    id: 21,
    french: "Skikda",
    arabic: "سكيكدة",
    communes: [
      { french: "Skikda", arabic: "سكيكدة" },
      { french: "Azzaba", arabic: "عزابة" },
      { french: "Collo", arabic: "قُلو" },
      { french: "El Hadaiek", arabic: "الحدائق" },
      { french: "Aïn Kechera", arabic: "عين خيثر" },
      { french: "Beni Zid", arabic: "بني زيد" },
      { french: "Kerkera", arabic: "كراكة" },
      { french: "Ouled Attia", arabic: "ولاد عطية" },
      { french: "Ouled Hebib", arabic: "ولاد حبيب" },
      { french: "Sidi Mezghich", arabic: "سيدي مزغي" },
      { french: "Beni Oulbane", arabic: "بني ولبان" },
      { french: "Bekkouche Lakhdar", arabic: "بوخاشة الأخضر" },
      { french: "Es Sebt", arabic: "السبت" },
      { french: "Zitouna", arabic: "الزيتونة" }
    ]
  },
  {
    id: 22,
    french: "Sidi Bel Abbès",
    arabic: "سيدي بلعباس",
    communes: [
      { french: "Sidi Bel Abbès", arabic: "سيدي بلعباس" },
      { french: "Sidi Lahcene", arabic: "سيدي لحسن" },
      { french: "Mostefa", arabic: "مصطفى" },
      { french: "Tessala", arabic: "تسالة" },
      { french: "Sidi Brahim", arabic: "سيدي إبراهيم" },
      { french: "Aïn Trouch", arabic: "عين تروش" },
      { french: "Oued Sbaa", arabic: "وادي SBA" },
      { french: "Meknassa", arabic: "مقناسة" },
      { french: "Sidi Chaib", arabic: "سيدي شعيب" },
      { french: "M'Cid", arabic: "ماسيد" },
      { french: "Beni Saf", arabic: "بني صف" },
      { french: "Tleta", arabic: "الطليعة" },
      { french: "Aïn Adden", arabic: "عينعدن" },
      { french: "El Ayoun", arabic: "العيون" },
      { french: "Ras El Ma", arabic: "راس الماء" }
    ]
  },
  {
    id: 23,
    french: "Annaba",
    arabic: "عنابة",
    communes: [
      { french: "Annaba", arabic: "عنابة" },
      { french: "El Bouni", arabic: "البوني" },
      { french: "Barachoa", arabic: "براقوة" },
      { french: "Oued El Aneb", arabic: "وادي العنب" },
      { french: "Cheffia", arabic: "شيفية" },
      { french: "Bouteldja", arabic: "بوتلجة" },
      { french: "Aïn Dalia", arabic: "عين دالية" },
      { french: "El Tarf", arabic: "الطارف" },
      { french: "Lac des Oiseaux", arabic: "lake des oiseaux" },
      { french: "Chetaïbi", arabic: "شطايبي" },
      { french: "Aïn Berda", arabic: "عين بردة" },
      { french: "Sidi Amar", arabic: "سيدي عمار" },
      { french: "Bouhadjar", arabic: "بوهجار" },
      { french: "Ouled Zoubir", arabic: "ولاد زبير" }
    ]
  },
  {
    id: 24,
    french: "Guelma",
    arabic: "قالمة",
    communes: [
      { french: "Guelma", arabic: "قالمة" },
      { french: "Guelma", arabic: "قالمة" },
      { french: "Aïn Makhlouf", arabic: "عين مخلف" },
      { french: "Aïn Ben Beida", arabic: "عين بن بيدة" },
      { french: "Bouchegouf", arabic: "بشقوف" },
      { french: "Hammam Debagh", arabic: "حمام دباغ" },
      { french: "Hammam N'Bail", arabic: "حمام nbail" },
      { french: "Medjez Amar", arabic: "مجاز عمار" },
      { french: "Nechmaya", arabic: "نشماية" },
      { french: "Oued Ferraï", arabic: "وادي فراي" },
      { french: "Roknia", arabic: "ركنية" },
      { french: "Sidi Mahdi", arabic: "سيدي مهدي" },
      { french: "Tamlouka", arabic: "تملكة" },
      { french: "Boudaroua", arabic: "بودروا" }
    ]
  },
  {
    id: 25,
    french: "Constantine",
    arabic: "قسنطينة",
    communes: [
      { french: "Constantine", arabic: "قسنطينة" },
      { french: "El Khroub", arabic: "الخروب" },
      { french: "Hamma Bouziane", arabic: "حامة بوزيان" },
      { french: "Didouche Mourad", arabic: "ديدouch مراد" },
      { french: "Aïn Smara", arabic: "عين سمارة" },
      { french: "M'Cid", arabic: "ماسيد" },
      { french: "Ouled Rahmoune", arabic: "ولاد رحمون" },
      { french: "Zighoud Youcef", arabic: "زيغود يوسف" },
      { french: "Ibn Ziad", arabic: "ابن زياد" },
      { french: "Ben Badis", arabic: "بن باديس" },
      { french: "Aïn Abid", arabic: "عين عابيد" },
      { french: "Bouchegouf", arabic: "بشقوف" },
      { french: "Oued Slimane", arabic: "وادي سليمان" },
      { french: "Talayeb", arabic: "طلايب" }
    ]
  },
  {
    id: 26,
    french: "Médéa",
    arabic: "المدية",
    communes: [
      { french: "Médéa", arabic: "المدية" },
      { french: "Berrouaghia", arabic: "البرواقية" },
      { french: "Ksar El Boukhari", arabic: "قصر بوخاري" },
      { french: "Tablat", arabic: "تبلة" },
      { french: "Aïn Boucif", arabic: "عين بوسيف" },
      { french: "Ouzera", arabic: "وزيارة" },
      { french: "El Hamdania", arabic: "الحمدانية" },
      { french: "M'Chedallah", arabic: "مشnedallah" },
      { french: "Aïn Oussera", arabic: "عينussera" },
      { french: "Draâ Slimane", arabic: "ذراع سليمان" },
      { french: "Tizi Mahdi", arabic: "تيزي مهدي" },
      { french: "Sidi Naamane", arabic: "سيدي نعمان" },
      { french: "Beni Slimane", arabic: "بني سليمان" },
      { french: "Ouled Deide", arabic: "ولاد ديد" },
      { french: "Ksar Khalfoune", arabic: "قصر خلوفون" }
    ]
  },
  {
    id: 27,
    french: "Mostaganem",
    arabic: "مستغانم",
    communes: [
      { french: "Mostaganem", arabic: "مستغانم" },
      { french: "Achaacha", arabic: "أعشاش" },
      { french: "Khadra", arabic: "خضراء" },
      { french: "Mansourah", arabic: "منصورة" },
      { french: "Sour", arabic: "صور" },
      { french: "Oued El Kheir", arabic: "وادي الخير" },
      { french: "Staoueli", arabic: "سطاولي" },
      { french: "Sidi Belattar", arabic: "سيدي بلطرس" },
      { french: "Tazgait", arabic: "تازكيت" },
      { french: "Mesra", arabic: "مصراة" },
      { french: "Sidi Lakhdar", arabic: "سيدي الأخضر" },
      { french: "Aïn Tedeles", arabic: "عين تيدلس" },
      { french: "Mellouk", arabic: "ملوك" },
      { french: "Oued Sfinal", arabic: "وادي سفيوال" },
      { french: "Bouguirat", arabic: "بوقيراط" }
    ]
  },
  {
    id: 28,
    french: "M'Sila",
    arabic: "المسيلة",
    communes: [
      { french: "M'Sila", arabic: "المسيلة" },
      { french: "Berhou", arabic: "برهو" },
      { french: "Maarif", arabic: "معروف" },
      { french: "Belaiba", arabic: "بلايبا" },
      { french: "Sidi Aïssa", arabic: "سيدي عياش" },
      { french: "M'Cif", arabic: "ماسيف" },
      { french: "Ouled Sidi Brahim", arabic: "ولاد سيدي إبراهيم" },
      { french: "Hassi Feïdi", arabic: "حاسي فيدي" },
      { french: "Khoubane", arabic: "خوبان" },
      { french: "Tamsa", arabic: "تامسا" },
      { french: "Aïn El Hadjel", arabic: "عين الهجل" },
      { french: "Bouchaoui", arabic: "بوشاوي" },
      { french: "El Houamed", arabic: "الحوامد" },
      { french: "Ouled Madhi", arabic: "ولاد ماضي" },
      { french: "Sidi M'Hamed", arabic: "سيدي محمد" }
    ]
  },
  {
    id: 29,
    french: "Mascara",
    arabic: "معسكر",
    communes: [
      { french: "Mascara", arabic: "معسكر" },
      { french: "Ghriss", arabic: "غريس" },
      { french: "Tizi", arabic: "تيزي" },
      { french: "Oued El Abtal", arabic: "وادي الأبطال" },
      { french: "El Bordj", arabic: "البرج" },
      { french: "Aïn Fras", arabic: "عين فراس" },
      { french: "Sig", arabic: "سق" },
      { french: "Mamoussa", arabic: "موموسا" },
      { french: "Alaimia", arabic: "العلايمية" },
      { french: "Aïn Khesra", arabic: "عين خيسرا" },
      { french: "Ferraguig", arabic: "فراقيق" },
      { french: "Sidi Boudjemaa", arabic: "سيدي بوجمعة" },
      { french: "Khalou", arabic: "خالو" },
      { french: "Oued Taria", arabic: "وادي تاريا" },
      { french: "El Tarf", arabic: "الطارف" }
    ]
  },
  {
    id: 30,
    french: "Ouargla",
    arabic: "ورقلة",
    communes: [
      { french: "Ouargla", arabic: "ورقلة" },
      { french: "Touggourt", arabic: "تقرت" },
      { french: "El Hadjira", arabic: "الحجيرة" },
      { french: "N'Goussa", arabic: "نقوسة" },
      { french: "Hassi Ben Abdellah", arabic: "حاسي بن عبد الله" },
      { french: "Sidi Khouiled", arabic: "سيدي خويلد" },
      { french: "Rouissat", arabic: "رويسات" },
      { french: "El Borma", arabic: "بورما" },
      { french: "Hassi Messaoud", arabic: "حاسي مسعود" },
      { french: "Nezla", arabic: "نزلة" },
      { french: "Taibet", arabic: "طيب" },
      { french: "Tebesbest", arabic: "تبسبست" },
      { french: "El Allia", arabic: "العالية" },
      { french: "Sahara", arabic: "الصحرا" }
    ]
  },
  {
    id: 31,
    french: "Oran",
    arabic: "وهران",
    communes: [
      { french: "Oran", arabic: "وهران" },
      { french: "Es Senia", arabic: "السénيا" },
      { french: "Bir El Djir", arabic: "بير الجير" },
      { french: "Arzew", arabic: "أرزيو" },
      { french: "Bethioua", arabic: "بتايوة" },
      { french: "Mers El Kébir", arabic: "مرسى الكبير" },
      { french: "Aïn Témouchent", arabic: "عين تموشنت" },
      { french: "El Bayadh", arabic: "البيض" },
      { french: "Tiaret", arabic: "تيارت" },
      { french: "Relizane", arabic: "غليزان" },
      { french: "Sidi Bel Abbès", arabic: "سيدي بلعباس" },
      { french: "Mostaganem", arabic: "مستغانم" },
      { french: "Ahfir", arabic: "أحفير" },
      { french: "Berkane", arabic: "بركان" },
      { french: "Saïda", arabic: "سعيدة" }
    ]
  },
  {
    id: 32,
    french: "El Bayadh",
    arabic: "البيض",
    communes: [
      { french: "El Bayadh", arabic: "البيض" },
      { french: "Bougheuir", arabic: "بوغوير" },
      { french: "El Abiodh Sidi Cheikh", arabic: "البيوض سيدي الشيخ" },
      { french: "Aïn Sidi Cherif", arabic: "عين سيدي شريف" },
      { french: "Brezina", arabic: "برزينة" },
      { french: "Chellala", arabic: "شلالة" },
      { french: "El Kheiter", arabic: "الخيطر" },
      { french: "Kef El Ahmar", arabic: "كف الأحمر" },
      { french: "Ksr Chellala", arabic: "قصر شلالة" },
      { french: "Mekarmine", arabic: "مقرمين" },
      { french: "Nough", arabic: "نوغ" },
      { french: "Oued Sbaa", arabic: "وادي SBA" },
      { french: "Rogassa", arabic: "رقاصة" },
      { french: "Sidi Ameur", arabic: "سيدي عامر" },
      { french: "Stitten", arabic: "ستيتن" }
    ]
  },
  {
    id: 33,
    french: "Illizi",
    arabic: "اليزي",
    communes: [
      { french: "Illizi", arabic: "اليزي" },
      { french: "Djanet", arabic: "جانت" },
      { french: "In Amenas", arabic: "إن أمناس" },
      { french: "Bordj Omar Driss", arabic: "برج عمر إدريس" },
      { french: "Sahara", arabic: "الصحرا" },
      { french: "Tamazouza", arabic: "تامزوازا" },
      { french: "Oued Kheldou", arabic: "وادي خلدو" },
      { french: "Bni Abbes", arabic: "بني عبس" },
      { french: "Fendeuk", arabic: "فندوك" },
      { french: "Idri", arabic: "إدري" }
    ]
  },
  {
    id: 34,
    french: "Bordj Bou Arréridj",
    arabic: "برج بوعريريج",
    communes: [
      { french: "Bordj Bou Arréridj", arabic: "برج بوعريريج" },
      { french: "Bordj Ghdir", arabic: "برج غدير" },
      { french: "El M'Cif", arabic: "الماسيف" },
      { french: "Bousselam", arabic: "بوسسلام" },
      { french: "Bordj Zmegh", arabic: "برج زميق" },
      { french: "Medjana", arabic: "مژان" },
      { french: "Tenès", arabic: "تينس" },
      { french: "Sidi Brahim", arabic: "سيدي إبراهيم" },
      { french: "Ouled Sidi Brahim", arabic: "ولاد سيدي إبراهيم" },
      { french: "El Achir", arabic: "العاشق" },
      { french: "Ben Djerrah", arabic: "بن جراح" },
      { french: "Mansourah", arabic: "منصورة" },
      { french: "Ksar Pignelin", arabic: "قصر بنيedin" },
      { french: "Bel Imour", arabic: "بل عمر" },
      { french: "Aïn Taghrout", arabic: "عين تاغروت" }
    ]
  },
  {
    id: 35,
    french: "Boumerdès",
    arabic: "بومرداس",
    communes: [
      { french: "Boumerdès", arabic: "بومرداس" },
      { french: "Baghlia", arabic: "باغلية" },
      { french: "Bordj Ménaïel", arabic: "برج مناعيل" },
      { french: "Dellys", arabic: "دليس" },
      { french: "Djinet", arabic: "جinet" },
      { french: "Isser", arabic: "إيسر" },
      { french: "Kherrata", arabic: "خراطة" },
      { french: "M'Chedallah", arabic: "مشnedallah" },
      { french: "Naciria", arabic: "ناسيرية" },
      { french: "Si Mustapha", arabic: "سي مصطفى" },
      { french: "Sidi Daoud", arabic: "سيدي داود" },
      { french: "Tadmait", arabic: "تادمات" },
      { french: "Thénia", arabic: "ثنية" },
      { french: "Afir", arabic: "أفير" },
      { french: "Timizart", arabic: "تيميزارت" }
    ]
  },
  {
    id: 36,
    french: "El Tarf",
    arabic: "الطارف",
    communes: [
      { french: "El Tarf", arabic: "الطارف" },
      { french: "Annaba", arabic: "عنابة" },
      { french: "Bouteldja", arabic: "بوتلجة" },
      { french: "Cheffia", arabic: "شيفية" },
      { french: "El Aioun", arabic: "العيون" },
      { french: "Lac des Oiseaux", arabic: "بحيرة الطيور" },
      { french: "Oued Zitoun", arabic: "وادي الزيتون" },
      { french: "Seraïdi", arabic: "سيرايذي" },
      { french: "Sidi M'Cid", arabic: "سيدي ماسيد" },
      { french: "Aïn Kechera", arabic: "عين خيثر" },
      { french: "Bekkouche Lakhdar", arabic: "بوخاشة الأخضر" },
      { french: "Beni Z'rbit", arabic: "بني زرابت" },
      { french: "Zerizer", arabic: "زريزر" },
      { french: "Dorath", arabic: "دورات" }
    ]
  },
  {
    id: 37,
    french: "Tindouf",
    arabic: "تندوف",
    communes: [
      { french: "Tindouf", arabic: "تندوف" },
      { french: "Oum El Assel", arabic: "أم السasel" },
      { french: "Tinfouchy", arabic: "تينفوشي" },
      { french: "Ksar El M'Guenine", arabic: "قصر المگنين" },
      { french: "Sahara", arabic: "الصحرا" },
      { french: "Fendi", arabic: "فندي" },
      { french: "Oued El Ma", arabic: "وادي الما" },
      { french: "Timiaouine", arabic: "تيمياوين" }
    ]
  },
  {
    id: 38,
    french: "Tissemsilt",
    arabic: "تسمسيلت",
    communes: [
      { french: "Tissemsilt", arabic: "تسمسيلت" },
      { french: "Ampona", arabic: "أمبونا" },
      { french: "Beni Chaib", arabic: "بني شيب" },
      { french: "Bordj Bou Naama", arabic: "برج بونعامة" },
      { french: "Bordj El Haouas", arabic: "برج الحواس" },
      { french: "Khemisti", arabic: "خميستي" },
      { french: "Lazizi", arabic: "لزيزي" },
      { french: "Maacem", arabic: "ماعصم" },
      { french: "Melaab", arabic: "ملاعب" },
      { french: "Ouled Bessem", arabic: "ولاد بassem" },
      { french: "Sidi Abderrahmane", arabic: "سيدي عبد الرحمان" },
      { french: "Sidi Slimane", arabic: "سيدي سليمان" },
      { french: "Sidi Boutouch", arabic: "سيدي بوتوش" },
      { french: "Tamda", arabic: "تامدة" },
      { french: "Theniet El Had", arabic: "ثنيت الحد" }
    ]
  },
  {
    id: 39,
    french: "El Oued",
    arabic: "الوادي",
    communes: [
      { french: "El Oued", arabic: "الوادي" },
      { french: "Guemar", arabic: "قمار" },
      { french: "Kouinine", arabic: "كوينين" },
      { french: "Reguiba", arabic: "اريگيبا" },
      { french: "Sidi Aoun", arabic: "سيدي عون" },
      { french: "Touggourt", arabic: "تقرت" },
      { french: "Oued Kheir", arabic: "وادي الخير" },
      { french: "Nekhla", arabic: "نخلة" },
      { french: "Sahara", arabic: "الصحرا" },
      { french: "Debila", arabic: "دبيلة" },
      { french: "El M'Ghair", arabic: "المغير" },
      { french: "Mih Ouencha", arabic: "مhueincha" },
      { french: "Nzila", arabic: "نزلة" },
      { french: "Oued Zied", arabic: "وادي زيد" }
    ]
  },
  {
    id: 40,
    french: "Khenchela",
    arabic: "خنشلة",
    communes: [
      { french: "Khenchela", arabic: "خنشلة" },
      { french: "Aïn Touc", arabic: "عين توش" },
      { french: "Babar", arabic: "بابار" },
      { french: "Baghai", arabic: "باغاي" },
      { french: "Bouhmama", arabic: "بوحمامة" },
      { french: "Chélia", arabic: "شلية" },
      { french: "Djellal", arabic: "جلال" },
      { french: "El Hamma", arabic: "الحامة" },
      { french: "El Ouel", arabic: "الويل" },
      { french: "Kaïs", arabic: "كاييس" },
      { french: "Khirane", arabic: "خيران" },
      { french: "M'Sara", arabic: "مصراة" },
      { french: "Nara", arabic: "نارة" },
      { french: "Oued Fodda", arabic: "وادي فودا" },
      { french: "Tamza", arabic: "تامزة" }
    ]
  },
  {
    id: 41,
    french: "Souk Ahras",
    arabic: "سوق أهراس",
    communes: [
      { french: "Souk Ahras", arabic: "سوق أهراس" },
      { french: "Aïn Zana", arabic: "عين زانة" },
      { french: "Berrehail", arabic: "برحابيل" },
      { french: "Boukhanoura", arabic: "باخنورة" },
      { french: "Dreff", arabic: "دريف" },
      { french: "Dréan", arabic: "دران" },
      { french: "El Hadj Teb", arabic: "الحاج تب" },
      { french: "El Ma El Ouenine", arabic: "الماعوينين" },
      { french: "Haddada", arabic: "حدادة" },
      { french: "Hoggar", arabic: "هقار" },
      { french: "Khedara", arabic: "خضارة" },
      { french: "M'daourouch", arabic: "موروش" },
      { french: "Mechroha", arabic: "مشرورة" },
      { french: "Oued Cheham", arabic: "وادي الشهم" },
      { french: "Ouled Dris", arabic: "ولاد إدريس" }
    ]
  },
  {
    id: 42,
    french: "Tipaza",
    arabic: "تيبازة",
    communes: [
      { french: "Tipaza", arabic: "تيبازة" },
      { french: "Cherchell", arabic: "شرشال" },
      { french: "Colea", arabic: "كولي" },
      { french: "Damous", arabic: "داموس" },
      { french: "Fouka", arabic: "فوكا" },
      { french: "Gouraya", arabic: "قوراية" },
      { french: "Hadjout", arabic: "حاجوط" },
      { french: "Khemisti", arabic: "خميستي" },
      { french: "Larva", arabic: "لارڤا" },
      { french: "Mateur", arabic: "ماطر" },
      { french: "Ménerville", arabic: "مونرڤيل" },
      { french: "Merad", arabic: "مراد" },
      { french: "Sidi Ghiles", arabic: "سيديغيل" },
      { french: "Sidi Rached", arabic: "سيدي راشد" },
      { french: "Ahmer El Ain", arabic: "أحmer عين" }
    ]
  },
  {
    id: 43,
    french: "Mila",
    arabic: "ميلة",
    communes: [
      { french: "Mila", arabic: "ميلة" },
      { french: "Aïn Beida Harriche", arabic: "عين البيضاء حريش" },
      { french: "Aïn Hammam", arabic: "عين hammam" },
      { french: "Aïn M'lila", arabic: "عين مليلا" },
      { french: "Benyahia Abderrahmane", arabic: "بن يحيى عبد الرحمان" },
      { french: "Boughrara", arabic: "بوقرارة" },
      { french: "Chelghoum Laid", arabic: "شلغوم اللعيد" },
      { french: "Constantine", arabic: "قسنطينة" },
      { french: "El Mechira", arabic: "المشيرة" },
      { french: "Ferdes", arabic: "فردس" },
      { french: "Hamala", arabic: "حاملة" },
      { french: "M'Sara", arabic: "مصراة" },
      { french: "Oued Athmenia", arabic: "وادي أثمينية" },
      { french: "Oued Seguen", arabic: "وادي سقر" },
      { french: "Sidi Khelifa", arabic: "سيدي خليفة" }
    ]
  },
  {
    id: 44,
    french: "Aïn Defla",
    arabic: "عين الدفلى",
    communes: [
      { french: "Aïn Defla", arabic: "عين الدفلى" },
      { french: "Aïn T_cell", arabic: "عينatsell" },
      { french: "Aflou", arabic: "أفلو" },
      { french: "Ammari", arabic: "عماري" },
      { french: "Belaas", arabic: "بلاع" },
      { french: "Beni Delha", arabic: "بني دلحة" },
      { french: "Boucharkhi", arabic: "بوشارخي" },
      { french: "Bourached", arabic: "بوشريط" },
      { french: "Djendel", arabic: "جندل" },
      { french: "El Abadia", arabic: "العباسية" },
      { french: "El Amra", arabic: "العمرى" },
      { french: "El Attaf", arabic: "الطاف" },
      { french: "Hammam Righa", arabic: "حمام ريغة" },
      { french: "Khemis Miliana", arabic: "خميس مليانة" },
      { french: "Miliana", arabic: "مليانة" }
    ]
  },
  {
    id: 45,
    french: "Naâma",
    arabic: "النعامة",
    communes: [
      { french: "Naâma", arabic: "النعامة" },
      { french: "Aïn Sefra", arabic: "عين الصفراء" },
      { french: "Aïn Ben Khelil", arabic: "عين بن خليل" },
      { french: "Asla", arabic: "أسالة" },
      { french: "El Biod", arabic: "البيوض" },
      { french: "Kasdir", arabic: "قصردير" },
      { french: "Makhloufi", arabic: "مخلوفي" },
      { french: "Mecheria", arabic: "مشرية" },
      { french: "Moghrar", arabic: "مقرار" },
      { french: "Nedroma", arabic: "ندرومة" },
      { french: "Sfissifa", arabic: "سفيشيفة" },
      { french: "Tiout", arabic: "تيوت" },
      { french: "Djeniene", arabic: "جنين" }
    ]
  },
  {
    id: 46,
    french: "Aïn Témouchent",
    arabic: "عين تموشنت",
    communes: [
      { french: "Aïn Témouchent", arabic: "عين تموشنت" },
      { french: "Aïn Kihal", arabic: "عينيكال" },
      { french: "Aïn Tolba", arabic: "عينطلبة" },
      { french: "Aghlal", arabic: "اغلال" },
      { french: "Bouchaoui", arabic: "بوشاوي" },
      { french: "Chentouf", arabic: "شنتوف" },
      { french: "El Malah", arabic: "المالح" },
      { french: "El Messaid", arabic: "المسعيد" },
      { french: "Hammam Bouhadjar", arabic: "حامام بوهجار" },
      { french: "Hassasna", arabic: "حساسنة" },
      { french: "Oued Berkeche", arabic: "وادي بركش" },
      { french: "Oued Sebbah", arabic: "وادي سبحان" },
      { french: "Sidi Ben Adda", arabic: "سيدي بن عدة" },
      { french: "Sidi Boumediene", arabic: "سيدي بومدين" },
      { french: "Sidi Safi", arabic: "سيدي سافي" }
    ]
  },
  {
    id: 47,
    french: "Ghardaïa",
    arabic: "غرداية",
    communes: [
      { french: "Ghardaïa", arabic: "غرداية" },
      { french: "Béjaïa", arabic: "بجاية" },
      { french: "Laghouat", arabic: "الأغواط" },
      { french: "El Menia", arabic: "المنيعة" },
      { french: "Metlili", arabic: "متلidi" },
      { french: "Sebseb", arabic: "سبسب" },
      { french: "Daya", arabic: "داية" },
      { french: "Mansoura", arabic: "منصورة" },
      { french: "Zelfana", arabic: "زلفانة" },
      { french: "Berriane", arabic: "بريانة" },
      { french: "El Guerrara", arabic: "قرارة" },
      { french: "Rabat", arabic: "الرباط" },
      { french: "Ksir", arabic: "قصر" },
      { french: "Hassi Gara", arabic: "حاسيkara" }
    ]
  },
  {
    id: 48,
    french: "Relizane",
    arabic: "غليزان",
    communes: [
      { french: "Relizane", arabic: "غليزان" },
      { french: "Aïn Tarek", arabic: "عين طارق" },
      { french: "Ami Moses", arabic: "امي موسى" },
      { french: "Belaab", arabic: "بلعاب" },
      { french: "Beni Dergoun", arabic: "بني درقون" },
      { french: "Beni Zaki", arabic: "بني زكي" },
      { french: "Boughezoul", arabic: "بوقزول" },
      { french: "B Zal", arabic: "بzal" },
      { french: "Dar Ben Abdellah", arabic: "دار بن عبد الله" },
      { french: "Djidiouia", arabic: "جديوية" },
      { french: "El Hassi", arabic: "الحاسي" },
      { french: "El Ouatia", arabic: "الواتية" },
      { french: "Hamri", arabic: "حمري" },
      { french: "Khadra", arabic: "خضراء" },
      { french: "Lahlef", arabic: "لحلف" }
    ]
  },
  {
    id: 49,
    french: "Timimoun",
    arabic: "تيميمون",
    communes: [
      { french: "Timimoun", arabic: "تيميمون" },
      { french: "Ouled Djellal", arabic: "أولاد جلال" },
      { french: "Béni Abbès", arabic: "بني عباس" },
      { french: "Adrar", arabic: "أدرار" },
      { french: "Aïn Salah", arabic: "عين صالح" },
      { french: "In Salah", arabic: "إن صالح" },
      { french: "Touggourt", arabic: "تقرت" },
      { french: "El Menia", arabic: "المنيعة" },
      { french: "Ksar El Kébir", arabic: "قصر الكبير" },
      { french: "Ferkous", arabic: "فركوس" },
      { french: "Tinapi", arabic: "تينيابي" },
      { french: "Ouled Rached", arabic: "ولاد راشد" }
    ]
  },
  {
    id: 50,
    french: "Bordj Badji Mokhtar",
    arabic: "برج باجي مختار",
    communes: [
      { french: "Bordj Badji Mokhtar", arabic: "برج باجي مختار" },
      { french: "In Salah", arabic: "عين صالح" },
      { french: "In Guezzam", arabic: "عين قزّام" },
      { french: "Tamanrasset", arabic: "تمنراست" },
      { french: "Djanet", arabic: "جانت" },
      { french: "Tazrouk", arabic: "تاذروك" },
      { french: "Timiaouine", arabic: "تيمياوين" },
      { french: "Sahara", arabic: "الصحرا" }
    ]
  },
  {
    id: 51,
    french: "Ouled Djellal",
    arabic: "أولاد جلال",
    communes: [
      { french: "Ouled Djellal", arabic: "أولاد جلال" },
      { french: "Biskra", arabic: "بسكرة" },
      { french: "Sidi Khaled", arabic: "سيدي خالد" },
      { french: "Tolga", arabic: "تولقة" },
      { french: "Ouled Sidi Ameur", arabic: "ولاد سيدي عامر" },
      { french: "El Ghrous", arabic: "الغروس" },
      { french: "Bouchagroun", arabic: "بشقرون" },
      { french: "Foughala", arabic: "فوغالة" },
      { french: "Lioua", arabic: "ليوة" },
      { french: "Mekhadma", arabic: "مخادما" },
      { french: "M'Lili", arabic: "مليلي" },
      { french: "Oued El Ma", arabic: "وادي الما" }
    ]
  },
  {
    id: 52,
    french: "Béni Abbès",
    arabic: "بني عباس",
    communes: [
      { french: "Béni Abbès", arabic: "بني عباس" },
      { french: "Béchar", arabic: "بشار" },
      { french: "Fendi", arabic: "فندي" },
      { french: "Taghit", arabic: "تاغيت" },
      { french: "Kenadsa", arabic: "قنادسة" },
      { french: "Mogheul", arabic: "مقgol" },
      { french: "Ksabi", arabic: "قسابي" },
      { french: "Timoudi", arabic: "تيمودي" },
      { french: "Oued Ksob", arabic: "وادي ksop" },
      { french: "Mekmene Ben Amar", arabic: "مقمان بن عمر" },
      { french: "Sidi Safi", arabic: "سيدي سافي" },
      { french: "Abadla", arabic: "ابادلة" }
    ]
  },
  {
    id: 53,
    french: "Ain Salah",
    arabic: "عين صالح",
    communes: [
      { french: "Ain Salah", arabic: "عين صالح" },
      { french: "Tamanrasset", arabic: "تمنراست" },
      { french: "In Salah", arabic: "إن صالح" },
      { french: "In Guezzam", arabic: "عين قزّام" },
      { french: "Tazrouk", arabic: "تاذروك" },
      { french: "Tamalhat", arabic: "تامالحات" },
      { french: "Tinzaouatine", arabic: "تينزاواتين" },
      { french: "Abalessa", arabic: "أباليسا" },
      { french: "Idles", arabic: "ادلس" },
      { french: "Hoggar", arabic: "هقار" },
      { french: "Sahara", arabic: "الصحرا" }
    ]
  },
  {
    id: 54,
    french: "Ain Guezzam",
    arabic: "عين قزّام",
    communes: [
      { french: "Ain Guezzam", arabic: "عين قزّام" },
      { french: "Tamanrasset", arabic: "تمنراست" },
      { french: "In Salah", arabic: "إن صالح" },
      { french: "Tazrouk", arabic: "تاذروك" },
      { french: "Tinzaouatine", arabic: "تينزاواتين" },
      { french: "Abalessa", arabic: "أباليسا" },
      { french: "Idles", arabic: "ادلس" },
      { french: "Sahara", arabic: "الصحرا" }
    ]
  },
  {
    id: 55,
    french: "Touggourt",
    arabic: "تقرت",
    communes: [
      { french: "Touggourt", arabic: "تقرت" },
      { french: "Ouargla", arabic: "ورقلة" },
      { french: "El Hadjira", arabic: "الحجيرة" },
      { french: "N'Goussa", arabic: "نقوسة" },
      { french: "Hassi Ben Abdellah", arabic: "حاسي بن عبد الله" },
      { french: "Sidi Khouiled", arabic: "سيدي خويلد" },
      { french: "Rouissat", arabic: "رويسات" },
      { french: "El Borma", arabic: "بورما" },
      { french: "Hassi Messaoud", arabic: "حاسي مسعود" },
      { french: "Nezla", arabic: "نزلة" },
      { french: "Taibet", arabic: "طيب" },
      { french: "Tebesbest", arabic: "تبسبست" },
      { french: "El Allia", arabic: "العالية" },
      { french: "Megarine", arabic: "مقارين" }
    ]
  },
  {
    id: 56,
    french: "Djanet",
    arabic: "جانت",
    communes: [
      { french: "Djanet", arabic: "جانت" },
      { french: "Tamanrasset", arabic: "تمنراست" },
      { french: "Illizi", arabic: "اليزي" },
      { french: "In Amenas", arabic: "إن أمناس" },
      { french: "Bordj Omar Driss", arabic: "برج عمر إدريس" },
      { french: "Tazrouk", arabic: "تاذروك" },
      { french: "Tamalhat", arabic: "تامالحات" },
      { french: "Tinzaouatine", arabic: "تينزاواتين" },
      { french: "Abalessa", arabic: "أباليسا" },
      { french: "Idles", arabic: "ادلس" }
    ]
  },
  {
    id: 57,
    french: "El M'Ghair",
    arabic: "المغير",
    communes: [
      { french: "El M'Ghair", arabic: "المغير" },
      { french: "El Oued", arabic: "الوادي" },
      { french: "Guemar", arabic: "قمار" },
      { french: "Kouinine", arabic: "كوينين" },
      { french: "Reguiba", arabic: "اريگيبا" },
      { french: "Sidi Aoun", arabic: "سيدي عون" },
      { french: "Nekhla", arabic: "نخلة" },
      { french: "Debila", arabic: "دبيلة" },
      { french: "Nara", arabic: "نارة" },
      { french: "Oued Zied", arabic: "وادي زيد" },
      { french: "Sahara", arabic: "الصحرا" }
    ]
  },
  {
    id: 58,
    french: "El Menia",
    arabic: "المنيعة",
    communes: [
      { french: "El Menia", arabic: "المنيعة" },
      { french: "Ghardaïa", arabic: "غرداية" },
      { french: "Laghouat", arabic: "الأغواط" },
      { french: "Metlili", arabic: "متلidi" },
      { french: "Sebseb", arabic: "سبسب" },
      { french: "Daya", arabic: "داية" },
      { french: "Mansoura", arabic: "منصورة" },
      { french: "Zelfana", arabic: "زلفانة" },
      { french: "Berriane", arabic: "بريانة" },
      { french: "El Guerrara", arabic: "قرارة" },
      { french: "Rabat", arabic: "الرباط" },
      { french: "Ksir", arabic: "قصر" },
      { french: "Hassi Gara", arabic: "حاسيkara" }
    ]
  }
];

/**
 * Get formatted wilaya display string
 * Format: "1 - Adrar - أدرار"
 */
export function getWilayaDisplay(wilaya: Wilaya): string {
  return `${wilaya.id} - ${wilaya.french} - ${wilaya.arabic}`;
}

/**
 * Get wilaya by ID
 */
export function getWilayaById(id: number): Wilaya | undefined {
  return algeriaWilayas.find(w => w.id === id);
}

/**
 * Get communes for a specific wilaya
 */
export function getCommunesByWilayaId(wilayaId: number): Commune[] {
  const wilaya = getWilayaById(wilayaId);
  return wilaya?.communes || [];
}
