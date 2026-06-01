import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockMatchMedia: any;
  let mockMediaQueryList: any;

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    mockMatchMedia = jest.fn().mockReturnValue(mockMediaQueryList);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });

    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    // Reset document
    document.documentElement.setAttribute('data-theme', '');
    document.documentElement.classList.remove('dark');
  });

  it('should initialize with system theme by default', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    service = new ThemeService();
    
    expect(service.preference).toBe('system');
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalled();
  });

  it('should initialize with saved theme if available', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('dark');
    service = new ThemeService();
    
    expect(service.preference).toBe('dark');
    expect(service.isDarkMode).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should update preference and apply theme when setPreference is called', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');
    service = new ThemeService();
    
    service.setPreference('dark');
    
    expect(service.preference).toBe('dark');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(service.isDarkMode).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should return correct optionTitle', () => {
    service = new ThemeService();
    expect(service.optionTitle('system')).toBe('System');
    expect(service.optionTitle('light')).toBe('Light');
    expect(service.optionTitle('dark')).toBe('Dark');
  });

  it('should return correct optionActive', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');
    service = new ThemeService();
    
    expect(service.optionActive('light')).toBe(true);
    expect(service.optionActive('dark')).toBe(false);
    expect(service.optionActive('system')).toBe(false);
  });

  it('should update theme when system preference changes and preference is system', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('system');
    service = new ThemeService();
    
    expect(service.isDarkMode).toBe(false);
    
    const listener = mockMediaQueryList.addEventListener.mock.calls[0][1];
    
    listener({ matches: true } as MediaQueryListEvent);
    
    expect(service.isDarkMode).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  
  it('should not update theme when system preference changes and preference is not system', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');
    service = new ThemeService();
    
    expect(service.isDarkMode).toBe(false);
    
    const listener = mockMediaQueryList.addEventListener.mock.calls[0][1];
    
    listener({ matches: true } as MediaQueryListEvent);
    
    expect(service.isDarkMode).toBe(false); // Should remain false
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
