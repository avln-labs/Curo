/**
 * CURO Medicine Formulary (MVP)
 *
 * In-memory formulary of WHO essential medicines + common Indian generics and
 * brands. Served from memory (no DB round-trip) — the list is small, static,
 * and read-only, which keeps autocomplete latency <5ms.
 *
 * `schedule` flags (BR-13): 'H' | 'H1' | 'X' are controlled substances in
 * India and are surfaced as warnings in the prescription autocomplete.
 */

export type DosageForm =
  | 'tablet' | 'capsule' | 'syrup' | 'suspension' | 'injection'
  | 'cream' | 'ointment' | 'drops' | 'inhaler' | 'gel' | 'powder' | 'lotion';

export interface Medicine {
  id: string;
  name: string;            // Display name (generic or common brand)
  generic: string;         // Generic / INN name
  form: DosageForm;
  strengths: string[];     // Common strengths for quick dose fill
  category: string;        // Therapeutic class
  schedule: 'H' | 'H1' | 'X' | null;
}

let counter = 0;
function m(name: string, generic: string, form: DosageForm, strengths: string[], category: string, schedule: Medicine['schedule'] = null): Medicine {
  counter += 1;
  return { id: `med_${String(counter).padStart(3, '0')}`, name, generic, form, strengths, category, schedule };
}

export const FORMULARY: Medicine[] = [
  // ── Analgesics / Antipyretics ──
  m('Paracetamol', 'Paracetamol', 'tablet', ['500mg', '650mg', '1g'], 'Analgesic / Antipyretic'),
  m('Paracetamol Syrup', 'Paracetamol', 'syrup', ['125mg/5ml', '250mg/5ml'], 'Analgesic / Antipyretic'),
  m('Dolo 650', 'Paracetamol', 'tablet', ['650mg'], 'Analgesic / Antipyretic'),
  m('Calpol', 'Paracetamol', 'tablet', ['500mg', '650mg'], 'Analgesic / Antipyretic'),
  m('Crocin Advance', 'Paracetamol', 'tablet', ['500mg'], 'Analgesic / Antipyretic'),
  m('Ibuprofen', 'Ibuprofen', 'tablet', ['200mg', '400mg', '600mg'], 'NSAID'),
  m('Brufen', 'Ibuprofen', 'tablet', ['400mg', '600mg'], 'NSAID'),
  m('Combiflam', 'Ibuprofen + Paracetamol', 'tablet', ['400mg+325mg'], 'NSAID combination'),
  m('Diclofenac', 'Diclofenac', 'tablet', ['50mg', '75mg', '100mg SR'], 'NSAID', 'H'),
  m('Voveran', 'Diclofenac', 'tablet', ['50mg', '75mg SR'], 'NSAID', 'H'),
  m('Aceclofenac', 'Aceclofenac', 'tablet', ['100mg', '200mg SR'], 'NSAID', 'H'),
  m('Zerodol-P', 'Aceclofenac + Paracetamol', 'tablet', ['100mg+325mg'], 'NSAID combination', 'H'),
  m('Naproxen', 'Naproxen', 'tablet', ['250mg', '500mg'], 'NSAID', 'H'),
  m('Aspirin', 'Acetylsalicylic acid', 'tablet', ['75mg', '150mg', '325mg'], 'Antiplatelet / NSAID'),
  m('Ecosprin', 'Acetylsalicylic acid', 'tablet', ['75mg', '150mg'], 'Antiplatelet'),
  m('Tramadol', 'Tramadol', 'capsule', ['50mg', '100mg'], 'Opioid analgesic', 'H1'),
  m('Ultracet', 'Tramadol + Paracetamol', 'tablet', ['37.5mg+325mg'], 'Opioid analgesic', 'H1'),

  // ── Antibiotics ──
  m('Amoxicillin', 'Amoxicillin', 'capsule', ['250mg', '500mg'], 'Antibiotic (Penicillin)', 'H'),
  m('Amoxyclav 625', 'Amoxicillin + Clavulanate', 'tablet', ['500mg+125mg'], 'Antibiotic (Penicillin)', 'H'),
  m('Augmentin 625 Duo', 'Amoxicillin + Clavulanate', 'tablet', ['500mg+125mg'], 'Antibiotic (Penicillin)', 'H'),
  m('Azithromycin', 'Azithromycin', 'tablet', ['250mg', '500mg'], 'Antibiotic (Macrolide)', 'H'),
  m('Azithral 500', 'Azithromycin', 'tablet', ['500mg'], 'Antibiotic (Macrolide)', 'H'),
  m('Cefixime', 'Cefixime', 'tablet', ['100mg', '200mg'], 'Antibiotic (Cephalosporin)', 'H'),
  m('Taxim-O', 'Cefixime', 'tablet', ['200mg'], 'Antibiotic (Cephalosporin)', 'H'),
  m('Cefuroxime', 'Cefuroxime', 'tablet', ['250mg', '500mg'], 'Antibiotic (Cephalosporin)', 'H'),
  m('Ceftriaxone', 'Ceftriaxone', 'injection', ['500mg', '1g'], 'Antibiotic (Cephalosporin)', 'H'),
  m('Ciprofloxacin', 'Ciprofloxacin', 'tablet', ['250mg', '500mg'], 'Antibiotic (Fluoroquinolone)', 'H'),
  m('Ofloxacin', 'Ofloxacin', 'tablet', ['200mg', '400mg'], 'Antibiotic (Fluoroquinolone)', 'H'),
  m('Levofloxacin', 'Levofloxacin', 'tablet', ['250mg', '500mg', '750mg'], 'Antibiotic (Fluoroquinolone)', 'H'),
  m('Doxycycline', 'Doxycycline', 'capsule', ['100mg'], 'Antibiotic (Tetracycline)', 'H'),
  m('Metronidazole', 'Metronidazole', 'tablet', ['200mg', '400mg'], 'Antibiotic / Antiprotozoal', 'H'),
  m('Flagyl', 'Metronidazole', 'tablet', ['200mg', '400mg'], 'Antibiotic / Antiprotozoal', 'H'),
  m('Ornidazole', 'Ornidazole', 'tablet', ['500mg'], 'Antiprotozoal', 'H'),
  m('Nitrofurantoin', 'Nitrofurantoin', 'tablet', ['50mg', '100mg'], 'Urinary antibacterial', 'H'),
  m('Cotrimoxazole', 'Sulfamethoxazole + Trimethoprim', 'tablet', ['800mg+160mg'], 'Antibiotic (Sulfonamide)', 'H'),

  // ── Antihistamines / Cold & Cough ──
  m('Cetirizine', 'Cetirizine', 'tablet', ['5mg', '10mg'], 'Antihistamine'),
  m('Cetzine', 'Cetirizine', 'tablet', ['10mg'], 'Antihistamine'),
  m('Levocetirizine', 'Levocetirizine', 'tablet', ['5mg'], 'Antihistamine'),
  m('Fexofenadine', 'Fexofenadine', 'tablet', ['120mg', '180mg'], 'Antihistamine'),
  m('Allegra', 'Fexofenadine', 'tablet', ['120mg', '180mg'], 'Antihistamine'),
  m('Loratadine', 'Loratadine', 'tablet', ['10mg'], 'Antihistamine'),
  m('Chlorpheniramine', 'Chlorpheniramine maleate', 'tablet', ['4mg'], 'Antihistamine'),
  m('Montelukast', 'Montelukast', 'tablet', ['4mg', '5mg', '10mg'], 'Leukotriene antagonist', 'H'),
  m('Montair-LC', 'Montelukast + Levocetirizine', 'tablet', ['10mg+5mg'], 'Antiallergic combination', 'H'),
  m('Ascoril LS', 'Ambroxol + Levosalbutamol + Guaifenesin', 'syrup', ['100ml'], 'Expectorant'),
  m('Benadryl Cough Syrup', 'Diphenhydramine + Ammonium chloride', 'syrup', ['100ml', '150ml'], 'Antitussive'),
  m('Grilinctus', 'Dextromethorphan + Chlorpheniramine', 'syrup', ['100ml'], 'Antitussive'),
  m('Ambroxol', 'Ambroxol', 'syrup', ['30mg/5ml'], 'Mucolytic'),

  // ── Gastro ──
  m('Pantoprazole', 'Pantoprazole', 'tablet', ['20mg', '40mg'], 'Proton pump inhibitor', 'H'),
  m('Pan 40', 'Pantoprazole', 'tablet', ['40mg'], 'Proton pump inhibitor', 'H'),
  m('Pan-D', 'Pantoprazole + Domperidone', 'capsule', ['40mg+30mg'], 'PPI combination', 'H'),
  m('Omeprazole', 'Omeprazole', 'capsule', ['20mg', '40mg'], 'Proton pump inhibitor', 'H'),
  m('Rabeprazole', 'Rabeprazole', 'tablet', ['20mg'], 'Proton pump inhibitor', 'H'),
  m('Esomeprazole', 'Esomeprazole', 'tablet', ['20mg', '40mg'], 'Proton pump inhibitor', 'H'),
  m('Ranitidine', 'Ranitidine', 'tablet', ['150mg', '300mg'], 'H2 blocker'),
  m('Domperidone', 'Domperidone', 'tablet', ['10mg'], 'Prokinetic', 'H'),
  m('Ondansetron', 'Ondansetron', 'tablet', ['4mg', '8mg'], 'Antiemetic', 'H'),
  m('Emeset', 'Ondansetron', 'tablet', ['4mg', '8mg'], 'Antiemetic', 'H'),
  m('Digene', 'Antacid (Mg/Al hydroxide + Simethicone)', 'gel', ['200ml'], 'Antacid'),
  m('Gelusil', 'Antacid (Mg/Al hydroxide)', 'tablet', ['chewable'], 'Antacid'),
  m('Loperamide', 'Loperamide', 'tablet', ['2mg'], 'Antidiarrhoeal'),
  m('ORS (Electral)', 'Oral rehydration salts', 'powder', ['21.8g sachet'], 'Rehydration'),
  m('Lactulose', 'Lactulose', 'syrup', ['10g/15ml'], 'Laxative'),
  m('Cremaffin', 'Liquid paraffin + Milk of magnesia', 'syrup', ['225ml'], 'Laxative'),
  m('Racecadotril', 'Racecadotril', 'capsule', ['100mg'], 'Antidiarrhoeal', 'H'),

  // ── Diabetes ──
  m('Metformin', 'Metformin', 'tablet', ['500mg', '850mg', '1000mg SR'], 'Antidiabetic (Biguanide)', 'H'),
  m('Glycomet', 'Metformin', 'tablet', ['500mg', '850mg'], 'Antidiabetic (Biguanide)', 'H'),
  m('Glimepiride', 'Glimepiride', 'tablet', ['1mg', '2mg', '4mg'], 'Antidiabetic (Sulfonylurea)', 'H'),
  m('Amaryl', 'Glimepiride', 'tablet', ['1mg', '2mg'], 'Antidiabetic (Sulfonylurea)', 'H'),
  m('Sitagliptin', 'Sitagliptin', 'tablet', ['50mg', '100mg'], 'Antidiabetic (DPP-4 inhibitor)', 'H'),
  m('Vildagliptin', 'Vildagliptin', 'tablet', ['50mg'], 'Antidiabetic (DPP-4 inhibitor)', 'H'),
  m('Dapagliflozin', 'Dapagliflozin', 'tablet', ['5mg', '10mg'], 'Antidiabetic (SGLT2 inhibitor)', 'H'),
  m('Insulin Glargine (Lantus)', 'Insulin glargine', 'injection', ['100IU/ml'], 'Insulin', 'H'),
  m('Human Mixtard 30/70', 'Biphasic isophane insulin', 'injection', ['40IU/ml', '100IU/ml'], 'Insulin', 'H'),

  // ── Cardiovascular ──
  m('Amlodipine', 'Amlodipine', 'tablet', ['2.5mg', '5mg', '10mg'], 'Antihypertensive (CCB)', 'H'),
  m('Amlong', 'Amlodipine', 'tablet', ['5mg'], 'Antihypertensive (CCB)', 'H'),
  m('Telmisartan', 'Telmisartan', 'tablet', ['20mg', '40mg', '80mg'], 'Antihypertensive (ARB)', 'H'),
  m('Telma 40', 'Telmisartan', 'tablet', ['40mg'], 'Antihypertensive (ARB)', 'H'),
  m('Losartan', 'Losartan', 'tablet', ['25mg', '50mg'], 'Antihypertensive (ARB)', 'H'),
  m('Enalapril', 'Enalapril', 'tablet', ['2.5mg', '5mg', '10mg'], 'Antihypertensive (ACE inhibitor)', 'H'),
  m('Ramipril', 'Ramipril', 'tablet', ['2.5mg', '5mg', '10mg'], 'Antihypertensive (ACE inhibitor)', 'H'),
  m('Metoprolol', 'Metoprolol', 'tablet', ['25mg', '50mg', '100mg XL'], 'Beta blocker', 'H'),
  m('Atenolol', 'Atenolol', 'tablet', ['25mg', '50mg'], 'Beta blocker', 'H'),
  m('Atorvastatin', 'Atorvastatin', 'tablet', ['10mg', '20mg', '40mg'], 'Statin', 'H'),
  m('Atorva', 'Atorvastatin', 'tablet', ['10mg', '20mg'], 'Statin', 'H'),
  m('Rosuvastatin', 'Rosuvastatin', 'tablet', ['5mg', '10mg', '20mg'], 'Statin', 'H'),
  m('Clopidogrel', 'Clopidogrel', 'tablet', ['75mg'], 'Antiplatelet', 'H'),
  m('Furosemide', 'Furosemide', 'tablet', ['40mg'], 'Diuretic', 'H'),
  m('Hydrochlorothiazide', 'Hydrochlorothiazide', 'tablet', ['12.5mg', '25mg'], 'Diuretic', 'H'),

  // ── Respiratory ──
  m('Salbutamol Inhaler (Asthalin)', 'Salbutamol', 'inhaler', ['100mcg/dose'], 'Bronchodilator', 'H'),
  m('Budesonide + Formoterol (Foracort)', 'Budesonide + Formoterol', 'inhaler', ['100/6mcg', '200/6mcg'], 'ICS + LABA', 'H'),
  m('Deriphyllin', 'Etofylline + Theophylline', 'tablet', ['150mg'], 'Bronchodilator', 'H'),
  m('Salbutamol Syrup', 'Salbutamol', 'syrup', ['2mg/5ml'], 'Bronchodilator', 'H'),

  // ── Steroids / Hormones / Thyroid ──
  m('Prednisolone', 'Prednisolone', 'tablet', ['5mg', '10mg', '20mg'], 'Corticosteroid', 'H'),
  m('Wysolone', 'Prednisolone', 'tablet', ['5mg', '10mg'], 'Corticosteroid', 'H'),
  m('Dexamethasone', 'Dexamethasone', 'tablet', ['0.5mg', '4mg'], 'Corticosteroid', 'H'),
  m('Levothyroxine (Thyronorm)', 'Levothyroxine', 'tablet', ['25mcg', '50mcg', '75mcg', '100mcg'], 'Thyroid hormone', 'H'),
  m('Eltroxin', 'Levothyroxine', 'tablet', ['25mcg', '50mcg', '100mcg'], 'Thyroid hormone', 'H'),

  // ── Vitamins & Supplements ──
  m('Vitamin D3 (Uprise-D3)', 'Cholecalciferol', 'capsule', ['60000IU'], 'Vitamin supplement'),
  m('Calcium + Vitamin D3 (Shelcal)', 'Calcium carbonate + Cholecalciferol', 'tablet', ['500mg+250IU'], 'Mineral supplement'),
  m('Vitamin B-Complex (Becosules)', 'B-complex + Vitamin C', 'capsule', ['standard'], 'Vitamin supplement'),
  m('Folic Acid', 'Folic acid', 'tablet', ['5mg'], 'Vitamin supplement'),
  m('Iron + Folic Acid (Livogen)', 'Ferrous fumarate + Folic acid', 'tablet', ['152mg+1.5mg'], 'Haematinic'),
  m('Methylcobalamin', 'Mecobalamin', 'tablet', ['500mcg', '1500mcg'], 'Vitamin B12'),
  m('Zinc Sulphate', 'Zinc sulphate', 'tablet', ['20mg', '50mg'], 'Mineral supplement'),

  // ── Antifungal / Antiviral / Antiparasitic ──
  m('Fluconazole', 'Fluconazole', 'tablet', ['150mg', '200mg'], 'Antifungal', 'H'),
  m('Itraconazole', 'Itraconazole', 'capsule', ['100mg', '200mg'], 'Antifungal', 'H'),
  m('Terbinafine', 'Terbinafine', 'tablet', ['250mg'], 'Antifungal', 'H'),
  m('Clotrimazole Cream (Candid)', 'Clotrimazole', 'cream', ['1% w/w'], 'Antifungal (topical)'),
  m('Ketoconazole Shampoo', 'Ketoconazole', 'lotion', ['2% w/v'], 'Antifungal (topical)'),
  m('Acyclovir', 'Acyclovir', 'tablet', ['200mg', '400mg', '800mg'], 'Antiviral', 'H'),
  m('Oseltamivir (Tamiflu)', 'Oseltamivir', 'capsule', ['75mg'], 'Antiviral', 'H1'),
  m('Albendazole', 'Albendazole', 'tablet', ['400mg'], 'Anthelmintic', 'H'),
  m('Ivermectin', 'Ivermectin', 'tablet', ['6mg', '12mg'], 'Antiparasitic', 'H'),
  m('Permethrin Cream', 'Permethrin', 'cream', ['5% w/w'], 'Scabicide'),
  m('Hydroxychloroquine', 'Hydroxychloroquine', 'tablet', ['200mg', '400mg'], 'Antimalarial / DMARD', 'H'),

  // ── Neuro / Psych ──
  m('Alprazolam', 'Alprazolam', 'tablet', ['0.25mg', '0.5mg'], 'Anxiolytic (Benzodiazepine)', 'H1'),
  m('Clonazepam', 'Clonazepam', 'tablet', ['0.25mg', '0.5mg', '1mg'], 'Anticonvulsant / Anxiolytic', 'H1'),
  m('Zolpidem', 'Zolpidem', 'tablet', ['5mg', '10mg'], 'Hypnotic', 'H1'),
  m('Sertraline', 'Sertraline', 'tablet', ['25mg', '50mg', '100mg'], 'Antidepressant (SSRI)', 'H'),
  m('Escitalopram', 'Escitalopram', 'tablet', ['5mg', '10mg', '20mg'], 'Antidepressant (SSRI)', 'H'),
  m('Fluoxetine', 'Fluoxetine', 'capsule', ['20mg', '40mg'], 'Antidepressant (SSRI)', 'H'),
  m('Amitriptyline', 'Amitriptyline', 'tablet', ['10mg', '25mg'], 'Antidepressant (TCA)', 'H'),
  m('Gabapentin', 'Gabapentin', 'capsule', ['100mg', '300mg'], 'Neuropathic pain', 'H'),
  m('Pregabalin', 'Pregabalin', 'capsule', ['75mg', '150mg'], 'Neuropathic pain', 'H'),
  m('Levetiracetam', 'Levetiracetam', 'tablet', ['250mg', '500mg'], 'Anticonvulsant', 'H'),
  m('Sodium Valproate', 'Valproate', 'tablet', ['200mg', '500mg CR'], 'Anticonvulsant', 'H'),
  m('Flunarizine', 'Flunarizine', 'tablet', ['5mg', '10mg'], 'Migraine prophylaxis', 'H'),
  m('Sumatriptan', 'Sumatriptan', 'tablet', ['25mg', '50mg'], 'Antimigraine', 'H'),

  // ── Muscle relaxants / Others ──
  m('Chlorzoxazone (Myoril type)', 'Chlorzoxazone', 'tablet', ['250mg', '500mg'], 'Muscle relaxant', 'H'),
  m('Thiocolchicoside', 'Thiocolchicoside', 'capsule', ['4mg', '8mg'], 'Muscle relaxant', 'H'),
  m('Hyoscine (Buscopan)', 'Hyoscine butylbromide', 'tablet', ['10mg'], 'Antispasmodic'),
  m('Drotaverine (Drotin)', 'Drotaverine', 'tablet', ['40mg', '80mg'], 'Antispasmodic', 'H'),
  m('Serratiopeptidase + Diclofenac (Chymoral type)', 'Trypsin-chymotrypsin', 'tablet', ['100000 AU'], 'Anti-inflammatory enzyme', 'H'),

  // ── Eye / Ear / Topical ──
  m('Carboxymethylcellulose Eye Drops (Refresh Tears)', 'Carboxymethylcellulose', 'drops', ['0.5%', '1%'], 'Lubricant eye drops'),
  m('Moxifloxacin Eye Drops', 'Moxifloxacin', 'drops', ['0.5%'], 'Antibiotic eye drops', 'H'),
  m('Tobramycin Eye Drops', 'Tobramycin', 'drops', ['0.3%'], 'Antibiotic eye drops', 'H'),
  m('Xylometazoline Nasal Drops (Otrivin)', 'Xylometazoline', 'drops', ['0.05%', '0.1%'], 'Nasal decongestant'),
  m('Mupirocin Ointment', 'Mupirocin', 'ointment', ['2% w/w'], 'Antibiotic (topical)', 'H'),
  m('Betamethasone Cream', 'Betamethasone', 'cream', ['0.05%', '0.1%'], 'Corticosteroid (topical)', 'H'),
  m('Silver Sulfadiazine Cream', 'Silver sulfadiazine', 'cream', ['1% w/w'], 'Burn treatment', 'H'),
  m('Povidone Iodine (Betadine)', 'Povidone iodine', 'ointment', ['5%', '10%'], 'Antiseptic'),
  m('Diclofenac Gel (Volini)', 'Diclofenac', 'gel', ['1% w/w'], 'Topical NSAID'),
];

// ─── Search ──────────────────────────────────────────────────────────────────

export interface MedicineMatch extends Medicine {
  matchOn: 'name' | 'generic';
}

/**
 * Ranked prefix-first search:
 * 1. name starts with query, 2. generic starts with query,
 * 3. name contains query, 4. generic contains query.
 */
export function searchFormulary(query: string, limit = 8): MedicineMatch[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const buckets: MedicineMatch[][] = [[], [], [], []];
  for (const med of FORMULARY) {
    const name = med.name.toLowerCase();
    const generic = med.generic.toLowerCase();
    if (name.startsWith(q)) buckets[0].push({ ...med, matchOn: 'name' });
    else if (generic.startsWith(q)) buckets[1].push({ ...med, matchOn: 'generic' });
    else if (name.includes(q)) buckets[2].push({ ...med, matchOn: 'name' });
    else if (generic.includes(q)) buckets[3].push({ ...med, matchOn: 'generic' });
  }
  return buckets.flat().slice(0, limit);
}
