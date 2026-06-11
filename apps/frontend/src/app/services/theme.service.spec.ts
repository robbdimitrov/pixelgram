import {TestBed} from '@angular/core/testing';
import {PLATFORM_ID, REQUEST} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ThemeService} from './theme.service';

function makeRequest(cookieHeader: string): Request {
  return {headers: {get: (name: string) => name.toLowerCase() === 'cookie' ? cookieHeader : null}} as unknown as Request;
}

describe('ThemeService — browser platform', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        {provide: PLATFORM_ID, useValue: 'browser'}
      ]
    });
    service = TestBed.inject(ThemeService);
    document.documentElement.setAttribute('data-theme', '');
    document.documentElement.classList.remove('dark');
  });

  it('should start with system preference (browser init deferred to afterNextRender)', () => {
    expect(service.preference).toBe('system');
    expect(service.isDarkMode).toBe(false);
  });

  it('should apply dark theme and save cookie when setPreference("dark") is called', () => {
    jest.spyOn(Storage.prototype, 'setItem');
    const cookieSetter = jest.spyOn(document, 'cookie', 'set');

    service.setPreference('dark');

    expect(service.preference).toBe('dark');
    expect(service.isDarkMode).toBe(true);
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining('theme=dark')
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply light theme when setPreference("light") is called', () => {
    service.setPreference('dark');
    service.setPreference('light');

    expect(service.isDarkMode).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should return correct optionTitle', () => {
    expect(service.optionTitle('system')).toBe('System');
    expect(service.optionTitle('light')).toBe('Light');
    expect(service.optionTitle('dark')).toBe('Dark');
  });

  it('should return true from optionActive for the current preference', () => {
    service.setPreference('dark');
    expect(service.optionActive('dark')).toBe(true);
    expect(service.optionActive('light')).toBe(false);
    expect(service.optionActive('system')).toBe(false);
  });
});

describe('ThemeService — server platform', () => {
  function createService(cookieHeader: string): ThemeService {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        {provide: PLATFORM_ID, useValue: 'server'},
        {provide: REQUEST, useValue: makeRequest(cookieHeader)}
      ]
    });
    return TestBed.inject(ThemeService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should not throw and should default to light on server with no theme cookie', () => {
    const service = createService('session=abc');
    expect(service.preference).toBe('system');
    expect(service.isDarkMode).toBe(false);
  });

  it('should apply data-theme=dark when theme=dark cookie is present on server', () => {
    const service = createService('session=abc; theme=dark');
    const doc = TestBed.inject(DOCUMENT);

    expect(service.preference).toBe('dark');
    expect(service.isDarkMode).toBe(true);
    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should apply data-theme=light when theme=light cookie is present on server', () => {
    const service = createService('theme=light');
    const doc = TestBed.inject(DOCUMENT);

    expect(service.preference).toBe('light');
    expect(service.isDarkMode).toBe(false);
    expect(doc.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
