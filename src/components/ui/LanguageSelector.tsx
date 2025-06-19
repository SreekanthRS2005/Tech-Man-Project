import React from 'react';
import { Code, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Language {
  id: string;
  name: string;
  version: string;
  extension: string;
  monacoId: string;
  boilerplate: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node 14+',
    extension: '.js',
    monacoId: 'javascript',
    boilerplate: `// JavaScript Solution
function solution() {
    // Write your solution here
    
    return null; // Replace with your answer
}

// Test your solution
console.log(solution());`
  },
  {
    id: 'python',
    name: 'Python',
    version: '3.8+',
    extension: '.py',
    monacoId: 'python',
    boilerplate: `# Python Solution
def solution():
    """
    Write your solution here
    """
    pass  # Replace with your implementation

# Test your solution
if __name__ == "__main__":
    print(solution())`
  },
  {
    id: 'java',
    name: 'Java',
    version: 'JDK 11+',
    extension: '.java',
    monacoId: 'java',
    boilerplate: `// Java Solution
public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.solve());
    }
    
    public Object solve() {
        // Write your solution here
        
        return null; // Replace with your answer
    }
}`
  },
  {
    id: 'c',
    name: 'C',
    version: 'gcc 9.4+',
    extension: '.c',
    monacoId: 'c',
    boilerplate: `// C Solution
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your solution here
    
    printf("Hello World\\n");
    return 0;
}`
  }
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: Language) => void;
  disabled?: boolean;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (language: Language) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-primary-500 border-primary-500'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <Code className="h-4 w-4 mr-2 text-gray-500" />
          <div className="text-left">
            <div className="font-medium text-gray-900">{selectedLang.name}</div>
            <div className="text-xs text-gray-500">{selectedLang.version}</div>
          </div>
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-500 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1" role="listbox">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.id}
                type="button"
                onClick={() => handleLanguageSelect(language)}
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors',
                  selectedLanguage === language.id && 'bg-primary-50 text-primary-700'
                )}
                role="option"
                aria-selected={selectedLanguage === language.id}
              >
                <div className="flex items-center">
                  <Code className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{language.name}</div>
                    <div className="text-sm text-gray-500">{language.version}</div>
                  </div>
                  {selectedLanguage === language.id && (
                    <div className="ml-auto">
                      <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;