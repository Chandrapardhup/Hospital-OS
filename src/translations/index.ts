import { useSettingsStore } from '../store/useSettingsStore';

type Translation = {
  [key: string]: {
    en: string;
    hi: string;
    te: string;
  };
};

const translations: Translation = {
  // Sidebar
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', te: 'డ్యాష్‌బోర్డ్' },
  patients: { en: 'Patients', hi: 'मरीज़', te: 'రోగులు' },
  doctors: { en: 'Doctors', hi: 'डॉक्टर', te: 'వైద్యులు' },
  appointments: { en: 'Appointments', hi: 'नियुक्तियाँ', te: 'అపాయింట్‌మెంట్‌లు' },
  emergency: { en: 'Emergency', hi: 'आपातकालीन', te: 'అత్యవసర' },
  medical_records: { en: 'Medical Records', hi: 'मेडिकल रिकॉर्ड्स', te: 'మెడికల్ రికార్డ్స్' },
  laboratory: { en: 'Laboratory', hi: 'प्रयोगशाला', te: 'ప్రయోగశాల' },
  pharmacy: { en: 'Pharmacy', hi: 'फार्मेसी', te: 'ఫార్మసీ' },
  billing: { en: 'Billing', hi: 'बिलिंग', te: 'బిల్లింగ్' },
  inventory: { en: 'Inventory', hi: 'इन्वेंटरी', te: 'ఇన్వెంటరీ' },
  analytics: { en: 'Analytics', hi: 'एनालिटिक्स', te: 'విశ్లేషణలు' },
  settings: { en: 'Settings', hi: 'सेटिंग्स', te: 'సెట్టింగ్‌లు' },
  notifications: { en: 'Notifications', hi: 'सूचनाएं', te: 'నోటిఫికేషన్‌లు' },
  workspace: { en: 'WORKSPACE', hi: 'कार्यक्षेत्र', te: 'వర్క్‌స్పేస్' },
  system: { en: 'SYSTEM', hi: 'सिस्टम', te: 'సిస్టమ్' },
  sign_out: { en: 'Sign Out', hi: 'लॉग आउट', te: 'సైన్ అవుట్' },

  // Dashboard Common
  book_appointment: { en: 'Book Appointment', hi: 'नियुक्ति बुक करें', te: 'అపాయింట్‌మెంట్ బుక్ చేయండి' },
  walkin_registration: { en: 'Walk-in Registration', hi: 'वॉक-इन पंजीकरण', te: 'వాక్-ఇన్ రిజిస్ట్రేషన్' },
  welcome_back: { en: 'Welcome back', hi: 'वापसी पर स्वागत है', te: 'తిరిగి స్వాగతం' },

  // Admin Dashboard
  command_center: { en: 'Command Center', hi: 'कमांड सेंटर', te: 'కమాండ్ సెంటర్' },
  hospital_overview: { en: 'Hospital Overview', hi: 'अस्पताल अवलोकन', te: 'ఆసుపత్రి అవలోకనం' },
};

export const useTranslation = () => {
  const language = useSettingsStore((state) => state.language);

  const t = (key: string): string => {
    if (!translations[key]) {
      // Fallback to key if not found
      return key;
    }
    return translations[key][language] || translations[key]['en'];
  };

  return { t, language };
};
