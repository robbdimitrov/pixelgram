import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { FeedModule } from './screens/feed/feed.module';
import { SharedModule } from './shared/shared.module';
import { ServicesModule } from './services/services.module';
import { SignupModule } from './screens/signup/signup.module';
import { SettingsModule } from './screens/settings/settings.module';
import { ImageUploadModule } from './screens/image-upload/image-upload.module';
import { ProfileModule } from './screens/profile/profile.module';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { IconLibrary } from './shared/icon-library.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/feed',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule,
    SharedModule,
    FeedModule,
    ServicesModule,
    SignupModule,
    SettingsModule,
    ImageUploadModule,
    ProfileModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private iconLibrary: IconLibrary) {}
}
