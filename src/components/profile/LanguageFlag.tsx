import React from 'react';

// Import flag images
import enFlag from '@/assets/flags/en.svg';
import esFlag from '@/assets/flags/es.svg';
import frFlag from '@/assets/flags/fr.svg';
import itFlag from '@/assets/flags/it.svg';
import deFlag from '@/assets/flags/de.svg';
import plFlag from '@/assets/flags/pl.svg';
import ruFlag from '@/assets/flags/ru.svg';
import ukFlag from '@/assets/flags/uk.svg';

// Map language codes to flag images
const flagMap: Record<string, string> = {
  en: enFlag,
  es: esFlag,
  fr: frFlag,
  it: itFlag,
  de: deFlag,
  pl: plFlag,
  ru: ruFlag,
  uk: ukFlag,
};

interface LanguageFlagProps {
  languageCode: string;
  languageName: string;
}

export const LanguageFlag: React.FC<LanguageFlagProps> = ({ languageCode, languageName }) => {
  // Use flags from public directory
  const flagSrc = `/assets/flags/${languageCode}.svg`;

  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
        <img 
          src={flagSrc} 
          alt={`${languageName} flag`} 
          className="w-full h-full object-cover"
        />
      </div>
      <span>{languageName}</span>
    </div>
  );
}; 