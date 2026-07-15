
import { useState, useEffect, useCallback } from 'react';
import { PREDEFINED_THEMES, FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, generateCSSVariables, TERMINAL_FONT_SIZE_OPTIONS } from '../App/themes';
import { FontSizeOption, LogLevel, ThemeProperties, CustomColorOverrides } from '../App/types';
import { incrementStatistic } from '../Utils/statisticsUtils';

const LOCAL_STORAGE_THEME_OVERRIDES_KEY = 'portfolio-theme-customizations';

export const useThemeManager = (
  passedInDefaultThemeName: string,
  passedInDefaultFontFamilyId: string,
  passedInDefaultEditorFontSizeId: string,
  currentTerminalFontSizeIdExt: string,
  terminalFontSizesExt: FontSizeOption[],
  addAppLog?: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void
) => {
  const [currentThemeName, setCurrentThemeName] = useState<string>(() => localStorage.getItem('portfolio-theme') || passedInDefaultThemeName);
  const [currentFontFamilyId, setCurrentFontFamilyId] = useState<string>(() => localStorage.getItem('portfolio-font-family') || passedInDefaultFontFamilyId);
  const [currentEditorFontSizeId, setCurrentEditorFontSizeId] = useState<string>(() => localStorage.getItem('portfolio-font-size') || passedInDefaultEditorFontSizeId);

  const [customColorOverrides, setCustomColorOverrides] = useState<CustomColorOverrides>(() => {
    try {
      const savedOverrides = localStorage.getItem(LOCAL_STORAGE_THEME_OVERRIDES_KEY);
      return savedOverrides ? JSON.parse(savedOverrides) : {};
    } catch (error) {
      console.error("Failed to load theme overrides from localStorage:", error);
      if (addAppLog) addAppLog('error', "Failed to load theme overrides from localStorage.", 'ThemeManager', { error });
      return {};
    }
  });

  // Staged overrides are what the user is currently picking, not yet saved for the theme.
  // It should reflect the current theme's saved overrides initially.
  const [stagedCustomColorOverrides, setStagedCustomColorOverrides] = useState<ThemeProperties>(
    customColorOverrides[currentThemeName] || {}
  );

  const currentThemeBaseProperties = PREDEFINED_THEMES.find(theme => theme.name === currentThemeName)?.properties || PREDEFINED_THEMES[0].properties;

  const applyThemeVariables = useCallback(() => {
    const selectedTheme = PREDEFINED_THEMES.find(theme => theme.name === currentThemeName) || PREDEFINED_THEMES[0];
    document.documentElement.dataset.theme = selectedTheme.name;
    const selectedFontFamily = FONT_FAMILY_OPTIONS.find(font => font.id === currentFontFamilyId) || FONT_FAMILY_OPTIONS[0];
    const selectedEditorFontSize = FONT_SIZE_OPTIONS.find(size => size.id === currentEditorFontSizeId) || FONT_SIZE_OPTIONS[1];
    const selectedTerminalFontSize = terminalFontSizesExt.find(size => size.id === currentTerminalFontSizeIdExt) || terminalFontSizesExt[0];

    let finalThemeProperties = { ...selectedTheme.properties };

    // Apply saved custom overrides for the current theme
    const savedOverridesForCurrentTheme = customColorOverrides[currentThemeName] || {};
    finalThemeProperties = { ...finalThemeProperties, ...savedOverridesForCurrentTheme };
    
    // Then, apply any staged (live picking) overrides on top
    finalThemeProperties = { ...finalThemeProperties, ...stagedCustomColorOverrides };


    let cssVars = generateCSSVariables(finalThemeProperties);
    cssVars += `\n--editor-font-family: ${selectedFontFamily.value};`;
    cssVars += `\n--editor-font-size: ${selectedEditorFontSize.value};`;
    cssVars += `\n--editor-line-height: ${selectedEditorFontSize.lineHeight || '1.5'};`;
    cssVars += `\n--terminal-font-size: ${selectedTerminalFontSize.value};`;
    cssVars += `\n--terminal-line-height: ${selectedTerminalFontSize.lineHeight || '1.5'};`;
    
    const styleElement = document.getElementById('dynamic-theme-styles');
    if (styleElement) {
      styleElement.innerHTML = `:root {\n${cssVars}\n}`;
    } else {
      const newStyleElement = document.createElement('style');
      newStyleElement.id = 'dynamic-theme-styles';
      newStyleElement.innerHTML = `:root {\n${cssVars}\n}`;
      document.head.appendChild(newStyleElement);
    }
  }, [currentThemeName, currentFontFamilyId, currentEditorFontSizeId, currentTerminalFontSizeIdExt, customColorOverrides, stagedCustomColorOverrides, terminalFontSizesExt]);


  useEffect(() => {
    applyThemeVariables();
    localStorage.setItem('portfolio-theme', currentThemeName);
    localStorage.setItem('portfolio-font-family', currentFontFamilyId);
    localStorage.setItem('portfolio-font-size', currentEditorFontSizeId);
  }, [currentThemeName, currentFontFamilyId, currentEditorFontSizeId, currentTerminalFontSizeIdExt, applyThemeVariables]);


  const handleThemeChange = useCallback((themeName: string) => {
    setCurrentThemeName(themeName);
    // When theme changes, set staged overrides to the saved overrides for the NEW theme
    setStagedCustomColorOverrides(customColorOverrides[themeName] || {});
    const sanitizedThemeName = themeName.replace(/\+/g, '_plus_').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    incrementStatistic(`theme_usage/${sanitizedThemeName}/count`);
    if (addAppLog) addAppLog('action', `Theme changed to ${themeName}`, 'ThemeManager');
  }, [addAppLog, customColorOverrides]);

  const handleFontFamilyChange = useCallback((fontId: string) => {
    setCurrentFontFamilyId(fontId);
  }, []);

  const handleFontSizeChange = useCallback((sizeId: string) => {
    setCurrentEditorFontSizeId(sizeId);
  }, []);

  const applyCustomColorOverride = useCallback((variableName: string, colorValue: string) => {
    setStagedCustomColorOverrides(prevStaged => ({
      ...prevStaged,
      [variableName]: colorValue,
    }));
    // Live update CSS variable directly on the document
    document.documentElement.style.setProperty(variableName, colorValue);
  }, []);

  const saveCustomThemeOverrides = useCallback(() => {
    const newOverallOverrides = { ...customColorOverrides, [currentThemeName]: stagedCustomColorOverrides };
    setCustomColorOverrides(newOverallOverrides);
    localStorage.setItem(LOCAL_STORAGE_THEME_OVERRIDES_KEY, JSON.stringify(newOverallOverrides));
    // No need to call applyThemeVariables here, as useEffect for customColorOverrides will trigger it.
    // Or, if stagedCustomColorOverrides is part of applyThemeVariables deps, it will also re-apply.
    // Explicit re-application can also be done if needed: applyThemeVariables();
    if (addAppLog) addAppLog('info', `Custom theme overrides saved for ${currentThemeName}`, 'ThemeManager');
  }, [currentThemeName, stagedCustomColorOverrides, customColorOverrides, addAppLog]);

  const resetCustomThemeOverridesForCurrentTheme = useCallback(() => {
    const newOverallOverrides = { ...customColorOverrides };
    delete newOverallOverrides[currentThemeName]; // Remove all overrides for the current theme
    
    setCustomColorOverrides(newOverallOverrides);
    setStagedCustomColorOverrides({}); // Clear staged overrides
    localStorage.setItem(LOCAL_STORAGE_THEME_OVERRIDES_KEY, JSON.stringify(newOverallOverrides));
    
    // Force re-application with base theme properties by clearing document.documentElement overrides
    const baseThemeProps = PREDEFINED_THEMES.find(t => t.name === currentThemeName)?.properties || {};
    Object.keys(baseThemeProps).forEach(key => {
        if (stagedCustomColorOverrides[key]) { // If this var was in staged, reset it
            document.documentElement.style.removeProperty(key);
        }
    });
    // Re-apply theme will pick up the cleared custom overrides
    applyThemeVariables(); 

    if (addAppLog) addAppLog('info', `Custom theme overrides reset for ${currentThemeName}`, 'ThemeManager');
  }, [customColorOverrides, currentThemeName, applyThemeVariables, addAppLog, stagedCustomColorOverrides]);


  const resetSingleColorOverride = useCallback((variableName: string) => {
    const baseThemeProps = PREDEFINED_THEMES.find(t => t.name === currentThemeName)?.properties || {};
    const baseValue = baseThemeProps[variableName] || '';

    setStagedCustomColorOverrides(prevStaged => {
      const newStaged = { ...prevStaged };
      delete newStaged[variableName]; // Remove from staged
      return newStaged;
    });
    // Apply base value live
    document.documentElement.style.setProperty(variableName, baseValue);
  }, [currentThemeName]);


  // Effect to update staged overrides if currentThemeName changes (e.g. user selects a different base theme)
  useEffect(() => {
    setStagedCustomColorOverrides(customColorOverrides[currentThemeName] || {});
  }, [currentThemeName, customColorOverrides]);


  return {
    currentThemeName,
    currentFontFamilyId,
    currentFontSizeId: currentEditorFontSizeId,
    handleThemeChange,
    handleFontFamilyChange,
    handleFontSizeChange,
    // Theme customization specific exports
    customColorOverrides: stagedCustomColorOverrides, // Provide staged overrides to SettingsEditor
    currentThemeBaseProperties, // Provide base properties for comparison and reset
    applyCustomColorOverride,
    saveCustomThemeOverrides,
    resetCustomThemeOverrides: resetCustomThemeOverridesForCurrentTheme, // Renamed for clarity
    resetSingleColorOverride,
  };
};
