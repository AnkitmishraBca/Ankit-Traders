export type CatalogueCategory = {
  id: string;
  name: string;
  catPages: string;
  startPdfPage: number;
  endPdfPage: number;
};

export type CataloguePage = {
  pdfPage: number;
  catPage: number | null;
  label: string;
  title: string;
  categoryId: string;
  categoryName: string;
  image: string;
};

export type CatalogueProduct = {
  id: string;
  name: string;
  form: string;
  categoryId: string;
  categoryName: string;
  pack: string;
  mrp: string;
  uses: string;
  keywords: string;
  pdfPage: number;
  catPage: number;
  position: string;
};

export const CATALOGUE_CATEGORIES: CatalogueCategory[] = [
  {
    id: "pain",
    name: "Pain, Sciatica & Migraine Management",
    catPages: "1–2",
    startPdfPage: 4,
    endPdfPage: 5,
  },
  {
    id: "female",
    name: "Female Health",
    catPages: "3–5",
    startPdfPage: 6,
    endPdfPage: 8,
  },
  {
    id: "kids",
    name: "Kids Health",
    catPages: "6",
    startPdfPage: 9,
    endPdfPage: 9,
  },
  {
    id: "digestion",
    name: "Digestion, Acid, IBS & Prostate Care",
    catPages: "7–9",
    startPdfPage: 10,
    endPdfPage: 12,
  },
  {
    id: "diabetes",
    name: "Diabetes Care",
    catPages: "10",
    startPdfPage: 13,
    endPdfPage: 13,
  },
  {
    id: "respiratory",
    name: "Respiratory Health",
    catPages: "11",
    startPdfPage: 14,
    endPdfPage: 14,
  },
  {
    id: "heart",
    name: "Heart Care & BP Care",
    catPages: "12",
    startPdfPage: 15,
    endPdfPage: 15,
  },
  {
    id: "piles",
    name: "Piles Care",
    catPages: "13",
    startPdfPage: 16,
    endPdfPage: 16,
  },
  {
    id: "liver",
    name: "Liver Care",
    catPages: "14",
    startPdfPage: 17,
    endPdfPage: 17,
  },
  {
    id: "nervous",
    name: "Nervous System & Varicose Veins",
    catPages: "15",
    startPdfPage: 18,
    endPdfPage: 18,
  },
  {
    id: "skin",
    name: "Skin Care, Vitiligo, Psoriasis, Wart & Blood Purifier",
    catPages: "16–17",
    startPdfPage: 19,
    endPdfPage: 20,
  },
  {
    id: "male",
    name: "Male Sexual Wellness & Infertility",
    catPages: "18–19",
    startPdfPage: 21,
    endPdfPage: 22,
  },
  {
    id: "kidney",
    name: "UTI, Kidney Stone & Kidney Care",
    catPages: "20–21",
    startPdfPage: 23,
    endPdfPage: 24,
  },
  {
    id: "uric-thyroid",
    name: "Uric Acid & Thyroid Management",
    catPages: "22",
    startPdfPage: 25,
    endPdfPage: 25,
  },
  {
    id: "anxiety-sleep",
    name: "Anxiety & Sleep Disorder",
    catPages: "23",
    startPdfPage: 26,
    endPdfPage: 26,
  },
  {
    id: "dental",
    name: "Dental Care",
    catPages: "24",
    startPdfPage: 27,
    endPdfPage: 27,
  },
  {
    id: "weight",
    name: "Weight Management",
    catPages: "25",
    startPdfPage: 28,
    endPdfPage: 28,
  },
  {
    id: "eye-ear",
    name: "Eye & Ear Care",
    catPages: "26",
    startPdfPage: 29,
    endPdfPage: 29,
  },
  {
    id: "hair",
    name: "Hair Care",
    catPages: "27",
    startPdfPage: 30,
    endPdfPage: 30,
  },
  {
    id: "infections",
    name: "Infections, Platelets Enhancer & Antibiotics",
    catPages: "28",
    startPdfPage: 31,
    endPdfPage: 31,
  },
  {
    id: "softgels",
    name: "Ayurvedic Softgels",
    catPages: "29–30",
    startPdfPage: 32,
    endPdfPage: 33,
  },
  {
    id: "effervescent",
    name: "Effervescent Tablets",
    catPages: "31",
    startPdfPage: 34,
    endPdfPage: 34,
  },
  {
    id: "cosmetics",
    name: "Herbal Cosmetics",
    catPages: "32–33",
    startPdfPage: 35,
    endPdfPage: 36,
  },
  {
    id: "juices",
    name: "Ayurvedic Juices",
    catPages: "34–35",
    startPdfPage: 37,
    endPdfPage: 38,
  },
  {
    id: "nutrition",
    name: "Nutrition, Immuno Modulator & General Health",
    catPages: "36–37",
    startPdfPage: 39,
    endPdfPage: 40,
  },
  {
    id: "deaddiction",
    name: "De-Addiction",
    catPages: "38",
    startPdfPage: 41,
    endPdfPage: 41,
  },
];

function pageImage(pdfPage: number): string {
  return `/catalogue/page-${String(pdfPage).padStart(2, "0")}.webp`;
}

function buildPages(): CataloguePage[] {
  const pages: CataloguePage[] = [
    {
      pdfPage: 1,
      catPage: null,
      label: "Cover",
      title: "SB Herbals — Product Catalogue Cover",
      categoryId: "intro",
      categoryName: "Cover & Index",
      image: pageImage(1),
    },
    {
      pdfPage: 2,
      catPage: null,
      label: "About",
      title: "About SB Herbals",
      categoryId: "intro",
      categoryName: "Cover & Index",
      image: pageImage(2),
    },
    {
      pdfPage: 3,
      catPage: null,
      label: "Index",
      title: "Page of Index (All 26 Categories)",
      categoryId: "intro",
      categoryName: "Cover & Index",
      image: pageImage(3),
    },
  ];

  for (let pdfPage = 4; pdfPage <= 41; pdfPage += 1) {
    const catPage = pdfPage - 3;
    const cat = CATALOGUE_CATEGORIES.find(
      (item) => pdfPage >= item.startPdfPage && pdfPage <= item.endPdfPage,
    );
    pages.push({
      pdfPage,
      catPage,
      label: `Page ${catPage}`,
      title: cat ? cat.name : `Catalogue Page ${catPage}`,
      categoryId: cat?.id ?? "all",
      categoryName: cat?.name ?? "Catalogue",
      image: pageImage(pdfPage),
    });
  }

  pages.push({
    pdfPage: 42,
    catPage: null,
    label: "Back Cover",
    title: "SB Herbals — Contact & Back Cover",
    categoryId: "intro",
    categoryName: "Cover & Index",
    image: pageImage(42),
  });

  return pages;
}

export const CATALOGUE_PAGES: CataloguePage[] = buildPages();

type RawItem = [
  catPage: number,
  categoryId: string,
  name: string,
  form: string,
  pack: string,
  mrp: string,
  uses: string,
  keywords: string,
  position: string,
];

const RAW_PRODUCTS: RawItem[] = [
  // Cat Page 1 (PDF 4) — Pain, Sciatica & Migraine Management
  [1, "pain", "PAINOFREE Capsule (10x10)", "Capsule", "10 x 10 Capsules", "₹1,225", "Joint pain, knee pain, bone pain, back pain, muscle strain & arthritis", "paino free dard jodo ka dard gathiya sujan swelling", "Top Left"],
  [1, "pain", "PAINOFREE Pain Reliever Roll-On", "Roll-On", "50 ml", "₹160", "Sprains, strains, low back pain, muscular pain & joint pain", "paino free rollon roll on dard kamar dard", "Top Right"],
  [1, "pain", "PAINOFREE Pain Killer Oil", "Oil", "30 ml & 60 ml", "₹110 / ₹160", "Pain relieving oil for joint pain, knee pain, back pain & muscle sprain", "paino free tel maalish oil jodo ka dard", "Middle Left"],
  [1, "pain", "PAINOFREE Ointment", "Ointment", "30 gm", "₹120", "Backache, sprains, strains, joint & muscle pain, sciatica", "paino free tube gel cream malham dard", "Middle Right"],
  [1, "pain", "PAINOFREE Syrup", "Syrup", "200 ml (Sugar Free)", "₹180", "Arthritis, cervical spondylitis, frozen shoulder, backache, sciatica & joint stiffness", "paino free syrup gathiya kamar dard sugar free", "Bottom Left"],
  [1, "pain", "BONESET Capsule", "Capsule", "30 Capsules", "₹390", "Accelerates fracture healing & anti-inflammatory bone support (Hadjod)", "bone set haddi fracture hadjod bone healing", "Bottom Right"],

  // Cat Page 2 (PDF 5) — Pain, Sciatica & Migraine Management
  [2, "pain", "PINGCAL Capsule", "Capsule", "10 x 1 x 10 Capsules", "₹1,000", "Natural calcium supplement for strong bones & joint health", "ping cal calcium haddi kamjori", "Top Left"],
  [2, "pain", "PINGCAL-C Tablet", "Tablet", "60 Tablets", "₹420", "Calcium tablet for bone strength & calcium deficiency", "pingcal c ping cal calcium tablet haddi", "Top Right"],
  [2, "pain", "SCIAVIN Tablet", "Tablet", "30 Tablets", "₹360", "Ayurvedic tablet for sciatica, nerve pain & lower back radiation", "scia vin sciatica kamar nas ka dard", "Middle Left"],
  [2, "pain", "PAINOFREE MR Tablet", "Tablet", "10 x 10 Tablets", "₹1,300", "Muscle relaxant & pain relief Ayurvedic tablet", "paino free mr muscle spasm pain tablet", "Middle Right"],
  [2, "pain", "MIGRASET Capsule", "Capsule", "30 Capsules", "₹370", "Migraine, chronic headache & tension relief", "migra set migraine sir dard headache adhasisi", "Lower Left"],
  [2, "pain", "PAINOFREE Capsule (30 Cap)", "Capsule", "30 Capsules", "₹370", "Joint pain, knee pain, arthritis, backache & muscular pain", "paino free dibbi bottle joint pain gathiya", "Lower Right"],
  [2, "pain", "RHUMI ACT Oil", "Oil", "100 ml", "₹310", "Rheumatic & arthritic pain relieving herbal massage oil", "rhumiact rhumi act oil gathiya dard tel", "Bottom Left"],
  [2, "pain", "PAINOFREE Powder Sachet", "Powder", "1 x 30 Sachets (3 gm)", "₹600", "Joint pain, arthritis, swelling & muscular pain relief sachet", "paino free powder pudiya sachet dard gathiya", "Bottom Right"],

  // Cat Page 3 (PDF 6) — Female Health
  [3, "female", "LEUCOSET Syrup", "Syrup", "200 ml", "₹160", "Leucorrhoea (white discharge), weakness & female uterine health", "leuco set shwet pradar likoria white discharge ladies", "Top Left"],
  [3, "female", "CYST-YOG Capsule", "Capsule", "30 Capsules", "₹460", "Ovarian cyst, uterine fibroids, PCOD & hormonal balance", "cystyog cyst yog ganth rasoli pcod pcos ovary", "Top Right"],
  [3, "female", "CYST-YOG Syrup", "Syrup", "200 ml", "₹250", "Ovarian cyst, PCOD, irregular periods & female hormonal care", "cystyog cyst yog syrup ganth pcod pcos", "Middle Left"],
  [3, "female", "LEUCOSET Capsule (30 Cap)", "Capsule", "30 Capsules", "₹360", "Leucorrhoea, white discharge, backache & pelvic weakness", "leuco set shwet pradar likoria white discharge", "Middle Right"],
  [3, "female", "LEUCOSET Capsule (10x1x10)", "Capsule", "10 x 1 x 10 Capsules", "₹1,200", "Leucorrhoea, white discharge & female reproductive care", "leuco set strip shwet pradar likoria", "Bottom Left"],
  [3, "female", "MENOACT Capsule", "Capsule", "10 x 1 x 10 Capsules", "₹1,000", "Menopause symptoms, hot flashes, mood swings & hormonal support", "meno act menopause mahavari ladies hormone", "Bottom Right"],

  // Cat Page 4 (PDF 7) — Female Health
  [4, "female", "SUPERBUST Lotion", "Lotion", "100 ml", "₹360", "Herbal breast enhancement & firming massage lotion", "super bust breast lotion female care", "Top Left"],
  [4, "female", "PCODSET Capsule", "Capsule", "30 Capsules", "₹460", "PCOD / PCOS management, irregular menses & hormonal imbalance", "pcod set pcos irregular periods mahavari ovary", "Top Right"],
  [4, "female", "V-BLESS Intimate Hygiene Wash", "Wash", "100 ml", "₹190", "Female intimate hygiene wash — prevents itching, odour & irritation", "vbless v bless vaginal wash intimate hygiene itching", "Middle Left"],
  [4, "female", "LACTOADD Granules", "Granules", "200 gm", "₹360", "Supports healthy lactation (breast milk) in nursing mothers", "lacto add shatavari breast milk mother feeding granules", "Middle Right"],
  [4, "female", "GYNAE ACT Syrup (200 ml)", "Syrup", "200 ml", "₹160", "Complete uterine tonic for irregular periods, pain & weakness", "gynaeact gynae act ladies tonic uterus mc period", "Lower Left"],
  [4, "female", "GYNAEACT PLUS Syrup", "Syrup", "300 ml", "₹320", "Herbal uterine syrup for menstrual disorders, leucorrhoea & vitality", "gynae act plus uterine tonic ladies syrup", "Lower Right"],
  [4, "female", "GYNAE ACT Syrup (450 ml)", "Syrup", "450 ml", "₹320", "Complete uterine tonic family pack for female health & regular cycles", "gynaeact gynae act 450ml ladies uterine tonic", "Bottom Left"],
  [4, "female", "SBRON PLUS Iron Booster Tablet", "Tablet", "60 Tablets", "₹420", "Herbal iron booster tablet for anaemia, low Hb & weakness", "sb ron sbron plus iron khoon ki kami anemia haemoglobin tablet", "Bottom Right"],

  // Cat Page 5 (PDF 8) — Female Health
  [5, "female", "SBRON Syrup", "Syrup", "200 ml", "₹160", "Herbal tonic with calcium & iron for anaemia, pregnancy & weakness", "sb ron iron calcium syrup khoon ki kami hb", "Top Left"],
  [5, "female", "SBRON PLUS Syrup", "Syrup", "300 ml", "₹300", "Iron & calcium haematinic syrup for low haemoglobin & energy", "sb ron plus iron tonic khoon badhane wala syrup", "Top Right"],

  // Cat Page 6 (PDF 9) — Kids Health
  [6, "kids", "GRIPVON Gripe Water", "Liquid", "150 ml", "₹160", "Gripe water for infant colic, gas, indigestion & teething comfort", "grip von gripe water baccho ka pet dard baby gas colic", "Top Left"],
  [6, "kids", "EZYDAY-PD Tonic for Kids", "Syrup", "100 ml", "₹95", "Gentle laxative & digestive tonic for constipation & indigestion in kids", "ezy day pd kids kabj constipation baccho ka syrup", "Top Right"],
  [6, "kids", "MEDILIV Drops", "Drops", "30 ml", "₹70", "Liver protector drops for infants & children — appetite & digestion", "medi liv drops baby liver bhookh pediatric", "Middle Left"],
  [6, "kids", "KIDSET Drops", "Drops", "30 ml", "₹70", "Digestive & healthy growth tonic drops for babies & kids", "kid set drops baccho ki growth appetite digestion", "Middle Right"],
  [6, "kids", "COLD RUB Baby Cold Relief Roll-On", "Roll-On", "40 ml", "₹250", "Essential oil roll-on for baby cold, cough & nasal congestion", "coldrub baby sardi jukam khansi roll on kids", "Bottom Left"],
  [6, "kids", "SUPERACT VITAL Drop", "Drops", "30 ml", "₹75", "Multivitamin & herbal growth vitalizer drops for children", "super act vital drops baby multivitamin immunity kids", "Bottom Right"],

  // Cat Page 7 (PDF 10) — Digestion, Acid, IBS & Prostate Care
  [7, "digestion", "DIGEACT Syrup", "Syrup", "200 ml", "₹160", "Digestive enzyme syrup for gas, acidity, indigestion & loss of appetite", "dige act enzyme gas acidity badhazmi pachan bhookh", "Top Left"],
  [7, "digestion", "PINGOCID Antacid Syrup (200 ml)", "Syrup", "200 ml", "₹160", "Herbal antacid syrup for hyperacidity, heartburn, gas & gastritis", "pingo cid antacid acidity jalan gas pet", "Top Right"],
  [7, "digestion", "DIGEACT Capsule", "Capsule", "30 Capsules", "₹270", "Digestive enzyme capsule for indigestion, flatulence & bloating", "dige act enzyme capsule gas pachan", "Middle Left"],
  [7, "digestion", "PINGOCID Antacid Syrup (450 ml)", "Syrup", "450 ml", "₹320", "Herbal antacid syrup for hyperacidity, acid reflux & stomach burning", "pingo cid antacid 450ml acidity jalan gas", "Middle Right"],
  [7, "digestion", "IBS SET Capsule", "Capsule", "30 Capsules", "₹375", "Irritable Bowel Syndrome (IBS), chronic loose motion, cramps & gut care", "ibsset ibs sangrahani marod pet kharab colitis", "Bottom Left"],
  [7, "digestion", "PINGOCID Capsule", "Capsule", "10 x 1 x 10 Capsules", "₹1,200", "Herbal antacid capsule for hyperacidity, gastritis, ulcer & reflux", "pingo cid capsule gas acidity jalan", "Bottom Right"],

  // Cat Page 8 (PDF 11) — Digestion, Acid, IBS & Prostate Care
  [8, "digestion", "EZYDAY PLUS Powder", "Powder", "100 gm", "₹180", "Herbal laxative powder for chronic constipation, gas & bowel cleansing", "ezy day plus churna kabj pet saaf constipation", "Top Left"],
  [8, "digestion", "PROSTOACT Capsule (10x1x10)", "Capsule", "10 x 1 x 10 Capsules", "₹1,200", "Enlarged prostate (BPH), frequent/difficult urination & prostate health", "prosto act prostate bph peshab rukna", "Top Right"],
  [8, "digestion", "EZYDAY Laxative Tablets", "Tablet", "30 Tablets", "₹240", "Safe herbal laxative tablets for constipation & irregular bowel", "ezy day tablet kabj pet saaf constipation", "Middle Left"],
  [8, "digestion", "EZYDAY Powder", "Powder", "100 gm", "₹150", "Herbal laxative powder for constipation, acidity & hard stools", "ezy day powder churna kabj pet saaf", "Middle Right"],
  [8, "digestion", "PROSTOACT Capsule (30 Cap)", "Capsule", "30 Capsules", "₹360", "Prostate care capsule for BPH & healthy urinary flow in men", "prosto act prostate gadud peshab", "Lower Left"],
  [8, "digestion", "DIGEACT Tablet", "Tablet", "10 x 1 x 10 Tablets", "₹900", "Digestive enzyme tablet for indigestion, gas, heaviness & appetite", "dige act tablet enzyme gas pachan", "Lower Right"],
  [8, "digestion", "APT-ACT Syrup", "Syrup", "200 ml", "₹160", "Appetite stimulant & digestive syrup for poor appetite & weight", "aptact apt act bhookh badhane ka syrup appetite", "Bottom Left"],
  [8, "digestion", "PETSET Churan", "Churna", "100 gm", "₹290", "Quick relief from bloating, indigestion, gas, afara & acidity", "pet set churna powder gas afara badhazmi acidity", "Bottom Right"],

  // Cat Page 9 (PDF 12) — Digestion, Acid, IBS & Prostate Care
  [9, "digestion", "DIARROSET Syrup", "Syrup", "200 ml", "₹160", "Anti-diarrhoeal herbal syrup for loose motion, dysentery & gut infection", "diarro set dast loose motion pechish diarrhea", "Top Left"],
  [9, "digestion", "DIGEACT Syrup (Chatpat Flavour)", "Syrup", "200 ml", "₹160", "Tasty Chatpat flavour Ayurvedic digestive enzyme syrup for gas & acidity", "dige act chatpat enzyme gas acidity pachan", "Top Right"],
  [9, "digestion", "TRIPHALA Churna", "Churna", "100 gm", "₹190", "Classical Triphala churna for constipation, digestion, detox & eye health", "trifla triphala powder kabj pet saaf", "Middle Left"],

  // Cat Page 10 (PDF 13) — Diabetes Care
  [10, "diabetes", "DIABACT Syrup (200 ml)", "Syrup", "200 ml", "₹180", "Diabetes mellitus, blood sugar control & general weakness due to diabetes", "dia bact sugar madhumeh diabetes syrup", "Top Left"],
  [10, "diabetes", "DIABACT Capsule (60 Cap)", "Capsule", "60 Capsules", "₹575", "Management of maturity-onset diabetes mellitus & blood glucose levels", "dia bact sugar madhumeh diabetes capsule", "Top Right"],
  [10, "diabetes", "DIABACT Syrup (450 ml)", "Syrup", "450 ml", "₹360", "Diabetes mellitus management & diabetic weakness family pack", "dia bact 450ml sugar madhumeh diabetes syrup", "Middle Left"],
  [10, "diabetes", "DIABACT Diabetes Control Patches", "Drops + Patches", "30 ml + 30 Adhesive Tapes", "₹750", "37 potent herbs — maintains healthy glucose, insulin sensitivity & pancreas", "dia bact patch foot tape drops sugar madhumeh diabetes", "Middle Right"],
  [10, "diabetes", "DIABACT Capsule (10x1x10)", "Capsule", "10 x 1 x 10 Capsules", "₹1,000", "Controls diabetes mellitus, hepato-protective & antioxidant support", "dia bact strip sugar madhumeh diabetes capsule", "Bottom Left"],
  [10, "diabetes", "DIABACT Diabetes Powder", "Powder", "100 gm", "₹160", "8 herbs (Jamun, Karela, Gudmar, Neem, Methi, Giloy) for healthy blood sugar", "dia bact churna powder sugar madhumeh diabetes", "Bottom Right"],

  // Cat Page 11 (PDF 14) — Respiratory Health
  [11, "respiratory", "PINGKOFF-SF Cough Syrup", "Syrup", "100 ml (Sugar Free)", "₹90", "Sugar-free herbal cough syrup for dry & wet cough, sore throat & cold", "ping koff sf khansi cough syrup sugar free gala kharab", "Top Left"],
  [11, "respiratory", "PINGKOFF Cough Syrup", "Syrup", "100 ml & 200 ml", "₹90 / ₹160", "Herbal cough syrup for productive/dry cough, throat irritation & cold", "ping koff khansi sardi balgam cough syrup", "Top Right"],
  [11, "respiratory", "PINGKOFF Capsule", "Capsule", "10 x 10 Capsules", "₹900", "Cough, cold, allergic rhinitis, bronchitis & respiratory relief", "ping koff capsule khansi sardi jukam allergy", "Middle Left"],
  [11, "respiratory", "ASTHMA ACT Syrup", "Syrup", "200 ml", "₹170", "Asthma, breathlessness, bronchitis, wheezing & chronic cough", "asthmaact dama saans phoolna bronchitis cough", "Middle Right"],
  [11, "respiratory", "ASTHMA ACT Capsule (10x10)", "Capsule", "10 x 10 Capsules", "₹1,225", "Bronchial asthma, allergic cough, breathlessness & lung support", "asthmaact dama saans allergy lungs strip", "Bottom Left"],
  [11, "respiratory", "ASTHMA ACT Capsule (30 Cap)", "Capsule", "30 Capsules", "₹370", "Asthma, respiratory congestion, wheezing & bronchial health", "asthmaact dama saans phoolna lungs capsule", "Bottom Right"],

  // Cat Page 12 (PDF 15) — Heart Care & BP Care
  [12, "heart", "CHOLESTO FREE Capsule", "Capsule", "10 x 1 x 10 Capsules", "₹1,200", "Cholesterol management, lipid profile balance & healthy arteries", "cholestofree cholesterol lipid heart fat", "Top Left"],
  [12, "heart", "TRIGLOVIN Tablet", "Tablet", "10 x 10 Tablets", "₹1,200", "Reduces high triglycerides levels & supports cardiovascular health", "triglo vin triglycerides lipid cholesterol heart", "Top Right"],
  [12, "heart", "HBPSET Tablet", "Tablet", "10 x 1 x 10 Tablets", "₹1,000", "Helps control high blood pressure (hypertension) & palpitations", "hbp set high bp hypertension raktchap", "Middle Left"],
  [12, "heart", "LOBP Tablet", "Tablet", "10 x 1 x 10 Tablets", "₹1,000", "Supports normal blood pressure in low BP (hypotension), dizziness & fatigue", "lo bp low bp hypotension chakkar kamjori", "Middle Right"],
  [12, "heart", "HEARTCARE Syrup", "Syrup", "300 ml", "₹390", "Heart protective herbal tonic — strengthens cardiac muscles & circulation", "heart care dil ka tonic arjun cardiac", "Bottom Left"],
  [12, "heart", "HEARTCARE Capsule", "Capsule", "30 Capsules", "₹375", "Cardiac care tonic capsule for healthy heart function & lipid support", "heart care capsule dil cardiac cholesterol", "Bottom Right"],

  // Cat Page 13 (PDF 16) — Piles Care
  [13, "piles", "PILESACT Capsule (10x1x10)", "Capsule", "10 x 1 x 10 Capsules", "₹1,300", "Bleeding & non-bleeding piles (haemorrhoids), fissure, pain & itching", "piles act bawasir khooni badi fissure strip", "Top Left"],
  [13, "piles", "PILESACT Capsule (30 Cap)", "Capsule", "30 Capsules", "₹330", "Piles, haemorrhoids, anal fissure, burning & bleeding relief", "piles act bawasir fissure massa capsule", "Top Right"],
  [13, "piles", "PILESACT Syrup", "Syrup", "200 ml", "₹170", "Relieves piles, fissure, constipation, rectal swelling & bleeding", "piles act syrup bawasir kabj fissure", "Middle Left"],
  [13, "piles", "PILESACT Cream", "Cream", "30 gm", "₹140", "Soothing topical cream for piles pain, burning, swelling & itching", "piles act tube ointment malham bawasir cream", "Middle Right"],

  // Cat Page 14 (PDF 17) — Liver Care
  [14, "liver", "MEDILIV-DS Liver Tonic (200 ml)", "Syrup", "200 ml (Regular & SF)", "₹180", "Double strength liver tonic for fatty liver, jaundice, hepatitis & appetite", "medi liv ds liver piliya jaundice bhookh fatty liver", "Top Left"],
  [14, "liver", "MEDILIV Capsule", "Capsule", "30 Capsules", "₹270", "Hepato-stimulant capsule for liver disorders, indigestion, jaundice & anaemia", "medi liv capsule liver piliya fatty liver", "Top Right"],
  [14, "liver", "MEDILIV Tablet", "Tablet", "10 x 10 Tablets", "₹900", "Hepato-stimulant tablet for sluggish liver, jaundice & loss of appetite", "medi liv tablet liver piliya digestion", "Middle Left"],
  [14, "liver", "MEDILIV-DS Liver Tonic (450 ml)", "Syrup", "450 ml", "₹360", "Double strength liver tonic family pack for fatty liver, jaundice & digestion", "medi liv ds 450ml liver piliya bhookh", "Middle Right"],
  [14, "liver", "MEDILIV Liver Tonic", "Syrup", "200 ml", "₹160", "Herbal liver tonic for liver disorders, indigestion, jaundice & poor appetite", "medi liv syrup liver piliya bhookh", "Bottom Left"],
  [14, "liver", "MEDILIV PLUS Liver Enzyme Syrup", "Syrup", "200 ml", "₹170", "Dual-action liver tonic + digestive enzyme syrup for liver, gas & appetite", "medi liv plus liver enzyme gas bhookh", "Bottom Right"],

  // Cat Page 15 (PDF 18) — Nervous System & Varicose Veins
  [15, "nervous", "NERVO ACT Nervine Tonic", "Syrup", "200 ml", "₹180", "Herbal nervine tonic for nerve weakness, numbness, tingling & fatigue", "nervoact naso ki kamjori sunnpan neuropathy nerve", "Top Left"],
  [15, "nervous", "NERVOACT Tablet", "Tablet", "10 x 1 x 10 Tablets", "₹1,300", "Herbal nervine tablet for neuralgia, neuropathy, nerve pain & weakness", "nervo act tablet nas ka dard neuropathy", "Top Right"],
  [15, "nervous", "VARICOSET Capsule", "Capsule", "30 Capsules", "₹420", "Varicose veins, spider veins, leg swelling, heaviness & vein circulation", "varico set varicose veins pair ki nas phoolna", "Middle Left"],
  [15, "nervous", "VARICOSET Cream", "Cream", "100 gm", "₹530", "Herbal topical cream for varicose veins, aching legs & swollen veins", "varico set cream varicose veins leg pain", "Middle Right"],
  [15, "nervous", "NERVOACT GOLD Capsules", "Capsule", "10 x 1 x 10 Capsules", "₹4,600 (₹460/strip)", "Premium nervine & neuro-protective capsules for paralysis, neuropathy & strength", "nervo act gold lakwa paralysis nas kamjori nerve", "Bottom Left"],

  // Cat Page 16 (PDF 19) — Skin Care, Vitiligo, Psoriasis, Wart & Blood Purifier
  [16, "skin", "ARATAVIN Alopecia Areata Spray", "Spray", "100 ml", "₹500", "Patchy hair loss (alopecia areata / bald patches) & scalp hair regrowth", "arata vin alopecia balkhora ganja pan hair patch spray", "Top Left"],
  [16, "skin", "YOUSHINE Capsule", "Capsule", "30 Capsules", "₹300", "Blood purifier & dark spot corrector for acne, pimples, dark circles & glow", "you shine khoon saaf pimple muhase jhaiya skin", "Top Right"],
  [16, "skin", "DERMASET Tablet", "Tablet", "10 x 10 Tablets", "₹1,000", "Itching, dry eczema, ringworm, fungal infections & all types of psoriasis", "derma set daad khaj khujli fungal eczema allergy skin", "Middle Left"],
  [16, "skin", "VITILSET Capsule", "Capsule", "30 Capsules", "₹420", "Repigmentation of vitiliginous skin (vitiligo / leucoderma) & melanin support", "vitil set safed daag leucoderma vitiligo skin", "Middle Right"],
  [16, "skin", "DERMASET Lotion", "Lotion", "100 ml", "₹300", "Itching, dry eczema, ringworm, fungal skin infections & psoriasis lotion", "derma set lotion daad khaj khujli fungal eczema", "Bottom Left"],
  [16, "skin", "DERMASET Cream", "Cream", "30 gm", "₹150", "Antifungal cream for itching, skin irritation, ringworm, eczema & psoriasis", "derma set cream tube daad khaj khujli fungal", "Bottom Right"],

  // Cat Page 17 (PDF 20) — Skin Care, Vitiligo, Psoriasis, Wart & Blood Purifier
  [17, "skin", "PSORIASET Lotion", "Lotion", "100 ml", "₹340", "Psoriasis control lotion — relieves skin redness, flaking, scaling & itching", "psoria set psoriasis papdi khujli skin lotion", "Top Left"],
  [17, "skin", "WARTCURE Lotion", "Lotion", "10 ml", "₹255", "Herbal wart removing lotion for skin warts, tags & corns", "wart cure massa hatane ki dawa skin tag wart", "Top Right"],
  [17, "skin", "SOREACT Lotion", "Lotion", "10 ml", "₹85", "Fast soothing relief for mouth ulcers, oral sores & stomatitis", "sore act muh ke chhale mouth ulcer छाले", "Middle Left"],
  [17, "skin", "YOUSHINE Skin Care Cream", "Cream", "30 gm", "₹160", "Dark spots, blemishes, melasma (jhaiya), pigmentation & glowing skin", "you shine cream chehre ke daag dhabbe jhaiya fairness", "Middle Right"],
  [17, "skin", "VITILSET Lotion", "Lotion", "100 ml", "₹340", "Topical lotion for repigmentation of vitiligo / white skin patches", "vitil set lotion safed daag leucoderma vitiligo", "Lower Left"],
  [17, "skin", "YOUSHINE-AP Cream", "Cream", "30 gm", "₹180", "Anti-acne & pimple cream for clear, blemish-free skin", "you shine ap acne pimple keel muhase cream", "Lower Right"],
  [17, "skin", "YOUSHINE Syrup", "Syrup", "200 ml", "₹160", "Herbal blood purifier syrup for acne, pimples, boils, itching & glowing skin", "you shine syrup khoon saaf rakt shodhak pimple skin", "Bottom Left"],
  [17, "skin", "PSORIASET Capsule", "Capsule", "30 Capsules", "₹375", "Psoriasis management — relieves redness, scaling, dry patches & itching", "psoria set capsule psoriasis skin allergy eczema", "Bottom Right"],

  // Cat Page 18 (PDF 21) — Male Sexual Wellness & Infertility
  [18, "male", "TOPSPERM Capsule", "Capsule", "30 Capsules", "₹550", "Oligospermia, low sperm count, motility & male fertility support", "top sperm dhatu shukranu male infertility count", "Top Left"],
  [18, "male", "SHILAJIT MALT", "Malt", "400 gm", "₹410", "Strength, stamina, vigour, vitality & immunity booster malt", "shilajeet malt takat kamjori stamina energy", "Top Right"],
  [18, "male", "CHARGEFIL PLUS Tablet (30 Tab)", "Tablet", "30 Tablets", "₹1,020", "Male vigour, vitality, stamina, strength & performance support", "charge fil plus power stamina male wellness", "Middle Left"],
  [18, "male", "CHARGEFIL PLUS Tablet (10x1x10)", "Tablet", "10 x 1 x 10 Tablets", "₹3,500", "Premium male vitality, stamina, endurance & reproductive wellness tablet", "charge fil plus strip power stamina male", "Middle Right"],
  [18, "male", "SUPERACT-99 SENIOR Tablet", "Tablet", "30 Tablets", "₹1,020", "Vitality, energy, stamina & rejuvenating wellness tablet for men", "super act 99 senior takat stamina vitality", "Bottom Left"],
  [18, "male", "CHARGEFIL Massage Oil for Men", "Oil", "20 ml", "₹350", "Herbal external massage oil for male strength & local circulation", "charge fil oil men massage oil", "Bottom Right"],

  // Cat Page 19 (PDF 22) — Male Sexual Wellness & Infertility
  [19, "male", "SD YOG Granules", "Granules", "50 gm", "₹295", "Nightfall, spermatorrhoea (dhat rog), premature weakness & vitality", "sdyog dhat rog swapnadosh granules male", "Top Left"],
  [19, "male", "PURE SHILAJIT Resin", "Resin", "20 gm", "₹1,390", "100% pure Himalayan Shilajit resin for stamina, endurance, vitality & immunity", "shilajeet resin pure himalayan takat stamina", "Top Right"],
  [19, "male", "CHARGEFIL Capsule", "Capsule", "30 Capsules", "₹810", "Enhances vigour, vitality, physical strength & male stamina", "charge fil capsule virya bal vardhak stamina", "Middle Left"],
  [19, "male", "OVUMSET Capsule for Women", "Capsule", "30 Capsules", "₹550", "Supports healthy ovulation, egg quality & female fertility", "ovum set female infertility ovulation pregnancy conceive", "Middle Right"],

  // Cat Page 20 (PDF 23) — UTI, Kidney Stone & Kidney Care
  [20, "kidney", "SB ALKA Diuretic Syrup", "Syrup", "200 ml", "₹160", "Urinary alkalizer & diuretic for burning urination, UTI & kidney flushing", "sbalka peshab me jalan uti alkalizer urine", "Top Left"],
  [20, "kidney", "STONEACT Combo Pack", "Syrup + Capsule", "200 ml + 18 Capsules", "₹400", "Kidney stone tonic & capsule combo for renal calculi, pain & burning urination", "stone act combo pathri gurde ki pathri kidney stone", "Top Right"],
  [20, "kidney", "STONEACT Sachet", "Sachet", "16 Sachets (5 gm each)", "₹440", "Kidney stone flush granules sachet for renal stones & urinary tract care", "stone act sachet pudiya pathri kidney stone", "Middle Left"],
  [20, "kidney", "UROACT Capsule", "Capsule", "10 x 1 x 10 Capsules", "₹900", "Kidney stones, UTI, dysuria (painful urination) & renal health", "uro act pathri uti peshab kidney capsule", "Middle Right"],
  [20, "kidney", "UROACT Syrup", "Syrup", "200 ml", "₹180", "Urinary tract infection (UTI), kidney stones, burning micturition & renal care", "uro act syrup pathri peshab jalan uti kidney", "Bottom Left"],
  [20, "kidney", "UROACT FIZZ Sachet", "Effervescent Sachet", "16 Sachets (5 gm each)", "₹480", "Refreshing effervescent granules for UTI, burning urination & stone relief", "uro act fizz peshab jalan uti pathri", "Bottom Right"],

  // Cat Page 21 (PDF 24) — UTI, Kidney Stone & Kidney Care
  [21, "kidney", "NEFRAWIN KFT Care Syrup", "Syrup", "200 ml", "₹495", "Renal protective syrup — supports KFT, healthy creatinine, urea & kidney function", "nefra win kft kidney creatinine urea gurda renal", "Top Left"],

  // Cat Page 22 (PDF 25) — Uric Acid & Thyroid Management
  [22, "uric-thyroid", "URICSET Syrup", "Syrup", "200 ml (Sugar Free)", "₹170", "Reduces high uric acid levels, gout, joint swelling & toe/ankle pain", "uric set gout gathiya uric acid sugar free syrup", "Top Left"],
  [22, "uric-thyroid", "THYROACT Capsule", "Capsule", "30 Capsules", "₹360", "Supports healthy thyroid function & corrects hormonal imbalance", "thyro act thyroid tsh hypo hyper hormone", "Top Right"],
  [22, "uric-thyroid", "URICSET Capsule", "Capsule", "30 Capsules", "₹360", "Supports healthy uric acid levels, gout relief & normal kidney function", "uric set capsule gout uric acid joint pain", "Middle Left"],

  // Cat Page 23 (PDF 26) — Anxiety & Sleep Disorder
  [23, "anxiety-sleep", "MINDEASE Stress Relief Tablet", "Tablet", "10 x 10 Tablets", "₹1,000", "Relieves stress, anxiety, mental tension, restlessness & fatigue", "mind ease tension chinta anxiety depression stress brain", "Top Left"],
  [23, "anxiety-sleep", "NINDSET Tablet", "Tablet", "10 x 1 x 10 Tablets", "₹1,000", "Promotes natural restful sleep in insomnia, sleep disorders & anxiety", "nind set neend ki goli insomnia anidra sleep", "Top Right"],

  // Cat Page 24 (PDF 27) — Dental Care
  [24, "dental", "DENTOACT Herbal Toothpaste", "Toothpaste", "100 gm", "₹130", "Bleeding gums, pyorrhoea, toothache, sensitivity, bad breath & strong teeth", "dento act manjan paste daant dard masude pyorrhea dental", "Top Left"],

  // Cat Page 25 (PDF 28) — Weight Management
  [25, "weight", "YOUSLIM Churna", "Churna", "180 gm", "₹1,125", "Fat burner churna for obesity, belly fat, metabolism & weight loss", "you slim motapa vajan kam fat loss powder", "Top Left"],
  [25, "weight", "WEIGHT GAIN MANAGEMENT Powder", "Powder", "90 gm (30 Sachets x 3 gm)", "₹900", "Supports healthy weight gain, muscle growth, appetite & body strength", "weightgain mota hone vajan badhane ka powder sachet", "Top Right"],
  [25, "weight", "YOUSLIM Capsule", "Capsule", "60 Capsules", "₹1,125", "Herbal weight loss capsules for fat metabolism, obesity & slimming", "you slim capsule motapa vajan ghatana fat burner", "Middle Left"],

  // Cat Page 26 (PDF 29) — Eye & Ear Care
  [26, "eye-ear", "OPTIHERB Eye Drops", "Eye Drop", "10 ml", "₹80", "Soothing herbal lubricant eye drop for dry eyes, redness, burning & eye strain", "opti herb aankh ki dawa eye drop jalan redness", "Top Left"],
  [26, "eye-ear", "OTIHERB Ear Drop", "Ear Drop", "15 ml", "₹110", "Herbal ear drops for earache, ear wax, itching & mild ear infections", "oti herb kaan ka dard ear drop wax infection", "Top Right"],

  // Cat Page 27 (PDF 30) — Hair Care
  [27, "hair", "KESH101 Hair Capsule", "Capsule", "30 Capsules", "₹370", "Nourishes hair roots from within — reduces hair fall & premature greying", "kesh 101 baal jhadna safed baal hair fall capsule", "Top Left"],
  [27, "hair", "KESH 101 Hair Oil", "Oil", "120 ml", "₹210", "Anti hair fall oil — prevents dandruff, strengthens roots & promotes new hair", "kesh101 baal ka tel dandruff rusi hair fall oil", "Top Right"],
  [27, "hair", "RED ONION Hair Oil", "Oil", "100 ml", "₹260", "Red onion herbal oil for hair fall control, scalp nourishment & strong hair", "pyaz ka tel onion oil baal jhadna hair regrowth", "Middle Left"],

  // Cat Page 28 (PDF 31) — Infections, Platelets Enhancer & Antibiotics
  [28, "infections", "PLATOACT Syrup", "Syrup", "200 ml (Sugar Free)", "₹180", "Platelets enhancer tonic (Papaya, Giloy) for dengue, viral fever & low platelets", "plato act platelet badhane dengue bukhar papaya giloy", "Top Left"],
  [28, "infections", "SB BIOTIC Capsule", "Capsule", "30 Capsules", "₹300", "Herbal antibiotic & immune fighter for bacterial/viral infections & wounds", "sbbiotic antibiotic infection ghav bukhar immunity", "Top Right"],
  [28, "infections", "PLATOACT PLUS Tablet", "Tablet", "10 x 10 Tablets", "₹2,350", "Carica Papaya Leaf, Giloy & Goat Milk Powder tablet for rapid platelet boost", "plato act plus tablet platelet dengue papaya bakri doodh", "Middle Left"],
  [28, "infections", "SBFLAM-ESR Capsules", "Capsule", "30 Capsules", "₹390", "Anti-inflammatory, reduces raised ESR & boosts body resistance to infection", "sb flam esr sujan inflammation infection esr", "Middle Right"],
  [28, "infections", "FEVERACT Anti-Pyrexia Syrup", "Syrup", "200 ml (Sugar Free)", "₹170", "Herbal antipyretic syrup for fever, viral infections, body ache & malaria", "fever act bukhar jwar viral fever body pain", "Bottom Left"],
  [28, "infections", "PLATOACT Capsule", "Capsule", "10 x 1 x 10 Capsules", "₹1,750", "Platelet enhancer & immunity booster capsule in dengue & viral fever", "plato act capsule platelet dengue bukhar", "Bottom Right"],

  // Cat Page 29 (PDF 32) — Ayurvedic Softgels
  [29, "softgels", "CARTWIN Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Promotes cartilage repair, reduces joint pain, inflammation & stiffness", "cart win cartilage ghutne knee joint pain softgel", "Top Left"],
  [29, "softgels", "EWON Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Skin nourishment for wrinkles, fine lines, dull & dry skin (Vitamin E care)", "e won vitamin e skin glow jhurriya dry skin softgel", "Top Right"],
  [29, "softgels", "FLAXSEED OIL Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Natural Omega 3-6-9 for heart health, cholesterol, fatty liver, skin & hair", "flax seed alsi tel omega 3 6 9 heart cholesterol softgel", "Middle Left"],
  [29, "softgels", "HEELSET Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Relieves heel pain, sole pain, plantar fasciitis & ankle swelling", "heel set edi ka dard talwe plantar fasciitis softgel", "Middle Right"],
  [29, "softgels", "NERVOACT-CN Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,350", "Neuropathy, nerve pain, sciatica, numbness & nervine nourishment softgel", "nervo act cn nas ka dard sunnpan neuropathy softgel", "Bottom Left"],
  [29, "softgels", "OESTOFLEX Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Osteoarthritis, joint pain, swelling, stiffness & mobility support softgel", "oesto flex osteoflex osteoarthritis jodo ka dard joint softgel", "Bottom Right"],

  // Cat Page 30 (PDF 33) — Ayurvedic Softgels
  [30, "softgels", "SPINEKAART Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Degenerative disc, spondylitis, slip disc, upper & lower back pain & osteoarthritis", "spine kaart spinecart reedh kamar dard slip disc spondylitis", "Top Left"],
  [30, "softgels", "SB-PRIM 1000 Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,500", "Evening Primrose Oil 1000 mg + Wheat Germ Oil for PMS, menopause, skin & arthritis", "sbprim primrose pms menopause hormone skin ladies softgel", "Top Right"],
  [30, "softgels", "SUPERACT VITAL 9G Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "9G energy formula (Ginseng, Ginkgo, Green Tea, Lycopene) for stamina, immunity & fatigue", "super act vital 9g multivitamin kamjori takat thakan energy", "Middle Left"],
  [30, "softgels", "SUPER-ACT VITAL Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,250", "Multivitamins, multiminerals with Ginseng & Ashwagandha for daily vitality", "superact vital multivitamin ginseng kamjori takat softgel", "Middle Right"],
  [30, "softgels", "PINGCAL-C PLUS Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,200", "Calcium + Magnesium + Zinc + Hadjod for strong bones, muscles & joint flexibility", "ping cal c plus calcium haddi bone joint softgel", "Lower Left"],
  [30, "softgels", "LIGAVIN Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Tendon & ligament injury recovery, sprains & anti-inflammatory joint care", "liga vin ligament tear moch tendon sports injury softgel", "Lower Right"],
  [30, "softgels", "CERVICAA Softgel Capsule", "Softgel", "10 x 1 x 10 Softgels", "₹1,300", "Cervical spondylosis, neck pain, shoulder stiffness, radiculopathy & fibromyalgia", "cervica gardan kandhe ka dard cervical spondylitis neck", "Bottom Left"],

  // Cat Page 31 (PDF 34) — Effervescent Tablets
  [31, "effervescent", "GREEN TEA Effervescent Tablets", "Effervescent Tab", "16 Tablets", "₹295", "Antioxidant green tea fizzy tablets for metabolism, detox, energy & weight care", "greentea fizz detox slimming weight antioxidant", "Top Left"],
  [31, "effervescent", "STONEACT Effervescent Tablets", "Effervescent Tab", "16 Tablets", "₹425", "Kidney stone, burning urination & urinary tract care effervescent tablets", "stone act fizz tablet pathri uti peshab kidney", "Top Right"],
  [31, "effervescent", "APPLE CIDER VINEGAR Effervescent Tablets", "Effervescent Tab", "16 Tablets", "₹350", "Supports weight management, digestion, metabolism & gut detox", "acv apple cider sirka motapa weight loss fizz tablet", "Middle Left"],

  // Cat Page 32 (PDF 35) — Herbal Cosmetics
  [32, "cosmetics", "CHARCOAL Deep Clean Facewash", "Facewash", "100 ml", "₹190", "Removes excess oil, dirt, pollution toxins, clogged pores & whiteheads", "activated charcoal face wash oily skin pimple", "Top Left"],
  [32, "cosmetics", "YOUSHINE Ubtan Facewash", "Facewash", "60 ml", "₹170", "Haldi-Chandan ubtan facewash to cleanse, brighten & clarify complexion", "you shine ubtan haldi chandan face wash glow tan", "Top Right"],
  [32, "cosmetics", "HALDI CHANDAN Soap", "Soap", "100 gm", "₹120", "Skin brightening & moisturizing herbal bathing soap with Haldi & Chandan", "sabun haldi chandan soap cosmetic bath", "Middle Left"],
  [32, "cosmetics", "NEEM TULSI ALOEVERA Soap", "Soap", "100 gm", "₹120", "Antibacterial & anti-pimple herbal bathing soap for clean, healthy skin", "sabun neem tulsi aloe vera soap khujli pimple", "Middle Left"],
  [32, "cosmetics", "ACTIVATED CHARCOAL Soap", "Soap", "100 gm", "₹125", "Deep cleansing & detoxifying activated charcoal herbal bathing soap", "sabun charcoal soap deep clean oil control", "Middle Left"],
  [32, "cosmetics", "NATURAL ROSE Soap", "Soap", "100 gm", "₹125", "Glowing, refreshing & nourishing natural rose herbal bathing soap", "sabun gulab rose soap cosmetic bath", "Middle Left"],
  [32, "cosmetics", "NEEM TULSI ALOEVERA Facewash", "Facewash", "100 ml", "₹180", "Acne & oil control antibacterial facewash for pimples & clear skin", "neem tulsi aloe vera face wash pimple acne oily skin", "Middle Right"],
  [32, "cosmetics", "KESH 101 Hair Cleanser (Shampoo)", "Shampoo", "200 ml", "₹255", "Hibiscus & Aloevera anti-hair fall shampoo for dandruff, silky & strong hair", "kesh101 shampoo baal jhadna dandruff rusi cleanser", "Bottom Left"],
  [32, "cosmetics", "RED ONION Shampoo with Conditioner", "Shampoo", "200 ml", "₹349", "Red onion, Aloevera, Amla & Neem shampoo for hair fall, split ends & regrowth", "pyaz onion shampoo conditioner hair fall long hair", "Bottom Right"],

  // Cat Page 33 (PDF 36) — Herbal Cosmetics
  [33, "cosmetics", "ALOEVERA Hydrating Gel", "Gel", "120 gm", "₹160", "Soothing multipurpose hydrating Aloe Vera gel for skin glow, sunburn & hair", "aloe vera gel face skin moisturizing cosmetic", "Top Left"],
  [33, "cosmetics", "ANTISEPTIC Multipurpose Cream", "Cream", "20 gm", "₹85", "Herbal multipurpose antiseptic cream for cuts, burns, cracked heels, dry skin & rashes", "antiseptic cream katna jalna fati edi dry skin tube", "Top Right"],

  // Cat Page 34 (PDF 37) — Ayurvedic Juices
  [34, "juices", "APPLE CIDER VINEGAR Juice", "Juice", "500 ml", "₹530", "Raw Ayurvedic Apple Cider Vinegar for weight management, digestion & cholesterol", "acv seb ka sirka fat loss motapa digestion juice", "Top Left"],
  [34, "juices", "AMLA Juice", "Juice", "500 ml", "₹280", "Natural Vitamin C rich Amla juice for immunity, digestion, eyes, skin & hair", "awla aonla amla ras vitamin c immunity hair juice", "Top Right"],
  [34, "juices", "GILOY Juice", "Juice", "500 ml", "₹280", "Immunity booster, antipyretic & detoxifying Giloy ras for fever & general health", "guduchi giloy ras immunity bukhar fever platelet juice", "Middle Left"],
  [34, "juices", "NEEM KARELA JAMUN Juice", "Juice", "500 ml", "₹280", "Classical diabetes care juice for healthy blood sugar, digestion & blood purification", "nkj neem karela jamun ras sugar madhumeh diabetes juice", "Middle Right"],
  [34, "juices", "ARJUN ASHWAGANDHA Juice", "Juice", "500 ml", "₹290", "Cardiac wellness, healthy BP, cholesterol, stamina & stress relief juice", "arjuna ashwagandha ras heart dil bp cholesterol stamina juice", "Bottom Left"],
  [34, "juices", "NIRGUNDI Juice", "Juice", "500 ml", "₹280", "Relieves joint pain, arthritis, sciatica, inflammation & muscular stiffness", "nirgundi ras jodo ka dard gathiya sciatica swelling juice", "Bottom Right"],

  // Cat Page 35 (PDF 38) — Ayurvedic Juices
  [35, "juices", "MAKOY PUNARNAVA Juice", "Juice", "500 ml", "₹360", "Supports liver health, reduces internal swelling (oedema), kidney & digestion care", "makoi punarnava ras liver sujan swelling jaundice kidney juice", "Top Left"],
  [35, "juices", "YOUSLIM Juice", "Juice", "500 ml", "₹395", "Helps burn body fat, boosts metabolism & supports natural weight loss", "you slim ras motapa vajan kam fat burner juice", "Top Right"],
  [35, "juices", "SEA BUCKTHORN & AMLA Juice", "Juice", "500 ml", "₹530", "Rich in Omega 3, 6, 7 & 9 — boosts immunity, heart, liver, skin & digestion", "seabuckthorn amla omega antioxidant immunity skin juice", "Middle Left"],
  [35, "juices", "MIX BERRIES Juice", "Juice", "500 ml", "₹530", "Antioxidant-rich mixed berries juice for immunity, heart health, energy & glow", "mixed berry antioxidant multivitamin immunity heart juice", "Middle Right"],
  [35, "juices", "NONI Juice (with Garcinia & Wheatgrass)", "Juice", "500 ml", "₹330", "Cellular detox, immunity booster, joint support, energy & weight management", "noni garcinia wheatgrass ras immunity energy detox juice", "Lower Left"],
  [35, "juices", "ALOEVERA Juice", "Juice", "500 ml", "₹280", "Complete digestive tonic for constipation, acidity, liver detox & glowing skin", "aloe vera ghritkumari ras pet saaf kabj skin juice", "Lower Right"],
  [35, "juices", "SHEETAL RAS Juice", "Juice", "500 ml", "₹320", "Calms excess body heat, hyperacidity, gas, stomach burning & summer fatigue", "shital sheetal ras pet ki garmi jalan acidity gas juice", "Bottom Left"],

  // Cat Page 36 (PDF 39) — Nutrition, Immuno Modulator & General Health
  [36, "nutrition", "SUPERACT VITAL Syrup (200 ml)", "Syrup", "200 ml", "₹160", "Herbal vitalizer & multivitamin syrup for weakness, fatigue, appetite & immunity", "super act vital syrup takat kamjori multivitamin tonic", "Top Left"],
  [36, "nutrition", "SUPERACT VITAL Syrup (450 ml)", "Syrup", "450 ml", "₹320", "Herbal vitalizer family tonic for energy, stamina, recovery & immunity", "super act vital 450ml takat kamjori multivitamin family tonic", "Top Right"],
  [36, "nutrition", "SUPERACT VITAL Ayurvedic Malt", "Malt", "400 gm", "₹350", "Delicious Ayurvedic health malt for energy, stamina, weight, immunity & vigour", "super act vital malt chawanprash takat kamjori nutrition", "Middle Left"],
  [36, "nutrition", "CITRICEE Vitamin C Tablet", "Tablet", "150 Tablets (Box)", "₹1,050 / Box", "Natural Vitamin C chewable tablets for immunity, skin glow & antioxidant defence", "citri cee vitamin c chewable immunity cold skin", "Middle Right"],

  // Cat Page 37 (PDF 40) — Nutrition, Immuno Modulator & General Health
  [37, "nutrition", "BRAIN-O-HERB Syrup", "Syrup", "200 ml", "₹160", "Memory booster, focus, concentration & mental fatigue relief brain tonic", "brainoherb brain o herb dimag yaaddasht memory tonic students", "Top Left"],
  [37, "nutrition", "BRAIN-O-HERB Malt", "Malt", "400 gm", "₹380", "Ayurvedic brain & memory nourishing malt for children, students & adults", "brainoherb brain o herb malt dimag memory concentration", "Top Right"],
  [37, "nutrition", "PANCH TULSI Drops", "Drops", "20 ml", "₹205", "5-Tulsi extract drops for daily immunity, cough, cold, sore throat & water detox", "panchtulsi tulsi ark drop immunity sardi khansi cough", "Middle Left"],

  // Cat Page 38 (PDF 41) — De-Addiction
  [38, "deaddiction", "ADDIFREE Syrup", "Syrup", "200 ml", "₹240", "Herbal de-addiction support to quit alcohol, smoking, tobacco & reduce cravings", "addi free nasha mukti sharab daru gutkha smoking quit", "Top Left"],
  [38, "deaddiction", "ADDIFREE Powder", "Powder", "90 gm (30 Sachets x 3 gm)", "₹1,050", "Herbal de-addiction sachets for alcohol, tobacco, smoking withdrawal & liver detox", "addi free powder pudiya nasha mukti sharab daru gutkha", "Top Right"],
];

const CATEGORY_MAP = new Map(CATALOGUE_CATEGORIES.map((c) => [c.id, c.name]));

export const CATALOGUE_PRODUCTS: CatalogueProduct[] = RAW_PRODUCTS.map((item, idx) => {
  const [catPage, categoryId, name, form, pack, mrp, uses, keywords, position] = item;
  return {
    id: `prod-${idx + 1}`,
    name,
    form,
    categoryId,
    categoryName: CATEGORY_MAP.get(categoryId) ?? "Catalogue",
    pack,
    mrp,
    uses,
    keywords,
    catPage,
    pdfPage: catPage + 3,
    position,
  };
});

export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function compactSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
