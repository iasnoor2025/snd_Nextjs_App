'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/use-i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, languages, isRTL } = useI18n();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang?.flag || '🌐'}</span>
          <span className="hidden md:inline">{currentLang?.name || 'Language'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
        {languages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLanguage === language.code ? 'bg-accent' : ''}
          >
            <span className={isRTL ? 'ml-2' : 'mr-2'}>{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
