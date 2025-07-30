'use client';

import { useI18n } from '@/hooks/use-i18n';

export default function TestRTLPage() {
  const { currentLanguage, isRTL, changeLanguage, languages } = useI18n();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">RTL Sidebar Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold mb-2">Current State</h2>
          <p><strong>Language:</strong> {currentLanguage}</p>
          <p><strong>Is RTL:</strong> {isRTL ? 'Yes' : 'No'}</p>
          <p><strong>Sidebar Position:</strong> {isRTL ? 'Right' : 'Left'}</p>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold mb-2">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Switch to Arabic using the language switcher in the header</li>
            <li>Observe that the sidebar moves to the right side</li>
            <li>Switch back to English</li>
            <li>Observe that the sidebar moves back to the left side</li>
          </ol>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="font-semibold mb-2">Quick Language Switch</h2>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`px-4 py-2 rounded ${
                  currentLanguage === lang.code
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h2 className="font-semibold mb-2">Expected Behavior</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Sidebar should be on the left in English (LTR)</li>
            <li>Sidebar should be on the right in Arabic (RTL)</li>
            <li>Content should flow correctly in both directions</li>
            <li>Header elements should adjust for RTL</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 