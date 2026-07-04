import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { Settings as SettingsIcon, Monitor, Globe, Type, User } from 'lucide-react';
import { useTranslation } from '../translations';

export default function Settings() {
  const { theme, language, fontSize, setTheme, setLanguage, setFontSize } = useSettingsStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>{user?.name}</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">{t('workspace')}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('settings')}</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
        <div className="col-span-1 space-y-2">
          <div className="bg-card/40 border border-border rounded-2xl p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'text-foreground bg-muted/80' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'appearance' ? 'text-foreground bg-muted/80' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <Monitor className="w-4 h-4" /> Appearance
            </button>
            <button 
              onClick={() => setActiveTab('language')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'language' ? 'text-foreground bg-muted/80' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <Globe className="w-4 h-4" /> Language
            </button>
            <button 
              onClick={() => setActiveTab('typography')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'typography' ? 'text-foreground bg-muted/80' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <Type className="w-4 h-4" /> Typography
            </button>
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" /> Profile Settings
              </h3>
              <div className="space-y-4">
                <p className="text-muted-foreground">Profile editing is currently managed by IT.</p>
                <div className="p-4 bg-muted rounded-xl border border-border/50">
                  <p className="text-foreground font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  <p className="text-sm text-muted-foreground capitalize mt-1">Role: {user?.role}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-primary" /> Appearance
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/80 block mb-2">Theme Preference</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${theme === 'dark' ? 'bg-primary text-foreground border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      Dark Mode
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${theme === 'light' ? 'bg-primary text-foreground border-primary' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      Light Mode
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Light mode is experimental for this high-contrast theme.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" /> Language & Region
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/80 block mb-2">System Language</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setLanguage('en')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${language === 'en' ? 'bg-primary text-foreground border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      <span>English</span>
                      <span className="text-[10px] opacity-70">EN-US</span>
                    </button>
                    <button 
                      onClick={() => setLanguage('hi')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${language === 'hi' ? 'bg-primary text-foreground border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      <span>हिंदी</span>
                      <span className="text-[10px] opacity-70">HI-IN</span>
                    </button>
                    <button 
                      onClick={() => setLanguage('te')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${language === 'te' ? 'bg-primary text-foreground border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      <span>తెలుగు</span>
                      <span className="text-[10px] opacity-70">TE-IN</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Type className="w-5 h-5 text-primary" /> Typography
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/80 block mb-2">Font Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setFontSize('small')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${fontSize === 'small' ? 'bg-primary text-foreground border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      Small
                    </button>
                    <button 
                      onClick={() => setFontSize('medium')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${fontSize === 'medium' ? 'bg-primary text-foreground border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      Medium
                    </button>
                    <button 
                      onClick={() => setFontSize('large')}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${fontSize === 'large' ? 'bg-primary text-foreground border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80'}`}
                    >
                      Large
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
