import {UrlSegment} from '@angular/router';

import {profileLikesMatcher, profileMatcher} from './app.routes';

describe('profile route matchers', () => {
  const segments = (...paths: string[]) => paths.map((path) => new UrlSegment(path, {}));

  it('matches canonical lowercase profile and likes routes', () => {
    expect(profileMatcher(segments('@test.user'))?.posParams?.['username'].path).toBe('test.user');
    expect(profileLikesMatcher(segments('@test_user', 'likes'))?.posParams?.['username'].path).toBe('test_user');
  });

  it('rejects fixed routes, uppercase usernames, and extra segments', () => {
    expect(profileMatcher(segments('feed'))).toBeNull();
    expect(profileMatcher(segments('@Test'))).toBeNull();
    expect(profileMatcher(segments('@test', 'likes'))).toBeNull();
    expect(profileLikesMatcher(segments('@test', 'likes', 'extra'))).toBeNull();
  });
});
