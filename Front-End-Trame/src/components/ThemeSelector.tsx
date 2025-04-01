import React from 'react';

interface Theme {
  id: string;
  name: string;
}

interface ThemeSelectorProps {
  themes: Theme[];
  selectedTheme: string;
  onThemeSelect: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, selectedTheme, onThemeSelect }) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onThemeSelect(e.target.value);
      };
    return (
        <select
          value={selectedTheme}
          onChange={handleChange}
          className="p-2 border rounded"
        >
        <option value="" disabled>
            Sélectionnez un thème
        </option>
        
        {themes.map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.name}
        </option>
        ))}
        </select>
      );
};

export default ThemeSelector;
