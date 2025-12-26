import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  // Header
  'header.title': { en: 'Abbas AI', ar: 'عباس AI' },
  'header.generate': { en: 'Generate', ar: 'إنشاء' },
  'header.history': { en: 'History', ar: 'السجل' },
  
  // Auth
  'auth.login': { en: 'Log in', ar: 'تسجيل الدخول' },
  'auth.logout': { en: 'Log out', ar: 'تسجيل الخروج' },
  'auth.signup': { en: 'Sign up', ar: 'إنشاء حساب' },
  'auth.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور' },
  'auth.confirmLogout': { en: 'Are you sure you want to log out?', ar: 'هل أنت متأكد أنك تريد تسجيل الخروج؟' },
  'auth.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'auth.confirm': { en: 'Confirm', ar: 'تأكيد' },
  'auth.noAccount': { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  'auth.hasAccount': { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  
  // Hero
  'hero.title': { en: 'AI-Abbas Image Generation', ar: 'توليد الصور بواسطة عباس AI' },
  'hero.subtitle': { en: 'Transform your ideas into images using Abbas AI. Describe what you want, and watch it come to life. Specialized in educational infographics.', ar: 'حوّل أفكارك إلى صور باستخدام عباس AI. صف ما تريد وشاهده يتحقق أمامك. متخصص في الرسوم التعليمية التوضيحية.' },
  
  // Generator
  'generator.placeholder': { en: 'Describe the image you want to create...', ar: 'صف الصورة التي تريد إنشاءها...' },
  'generator.generate': { en: 'Generate', ar: 'إنشاء' },
  'generator.generating': { en: 'Generating...', ar: 'جاري الإنشاء...' },
  'generator.upload': { en: 'Upload image for reference', ar: 'رفع صورة كمرجع' },
  'generator.download': { en: 'Download', ar: 'تحميل' },
  'generator.removeImage': { en: 'Remove', ar: 'إزالة' },
  
  // History
  'history.title': { en: 'Your Generation History', ar: 'سجل الإنشاءات الخاصة بك' },
  'history.empty': { en: 'No images generated yet. Start creating!', ar: 'لم يتم إنشاء أي صور بعد. ابدأ بالإنشاء!' },
  'history.prompt': { en: 'Prompt', ar: 'الوصف' },
  'history.date': { en: 'Date', ar: 'التاريخ' },
  
  // Theme
  'theme.light': { en: 'Light', ar: 'فاتح' },
  'theme.dark': { en: 'Dark', ar: 'داكن' },
  
  // Errors
  'error.generation': { en: 'Failed to generate image. Please try again.', ar: 'فشل في إنشاء الصورة. يرجى المحاولة مرة أخرى.' },
  'error.login': { en: 'Login failed. Please check your credentials.', ar: 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.' },
  'error.signup': { en: 'Sign up failed. Please try again.', ar: 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.' },
  
  // Success
  'success.generated': { en: 'Image generated successfully!', ar: 'تم إنشاء الصورة بنجاح!' },
  'success.loggedIn': { en: 'Welcome back!', ar: 'مرحباً بعودتك!' },
  'success.signedUp': { en: 'Account created successfully!', ar: 'تم إنشاء الحساب بنجاح!' },
  'success.loggedOut': { en: 'Logged out successfully', ar: 'تم تسجيل الخروج بنجاح' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('abbas-ai-language') as Language;
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('abbas-ai-language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
