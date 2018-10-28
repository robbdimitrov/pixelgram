webpackJsonp(["main"],{

/***/ "../../../../../src/$$_lazy_route_resource lazy recursive":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "../../../../../src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "../../../../../src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n  <pg-header></pg-header>\n\n  <pg-toast *ngIf=\"error()\"\n    content=\"{{error()}}\"\n    (onClose)=\"onCloseToast()\">\n  </pg-toast>\n\n  <router-outlet></router-outlet>\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/app.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_error_service__ = __webpack_require__("../../../../../src/app/services/error.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var AppComponent = (function () {
    function AppComponent(errorService) {
        this.errorService = errorService;
    }
    AppComponent.prototype.error = function () {
        return this.errorService.error;
    };
    AppComponent.prototype.onCloseToast = function () {
        this.errorService.error = undefined;
    };
    AppComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-root',
            template: __webpack_require__("../../../../../src/app/app.component.html"),
            styles: [__webpack_require__("../../../../../src/app/app.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_error_service__["a" /* ErrorService */]])
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "../../../../../src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__ = __webpack_require__("../../../platform-browser/esm5/platform-browser.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__app_component__ = __webpack_require__("../../../../../src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__screens_feed_feed_module__ = __webpack_require__("../../../../../src/app/screens/feed/feed.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__shared_shared_module__ = __webpack_require__("../../../../../src/app/shared/shared.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__services_services_module__ = __webpack_require__("../../../../../src/app/services/services.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__screens_login_login_module__ = __webpack_require__("../../../../../src/app/screens/login/login.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__screens_signup_signup_module__ = __webpack_require__("../../../../../src/app/screens/signup/signup.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__screens_settings_settings_module__ = __webpack_require__("../../../../../src/app/screens/settings/settings.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__screens_image_upload_image_upload_module__ = __webpack_require__("../../../../../src/app/screens/image-upload/image-upload.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__screens_profile_profile_module__ = __webpack_require__("../../../../../src/app/screens/profile/profile.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__shared_components_not_found_not_found_component__ = __webpack_require__("../../../../../src/app/shared/components/not-found/not-found.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};













var routes = [
    {
        path: '',
        redirectTo: '/feed',
        pathMatch: 'full'
    },
    {
        path: '**',
        component: __WEBPACK_IMPORTED_MODULE_12__shared_components_not_found_not_found_component__["a" /* NotFoundComponent */]
    }
];
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__app_component__["a" /* AppComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* RouterModule */].forRoot(routes),
                __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_5__shared_shared_module__["a" /* SharedModule */],
                __WEBPACK_IMPORTED_MODULE_4__screens_feed_feed_module__["a" /* FeedModule */],
                __WEBPACK_IMPORTED_MODULE_6__services_services_module__["a" /* ServicesModule */],
                __WEBPACK_IMPORTED_MODULE_7__screens_login_login_module__["a" /* LoginModule */],
                __WEBPACK_IMPORTED_MODULE_8__screens_signup_signup_module__["a" /* SignupModule */],
                __WEBPACK_IMPORTED_MODULE_9__screens_settings_settings_module__["a" /* SettingsModule */],
                __WEBPACK_IMPORTED_MODULE_10__screens_image_upload_image_upload_module__["a" /* ImageUploadModule */],
                __WEBPACK_IMPORTED_MODULE_11__screens_profile_profile_module__["a" /* ProfileModule */]
            ],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_3__app_component__["a" /* AppComponent */]]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "../../../../../src/app/config/client.config.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return apiRoot; });
var apiRoot = 'http://127.0.0.1:3000/api/v1.0';


/***/ }),

/***/ "../../../../../src/app/models/image.model.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Image; });
var Image = (function () {
    function Image(id, owner, filename, dateCreated, description, likes, isLiked) {
        this.id = id;
        this.owner = owner;
        this.filename = filename;
        this.dateCreated = dateCreated;
        this.description = description;
        this.likes = likes;
        this.isLiked = isLiked;
    }
    return Image;
}());



/***/ }),

/***/ "../../../../../src/app/models/user.model.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return User; });
var User = (function () {
    function User(id, name, username, email, avatar, bio, images, likes) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.avatar = avatar;
        this.bio = bio;
        this.images = images;
        this.likes = likes;
    }
    return User;
}());



/***/ }),

/***/ "../../../../../src/app/screens/feed/feed.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <pg-image *ngFor=\"let image of images\"\n    [image]=\"image\"\n    (like)=\"onLike($event)\"\n    (unlike)=\"onUnlike($event)\"\n    (showProfile)=\"onShowProfile($event)\"\n    (deleteAction)=\"onDeleteAction($event)\">\n  </pg-image>\n\n  <button id=\"next\" *ngIf=\"images.length > 5\" class=\"button outline-button round-corners\"\n    (click)=\"onNextClick()\">\n    Next\n  </button>\n\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/screens/feed/feed.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".container {\n  padding-bottom: 20px; }\n\nbutton#next {\n  display: block;\n  margin-left: auto;\n  margin-right: auto;\n  min-width: 100px; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/feed/feed.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return FeedComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_common__ = __webpack_require__("../../../common/esm5/common.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_user_cache_service__ = __webpack_require__("../../../../../src/app/services/user-cache.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var FeedComponent = (function () {
    function FeedComponent(apiClient, router, userCache, session, route, location) {
        var _this = this;
        this.apiClient = apiClient;
        this.router = router;
        this.userCache = userCache;
        this.session = session;
        this.route = route;
        this.location = location;
        this.images = [];
        this.page = 0;
        this.isSingleImageMode = false;
        this.subscribeToLogout();
        this.route.params.subscribe(function (params) {
            if (params['id'] !== undefined) {
                var id = params['id'];
                _this.isSingleImageMode = true;
                _this.loadImage(id);
            }
            else if (params['userId'] !== undefined) {
                _this.userId = params['userId'];
            }
        });
    }
    // Subscriptions
    FeedComponent.prototype.subscribeToLogout = function () {
        var _this = this;
        this.loginSubscription = this.apiClient.loginSubject.subscribe(function (value) {
            if (value === __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__["b" /* UserDidLogoutNotification */]) {
                _this.page = 0;
                _this.images = [];
                _this.router.navigate(['/login']);
            }
        });
    };
    // Component lifecycle
    FeedComponent.prototype.ngAfterViewInit = function () {
        if (!this.isSingleImageMode) {
            this.loadNextPage();
        }
    };
    FeedComponent.prototype.ngOnDestroy = function () {
        this.loginSubscription.unsubscribe();
    };
    // Data
    FeedComponent.prototype.loadNextPage = function () {
        var _this = this;
        var promise = (this.userId ?
            this.apiClient.getUsersLikedImages(this.userId, this.page) :
            this.apiClient.getAllImages(this.page));
        promise.then(function (result) {
            if (result.length) {
                (_a = _this.images).push.apply(_a, result);
                _this.page += 1;
            }
            var _a;
        }).catch(function (error) {
            console.log('Error loading images: ' + error);
        });
    };
    FeedComponent.prototype.loadImage = function (imageId) {
        var self = this;
        this.apiClient.getImage(imageId).then(function (result) {
            self.images.push(result);
        }).catch(function (error) {
            console.log('Loading user failed: ' + error);
        });
    };
    // Actions
    FeedComponent.prototype.onLike = function (imageId) {
        this.apiClient.likeImage(imageId).then(function (result) {
        }).catch(function (error) {
        });
    };
    FeedComponent.prototype.onUnlike = function (imageId) {
        this.apiClient.unlikeImage(this.session.userId(), imageId).then(function (result) {
        }).catch(function (error) {
        });
    };
    FeedComponent.prototype.onShowProfile = function (userId) {
        this.router.navigate(['/user', userId]);
    };
    FeedComponent.prototype.onNextClick = function () {
        this.loadNextPage();
    };
    FeedComponent.prototype.onDeleteAction = function (image) {
        var index = this.images.indexOf(image);
        if (index > -1) {
            this.images.splice(index, 1);
        }
        var self = this;
        this.apiClient.deleteImage(image.id).then(function (result) {
            if (self.isSingleImageMode && self.images.length === 0) {
                self.location.back();
            }
        }).catch(function (error) {
        });
    };
    FeedComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            template: __webpack_require__("../../../../../src/app/screens/feed/feed.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/feed/feed.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_3__services_api_client_service__["a" /* APIClient */], __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__services_user_cache_service__["a" /* UserCache */], __WEBPACK_IMPORTED_MODULE_5__services_session_service__["a" /* Session */],
            __WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* ActivatedRoute */], __WEBPACK_IMPORTED_MODULE_2__angular_common__["f" /* Location */]])
    ], FeedComponent);
    return FeedComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/feed/feed.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return FeedModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/auth-guard.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__feed_component__ = __webpack_require__("../../../../../src/app/screens/feed/feed.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__image_image_component__ = __webpack_require__("../../../../../src/app/screens/feed/image/image.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__shared_shared_module__ = __webpack_require__("../../../../../src/app/shared/shared.module.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






var routes = [
    {
        path: 'feed',
        component: __WEBPACK_IMPORTED_MODULE_3__feed_component__["a" /* FeedComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    },
    {
        path: 'image/:id',
        component: __WEBPACK_IMPORTED_MODULE_3__feed_component__["a" /* FeedComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    },
    {
        path: 'user/:userId/likes',
        component: __WEBPACK_IMPORTED_MODULE_3__feed_component__["a" /* FeedComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    }
];
var FeedModule = (function () {
    function FeedModule() {
    }
    FeedModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__feed_component__["a" /* FeedComponent */],
                __WEBPACK_IMPORTED_MODULE_4__image_image_component__["a" /* ImageComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_5__shared_shared_module__["a" /* SharedModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* RouterModule */].forChild(routes)
            ]
        })
    ], FeedModule);
    return FeedModule;
}());



/***/ }),

/***/ "../../../../../src/app/screens/feed/image/image.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n\n  <div class=\"header\">\n    <div class=\"user-content\">\n      <img\n        [src]=\"'avatar' | user:image.owner | async | image:'/assets/images/avatar_placeholder.png'\"\n        (click)=\"onProfileClick()\">\n\n      <span class=\"bold\"\n        (click)=\"onProfileClick()\">\n        {{'username' | user:image.owner | async}}\n      </span>\n    </div>\n\n    <button *ngIf=\"isOwnedByCurrentUser()\"\n      class=\"dropdown-button\"\n      (click)=\"optionsOpened = !optionsOpened\">\n    </button>\n    <div *ngIf=\"optionsOpened\" class=\"dropdown-options\">\n      <ul>\n        <li (click)=\"onDeleteClick()\">Delete image</li>\n      </ul>\n    </div>\n  </div> <!-- End of header -->\n\n  <img class=\"image\" [src]=\"image.filename | image\">\n\n  <div class=\"likes\">\n    <button class=\"like\" [ngClass]=\"{'active': image.isLiked}\" (click)=\"onLikeClick()\"></button>\n    <span class=\"bold\">{{image.likes}} {{image.likes == 1 ? \"like\" : \"likes\"}}</span>\n  </div> <!-- End of header -->\n\n  <div class=\"content\">\n    <span class=\"bold\">{{'name' | user:image.owner  | async}}</span>\n    <p>{{image.description}}</p>\n    <span class=\"small date\">{{image.dateCreated | moment}}</span>\n  </div> <!-- End of content -->\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/feed/image/image.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".container {\n  border: 1px solid #DFE0DF;\n  margin-top: 20px;\n  margin-bottom: 20px;\n  background-color: #FFFFFF;\n  border-radius: 4px; }\n\n.header, .content, .likes {\n  margin-top: 0.75rem;\n  margin-left: 0.75rem;\n  margin-right: 0.75rem; }\n\n.dropdown-options {\n  position: absolute;\n  float: right;\n  right: -10px;\n  width: 200px;\n  top: 40px;\n  border: 2px solid #949494;\n  border-radius: 5px;\n  background-color: #FFFFFF; }\n  .dropdown-options ul {\n    list-style: none;\n    margin: 0;\n    padding: 0; }\n  .dropdown-options li {\n    height: 40px;\n    display: -ms-flexbox;\n    display: flex;\n    -ms-flex-direction: row;\n        flex-direction: row;\n    -ms-flex-align: center;\n        align-items: center;\n    margin-left: 10px;\n    margin-right: 10px; }\n\n.header, .likes, .user-content {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  -moz-align-items: center;\n  -ms-align-items: center;\n  -ms-flex-align: center;\n      align-items: center; }\n  .header span, .likes span, .user-content span {\n    margin-left: 0.75rem; }\n\n.header {\n  position: relative;\n  -moz-justify-content: space-between;\n  -ms-justify-content: space-between;\n  justify-content: space-between;\n  -ms-flex-pack: space-between; }\n\n.header, .content {\n  margin-bottom: 0.75rem; }\n\n.content p {\n  display: inline; }\n\n.content .date {\n  margin-top: 0.75rem;\n  display: block; }\n\n.image {\n  width: 100%;\n  height: 100%;\n  -o-object-fit: contain;\n     object-fit: contain; }\n\n.small {\n  color: #939393; }\n\n.dropdown-button {\n  background-image: url(\"/assets/images/dropdown.svg\");\n  background-repeat: no-repeat;\n  width: 24px;\n  height: 12px; }\n  .dropdown-button:hover, .dropdown-button:focus {\n    opacity: 0.6;\n    transition: all 0.3s ease; }\n\n.header img {\n  width: 50px;\n  height: 50px;\n  border-radius: 25px; }\n\n.header span {\n  overflow: hidden;\n  text-overflow: ellipsis; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/feed/image/image.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ImageComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models_image_model__ = __webpack_require__("../../../../../src/app/models/image.model.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var ImageComponent = (function () {
    function ImageComponent(session) {
        this.session = session;
        this.like = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["v" /* EventEmitter */]();
        this.unlike = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["v" /* EventEmitter */]();
        this.showProfile = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["v" /* EventEmitter */]();
        this.deleteAction = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["v" /* EventEmitter */]();
        this.optionsOpened = false;
    }
    ImageComponent.prototype.onLikeClick = function () {
        this.image.isLiked = !this.image.isLiked;
        this.image.likes += (this.image.isLiked ? 1 : -1);
        if (this.image.isLiked) {
            this.like.emit(this.image.id);
        }
        else {
            this.unlike.emit(this.image.id);
        }
    };
    ImageComponent.prototype.isOwnedByCurrentUser = function () {
        return this.session.userId() === this.image.owner;
    };
    ImageComponent.prototype.onProfileClick = function () {
        this.showProfile.emit(this.image.owner);
    };
    ImageComponent.prototype.onDeleteClick = function () {
        this.deleteAction.emit(this.image);
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ImageComponent.prototype, "like", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ImageComponent.prototype, "unlike", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ImageComponent.prototype, "showProfile", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ImageComponent.prototype, "deleteAction", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* Input */])(),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1__models_image_model__["a" /* Image */])
    ], ImageComponent.prototype, "image", void 0);
    ImageComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-image',
            template: __webpack_require__("../../../../../src/app/screens/feed/image/image.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/feed/image/image.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__services_session_service__["a" /* Session */]])
    ], ImageComponent);
    return ImageComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/image-upload/image-upload.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <h1 class=\"title\">New Post</h1>\n\n  <div class=\"image-section\">\n    <div class=\"image-container\">\n      <img *ngIf=\"imagePreview\" class=\"image\" [src]=\"imagePreview\">\n    </div>\n\n    <div class=\"controls\">\n      <label for=\"file\" class=\"round-corners outline-button\">\n        Select a Photo\n      </label>\n      <input type=\"file\" id=\"file\" #file\n        accept=\"image/*\" (change)=\"onChange(file.files)\"/>\n\n      <button class=\"round-corners outline-button\"\n        (click)=\"onNextClick()\"\n        [disabled]=\"!imagePreview\">\n        Next\n      </button>\n    </div>\n  </div>\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/image-upload/image-upload.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".description {\n  width: 75%; }\n\n.title, .description, .reference {\n  text-align: center; }\n\n.title, .description, form, button[type=submit] {\n  margin-top: 20px; }\n\n.reference {\n  margin-top: 40px;\n  margin-bottom: 20px; }\n\n.title, .fieldset, button[type=submit], .reference, .alert {\n  margin-left: 0.75rem;\n  margin-right: 0.75rem; }\n\nbutton[type=submit] {\n  width: 40%;\n  display: block;\n  margin-left: auto;\n  margin-right: auto; }\n\n.fieldset {\n  margin-top: 10px;\n  height: 40px; }\n\n.fieldset {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  border-bottom: 2px solid #C0C1C0; }\n  .fieldset label {\n    width: 30%; }\n  .fieldset input {\n    -ms-flex: 1;\n    flex: 1;\n    border: none; }\n  .fieldset button, .fieldset label {\n    margin-top: auto;\n    margin-bottom: auto; }\n\n.image-section {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  -moz-align-items: center;\n  -ms-align-items: center;\n  -ms-flex-align: center;\n      align-items: center;\n  -moz-flex-direction: column;\n  -ms-flex-direction: column;\n  flex-direction: column; }\n\n.image-container {\n  width: 100%;\n  height: 450px;\n  background-color: #F8F9F8;\n  margin-top: 20px;\n  margin-bottom: 20px; }\n\n.image {\n  width: 100%;\n  height: 100%;\n  -o-object-fit: contain;\n     object-fit: contain; }\n\nlabel {\n  display: inline-block;\n  margin-bottom: 40px; }\n\n#file {\n  display: none; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/image-upload/image-upload.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ImageUploadComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__image_upload_service__ = __webpack_require__("../../../../../src/app/screens/image-upload/image-upload.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var ImageUploadComponent = (function () {
    function ImageUploadComponent(router, uploadService) {
        this.router = router;
        this.uploadService = uploadService;
    }
    ImageUploadComponent.prototype.onChange = function (files) {
        this.uploadService.setSelectedFile(files[0]);
        this.getImagePreview(this.uploadService.selectedFile());
    };
    ImageUploadComponent.prototype.getImagePreview = function (file) {
        var _this = this;
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            _this.imagePreview = reader.result;
        };
    };
    ImageUploadComponent.prototype.onNextClick = function () {
        this.router.navigate(['/upload/post']);
    };
    ImageUploadComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-upload',
            template: __webpack_require__("../../../../../src/app/screens/image-upload/image-upload.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/image-upload/image-upload.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */],
            __WEBPACK_IMPORTED_MODULE_2__image_upload_service__["a" /* ImageUploadService */]])
    ], ImageUploadComponent);
    return ImageUploadComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/image-upload/image-upload.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ImageUploadModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/auth-guard.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shared_shared_module__ = __webpack_require__("../../../../../src/app/shared/shared.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__image_upload_service__ = __webpack_require__("../../../../../src/app/screens/image-upload/image-upload.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__image_upload_component__ = __webpack_require__("../../../../../src/app/screens/image-upload/image-upload.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__post_create_post_create_component__ = __webpack_require__("../../../../../src/app/screens/image-upload/post-create/post-create.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};







var routes = [
    {
        path: 'upload/select',
        component: __WEBPACK_IMPORTED_MODULE_5__image_upload_component__["a" /* ImageUploadComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    },
    {
        path: 'upload/post',
        component: __WEBPACK_IMPORTED_MODULE_6__post_create_post_create_component__["a" /* PostCreateComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    },
    {
        path: 'upload',
        redirectTo: '/upload/select',
        pathMatch: 'full'
    },
];
var ImageUploadModule = (function () {
    function ImageUploadModule() {
    }
    ImageUploadModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_5__image_upload_component__["a" /* ImageUploadComponent */],
                __WEBPACK_IMPORTED_MODULE_6__post_create_post_create_component__["a" /* PostCreateComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_3__shared_shared_module__["a" /* SharedModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* RouterModule */].forChild(routes)
            ],
            providers: [
                __WEBPACK_IMPORTED_MODULE_4__image_upload_service__["a" /* ImageUploadService */]
            ]
        })
    ], ImageUploadModule);
    return ImageUploadModule;
}());



/***/ }),

/***/ "../../../../../src/app/screens/image-upload/image-upload.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ImageUploadService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Subject__ = __webpack_require__("../../../../rxjs/_esm5/Subject.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};


var ImageUploadService = (function () {
    function ImageUploadService() {
        this.fileChangeSubject = new __WEBPACK_IMPORTED_MODULE_1_rxjs_Subject__["a" /* Subject */]();
    }
    ImageUploadService.prototype.setSelectedFile = function (file) {
        this.file = file;
        this.fileChangeSubject.next();
    };
    ImageUploadService.prototype.selectedFile = function () {
        return this.file;
    };
    ImageUploadService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])()
    ], ImageUploadService);
    return ImageUploadService;
}());



/***/ }),

/***/ "../../../../../src/app/screens/image-upload/post-create/post-create.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <h1 class=\"title\">New Post</h1>\n\n  <div class=\"post-section\">\n    <div class=\"image-container\">\n      <img *ngIf=\"imagePreview\" class=\"image\" [src]=\"imagePreview\">\n    </div>\n\n    <textarea placeholder=\"Write a caption...\"\n      maxlength=\"160\"\n      [(ngModel)]=\"captionValue\">\n    </textarea>\n  </div>\n\n  <button class=\"round-corners centered outline-button\"\n    (click)=\"onSubmitClick()\"\n    [disabled]=\"!uploadService.selectedFile()\">\n    Share\n  </button>\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/image-upload/post-create/post-create.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".description {\n  width: 75%; }\n\n.title, .description, .reference {\n  text-align: center; }\n\n.title, .description, form, button[type=submit] {\n  margin-top: 20px; }\n\n.reference {\n  margin-top: 40px;\n  margin-bottom: 20px; }\n\n.title, .fieldset, button[type=submit], .reference, .alert {\n  margin-left: 0.75rem;\n  margin-right: 0.75rem; }\n\nbutton[type=submit] {\n  width: 40%;\n  display: block;\n  margin-left: auto;\n  margin-right: auto; }\n\n.fieldset {\n  margin-top: 10px;\n  height: 40px; }\n\n.fieldset {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  border-bottom: 2px solid #C0C1C0; }\n  .fieldset label {\n    width: 30%; }\n  .fieldset input {\n    -ms-flex: 1;\n    flex: 1;\n    border: none; }\n  .fieldset button, .fieldset label {\n    margin-top: auto;\n    margin-bottom: auto; }\n\n.post-section {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  -moz-align-items: center;\n  -ms-align-items: center;\n  -ms-flex-align: center;\n      align-items: center;\n  margin-top: 10px; }\n\n.image-container {\n  width: 100px;\n  height: 100px;\n  background-color: #F8F9F8;\n  margin: 10px; }\n\ntextarea {\n  resize: none;\n  border: 0;\n  -ms-flex-positive: 1;\n      flex-grow: 1;\n  margin-top: 10px;\n  margin-right: 10px;\n  margin-bottom: 10px;\n  height: 100px; }\n\n.image {\n  width: 100%;\n  height: 100%;\n  -o-object-fit: contain;\n     object-fit: contain; }\n\nbutton {\n  margin-top: 10px;\n  margin-bottom: 40px;\n  display: block; }\n\nlabel {\n  display: inline-block;\n  margin-bottom: 40px; }\n\n#file {\n  display: none; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/image-upload/post-create/post-create.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PostCreateComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__image_upload_service__ = __webpack_require__("../../../../../src/app/screens/image-upload/image-upload.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_error_service__ = __webpack_require__("../../../../../src/app/services/error.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var PostCreateComponent = (function () {
    function PostCreateComponent(router, apiClient, uploadService, errorService) {
        this.router = router;
        this.apiClient = apiClient;
        this.uploadService = uploadService;
        this.errorService = errorService;
        this.subscribeToFileChange();
        this.getImagePreview(uploadService.selectedFile());
    }
    PostCreateComponent.prototype.ngOnDestroy = function () {
        this.fileChangeSubscription.unsubscribe();
    };
    // Subscriptions
    PostCreateComponent.prototype.subscribeToFileChange = function () {
        var _this = this;
        this.fileChangeSubscription = this.uploadService.fileChangeSubject.subscribe(function (value) {
            _this.getImagePreview(_this.uploadService.selectedFile());
        });
    };
    PostCreateComponent.prototype.getImagePreview = function (file) {
        var _this = this;
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            _this.imagePreview = reader.result;
        };
    };
    PostCreateComponent.prototype.onSubmitClick = function () {
        var _this = this;
        var self = this;
        this.apiClient.uploadImage(this.uploadService.selectedFile()).then(function (result) {
            self.apiClient.createImage(result['filename'], self.captionValue).then(function (result) {
                _this.uploadService.setSelectedFile(undefined);
                _this.router.navigate(['/']);
            });
        }).catch(function (error) {
            console.log('Error creating image: ' + error);
        });
    };
    PostCreateComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-post-create',
            template: __webpack_require__("../../../../../src/app/screens/image-upload/post-create/post-create.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/image-upload/post-create/post-create.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */], __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__["a" /* APIClient */],
            __WEBPACK_IMPORTED_MODULE_2__image_upload_service__["a" /* ImageUploadService */], __WEBPACK_IMPORTED_MODULE_4__services_error_service__["a" /* ErrorService */]])
    ], PostCreateComponent);
    return PostCreateComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/login/login.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <h1 class=\"title\">Log In</h1>\n\n  <p class=\"description subtitle centered\">Log in to your account to post amazing images and catch up with the community</p>\n\n  <form (ngSubmit)=\"onSubmit()\" #form=\"ngForm\">\n\n    <div class=\"fieldset\">\n      <label for=\"email\">Email</label>\n      <input type=\"email\" id=\"email\" name=\"email\" #email=\"ngModel\" [(ngModel)]=\"emailValue\"\n        placeholder=\"johndoe@mail.com\" pattern=\"[^@]+@[^@]+\\.[^@]+\" required>\n    </div> <!-- End of email field -->\n\n    <div class=\"fieldset\">\n      <label for=\"password\">Password</label>\n      <input type={{passwordFieldType}} id=\"password\" name=\"password\" #password=\"ngModel\" [(ngModel)]=\"passwordValue\"\n        placeholder=\"password\" minlength=\"4\" maxlength=\"30\" required>\n      <button type=\"button\" class=\"round-corners outline-button\" (click)=\"onVisibilityToggle()\">{{showButtonTitle | uppercase}}</button>\n    </div> <!-- End of password field -->\n\n    <button type=\"submit\" class=\"round-corners outline-button\" [disabled]=\"!form.form.valid\">Log In</button>\n\n  </form> <!-- End of form -->\n\n  <div class=\"reference\">\n    <span>Don't have an accout?</span>\n    <a routerLink=\"/signup\">Register</a>\n  </div> <!-- End of reference -->\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/login/login.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".description {\n  width: 75%; }\n\n.title, .description, .reference {\n  text-align: center; }\n\n.title, .description, form, button[type=submit] {\n  margin-top: 20px; }\n\n.reference {\n  margin-top: 40px;\n  margin-bottom: 20px; }\n\n.title, .fieldset, button[type=submit], .reference, .alert {\n  margin-left: 0.75rem;\n  margin-right: 0.75rem; }\n\nbutton[type=submit] {\n  width: 40%;\n  display: block;\n  margin-left: auto;\n  margin-right: auto; }\n\n.fieldset {\n  margin-top: 10px;\n  height: 40px; }\n\n.fieldset {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  border-bottom: 2px solid #C0C1C0; }\n  .fieldset label {\n    width: 30%; }\n  .fieldset input {\n    -ms-flex: 1;\n    flex: 1;\n    border: none; }\n  .fieldset button, .fieldset label {\n    margin-top: auto;\n    margin-bottom: auto; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/login/login.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LoginComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_components_form_form_component__ = __webpack_require__("../../../../../src/app/shared/components/form/form.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_error_service__ = __webpack_require__("../../../../../src/app/services/error.service.ts");
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var LoginComponent = (function (_super) {
    __extends(LoginComponent, _super);
    function LoginComponent(apiClient, router, errorService) {
        var _this = _super.call(this, apiClient) || this;
        _this.router = router;
        _this.errorService = errorService;
        _this.emailValue = '';
        _this.passwordValue = '';
        return _this;
    }
    LoginComponent.prototype.onSubmit = function () {
        var _this = this;
        this.apiClient.loginUser(this.emailValue, this.passwordValue).then(function (result) {
            _this.router.navigate(['/']);
        }).catch(function (error) {
            _this.errorService.error = error.error;
        });
    };
    LoginComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-login',
            template: __webpack_require__("../../../../../src/app/screens/login/login.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/login/login.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_api_client_service__["a" /* APIClient */], __WEBPACK_IMPORTED_MODULE_3__angular_router__["b" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__services_error_service__["a" /* ErrorService */]])
    ], LoginComponent);
    return LoginComponent;
}(__WEBPACK_IMPORTED_MODULE_2__shared_components_form_form_component__["a" /* FormComponent */]));



/***/ }),

/***/ "../../../../../src/app/screens/login/login.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LoginModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_shared_module__ = __webpack_require__("../../../../../src/app/shared/shared.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__login_component__ = __webpack_require__("../../../../../src/app/screens/login/login.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__shared_services_not_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/not-auth-guard.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};





var routes = [
    {
        path: 'login',
        component: __WEBPACK_IMPORTED_MODULE_3__login_component__["a" /* LoginComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_4__shared_services_not_auth_guard_service__["a" /* NotAuthGuard */]]
    }
];
var LoginModule = (function () {
    function LoginModule() {
    }
    LoginModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__login_component__["a" /* LoginComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_2__shared_shared_module__["a" /* SharedModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* RouterModule */].forChild(routes)
            ]
        })
    ], LoginModule);
    return LoginModule;
}());



/***/ }),

/***/ "../../../../../src/app/screens/profile/edit-profile/edit-profile.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <h1 class=\"title\">Edit Profile</h1>\n\n  <form (ngSubmit)=\"onSubmit()\" #form=\"ngForm\">\n\n    <div class=\"avatar-secton\">\n      <img class=\"avatar\"\n        [src]=\"imagePreview ? imagePreview : user?.avatar | image:'/assets/images/avatar_placeholder.png'\">\n\n      <label for=\"file\" class=\"round-corners outline-button\">\n        Change Profile Photo\n      </label>\n      <input type=\"file\" id=\"file\" #file\n        accept=\"image/*\" (change)=\"onChange(file.files)\"/>\n    </div>\n\n    <div class=\"fieldset\">\n      <label for=\"name\">Name</label>\n      <input type=\"text\" id=\"name\" name=\"name\" #name=\"ngModel\" [(ngModel)]=\"nameValue\"\n        placeholder=\"John Doe\" required>\n    </div> <!-- End of name field -->\n\n    <div class=\"fieldset\">\n      <label for=\"username\">Username</label>\n      <input type=\"text\" id=\"username\" name=\"username\" #username=\"ngModel\" [(ngModel)]=\"usernameValue\"\n        placeholder=\"johndoe\" required>\n    </div> <!-- End of username field -->\n\n    <div class=\"fieldset\">\n      <label for=\"email\">Email</label>\n      <input type=\"email\" id=\"email\" name=\"email\" #email=\"ngModel\" [(ngModel)]=\"emailValue\"\n        placeholder=\"johndoe@mail.com\" pattern=\"[^@]+@[^@]+\\.[^@]+\" required>\n    </div> <!-- End of email field -->\n\n    <div class=\"fieldset\">\n      <label for=\"bio\">Bio</label>\n      <input type=\"text\" id=\"bio\" name=\"bio\" #bio=\"ngModel\" [(ngModel)]=\"bioValue\"\n        maxlength=\"160\" required>\n    </div> <!-- End of email field -->\n\n    <button type=\"submit\" class=\"round-corners outline-button\" [disabled]=\"!form.form.valid\">Save Changes</button>\n\n  </form> <!-- End of form -->\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/profile/edit-profile/edit-profile.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".description {\n  width: 75%; }\n\n.title, .description, .reference {\n  text-align: center; }\n\n.title, .description, form, button[type=submit] {\n  margin-top: 20px; }\n\n.reference {\n  margin-top: 40px;\n  margin-bottom: 20px; }\n\n.title, .fieldset, button[type=submit], .reference, .alert {\n  margin-left: 0.75rem;\n  margin-right: 0.75rem; }\n\nbutton[type=submit] {\n  width: 40%;\n  display: block;\n  margin-left: auto;\n  margin-right: auto; }\n\n.fieldset {\n  margin-top: 10px;\n  height: 40px; }\n\n.fieldset {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  border-bottom: 2px solid #C0C1C0; }\n  .fieldset label {\n    width: 30%; }\n  .fieldset input {\n    -ms-flex: 1;\n    flex: 1;\n    border: none; }\n  .fieldset button, .fieldset label {\n    margin-top: auto;\n    margin-bottom: auto; }\n\n.avatar-secton {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  -moz-align-items: center;\n  -ms-align-items: center;\n  -ms-flex-align: center;\n      align-items: center;\n  -moz-flex-direction: column;\n  -ms-flex-direction: column;\n  flex-direction: column; }\n  .avatar-secton label {\n    margin-top: 20px;\n    margin-bottom: 10px; }\n  .avatar-secton .avatar {\n    width: 75px;\n    height: 75px;\n    border-radius: 37.5px;\n    background-color: #F8F9F8;\n    -o-object-fit: cover;\n       object-fit: cover; }\n  .avatar-secton #file {\n    opacity: 0;\n    width: 0;\n    height: 0; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/profile/edit-profile/edit-profile.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return EditProfileComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__("../../../common/esm5/common.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_error_service__ = __webpack_require__("../../../../../src/app/services/error.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var EditProfileComponent = (function () {
    function EditProfileComponent(apiClient, router, errorService, location, session) {
        this.apiClient = apiClient;
        this.router = router;
        this.errorService = errorService;
        this.location = location;
        this.session = session;
        this.nameValue = '';
        this.usernameValue = '';
        this.emailValue = '';
        this.bioValue = '';
    }
    EditProfileComponent.prototype.ngAfterViewInit = function () {
        var userId = this.session.userId();
        this.loadUser(userId);
    };
    EditProfileComponent.prototype.onSubmit = function () {
        var userId = this.session.userId();
        var self = this;
        var updateClosure = function (avatar) {
            self.apiClient.updateUser(userId, self.nameValue, self.usernameValue, self.emailValue, self.bioValue, avatar).then(function (result) {
                self.location.back();
            }).catch(function (error) {
                self.errorService.error = error.error;
            });
        };
        if (this.selectedFile) {
            self.apiClient.uploadImage(self.selectedFile).then(function (result) {
                updateClosure(result['filename']);
            }).catch(function (error) {
                self.errorService.error = error.error;
            });
        }
        else {
            updateClosure();
        }
    };
    EditProfileComponent.prototype.onChange = function (files) {
        this.selectedFile = files[0];
        this.getImagePreview(this.selectedFile);
    };
    EditProfileComponent.prototype.getImagePreview = function (file) {
        var _this = this;
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            _this.imagePreview = reader.result;
        };
    };
    EditProfileComponent.prototype.loadUser = function (userId) {
        var self = this;
        this.apiClient.getUser(userId).then(function (result) {
            self.user = result;
            self.nameValue = result.name;
            self.usernameValue = result.username;
            self.emailValue = result.email;
            self.bioValue = result.bio;
        }).catch(function (error) {
            console.log('Loading user failed: ' + error);
        });
    };
    EditProfileComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-edit-profile',
            template: __webpack_require__("../../../../../src/app/screens/profile/edit-profile/edit-profile.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/profile/edit-profile/edit-profile.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_3__services_api_client_service__["a" /* APIClient */], __WEBPACK_IMPORTED_MODULE_2__angular_router__["b" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__services_error_service__["a" /* ErrorService */], __WEBPACK_IMPORTED_MODULE_1__angular_common__["f" /* Location */],
            __WEBPACK_IMPORTED_MODULE_5__services_session_service__["a" /* Session */]])
    ], EditProfileComponent);
    return EditProfileComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/profile/profile-header/profile-header.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n\n  <div class=\"user-content\">\n    <img class=\"avatar\"\n      [src]=\"user.avatar | image:'/assets/images/avatar_placeholder.png'\"\n      (click)=\"onProfileClick()\">\n\n    <div class=\"counters-buttons\">\n      <div class=\"counter-container\">\n        <div class=\"counter\">\n          <span class=\"value bold\">\n            {{user.likes}}\n          </span>\n\n          <span class=\"label\">\n            Likes\n          </span>\n        </div> <!-- End of counter -->\n\n        <div class=\"counter\">\n          <span class=\"value bold\">\n            {{user.images}}\n          </span>\n\n          <span class=\"label\">\n            Images\n          </span>\n        </div> <!-- End of counter -->\n      </div> <!-- End of counter-container -->\n\n      <div *ngIf=\"isCurrentUser()\" class=\"control-buttons\">\n        <button\n          class=\"round-corners outline-button\"\n          (click)=\"onEditProfileClick()\">\n          Edit Profile\n        </button>\n\n        <button id=\"settings-button\"\n          class=\"round-corners outline-button\"\n          (click)=\"onSettingsClick()\">\n        </button>\n      </div> <!-- End of control-buttons -->\n    </div> <!-- End of counters-buttons -->\n  </div> <!-- End of user-content -->\n\n  <div class=\"user-info\">\n    <span class=\"bold\">\n      {{user.name}}\n    </span>\n\n    <span>\n      {{user.bio}}\n    </span>\n  </div> <!-- End of user-info -->\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/profile/profile-header/profile-header.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".container {\n  margin: 20px; }\n\n.avatar {\n  width: 100px;\n  height: 100px;\n  border-radius: 50px;\n  -o-object-fit: cover;\n     object-fit: cover; }\n\n.user-content, .counters-buttons, .control-buttons, .counter-container {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  -moz-justify-content: space-between;\n  -ms-justify-content: space-between;\n  justify-content: space-between;\n  -ms-flex-pack: space-between; }\n\n.counters-buttons {\n  -moz-flex-direction: column;\n  -ms-flex-direction: column;\n  flex-direction: column; }\n\n#settings-button {\n  margin-left: 10px;\n  background-image: url(\"/assets/images/settings.svg\");\n  background-repeat: no-repeat;\n  width: 40px;\n  background-position: center; }\n\n.counter-container {\n  -moz-justify-content: flex-end;\n  -ms-justify-content: flex-end;\n  justify-content: flex-end;\n  -ms-flex-pack: flex-end; }\n\n.counter {\n  display: inline-block; }\n  .counter span {\n    text-align: center; }\n\n.user-info span, .counter span {\n  display: inline-block;\n  width: 100%; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/profile/profile-header/profile-header.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProfileHeaderComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models_user_model__ = __webpack_require__("../../../../../src/app/models/user.model.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var ProfileHeaderComponent = (function () {
    function ProfileHeaderComponent(session) {
        this.session = session;
        this.openSettings = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["v" /* EventEmitter */]();
        this.openEditProfile = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["v" /* EventEmitter */]();
    }
    ProfileHeaderComponent.prototype.isCurrentUser = function () {
        if (this.user === undefined) {
            return false;
        }
        return this.session.userId() === this.user.id;
    };
    ProfileHeaderComponent.prototype.onSettingsClick = function () {
        this.openSettings.emit();
    };
    ProfileHeaderComponent.prototype.onEditProfileClick = function () {
        this.openEditProfile.emit();
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* Input */])(),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1__models_user_model__["a" /* User */])
    ], ProfileHeaderComponent.prototype, "user", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ProfileHeaderComponent.prototype, "openSettings", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ProfileHeaderComponent.prototype, "openEditProfile", void 0);
    ProfileHeaderComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-profile-header',
            template: __webpack_require__("../../../../../src/app/screens/profile/profile-header/profile-header.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/profile/profile-header/profile-header.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__services_session_service__["a" /* Session */]])
    ], ProfileHeaderComponent);
    return ProfileHeaderComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/profile/profile.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <pg-profile-header *ngIf=\"user\"\n    [user]=\"user\"\n    (openSettings)=\"onOpenSettings()\"\n    (openEditProfile)=\"onOpenEditProfile()\">\n  </pg-profile-header>\n\n  <div class=\"image-container\">\n    <pg-thumbnail *ngFor=\"let image of images\"\n      [image]=\"image\"\n      (openImage)=\"onOpenImage($event)\">\n    </pg-thumbnail>\n  </div>\n\n  <button id=\"next\" *ngIf=\"images.length > 5\" class=\"button outline-button round-corners\"\n    (click)=\"onNextClick()\">\n    Next\n  </button>\n\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/screens/profile/profile.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".container {\n  padding-bottom: 20px; }\n\nbutton#next {\n  display: block;\n  margin-left: auto;\n  margin-right: auto;\n  min-width: 100px;\n  margin-top: 20px; }\n\n.image-container {\n  font-size: 10px; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/profile/profile.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProfileComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_user_cache_service__ = __webpack_require__("../../../../../src/app/services/user-cache.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var ProfileComponent = (function () {
    function ProfileComponent(apiClient, router, userCache, session, route) {
        var _this = this;
        this.apiClient = apiClient;
        this.router = router;
        this.userCache = userCache;
        this.session = session;
        this.route = route;
        this.images = [];
        this.page = 0;
        this.subscribeToLogout();
        this.route.params.subscribe(function (params) {
            var id = params['id'];
            if (!_this.user || id !== _this.user.id) {
                _this.page = 0;
                _this.images = [];
                _this.loadUser(id);
            }
        });
    }
    // Subscriptions
    ProfileComponent.prototype.subscribeToLogout = function () {
        var _this = this;
        this.loginSubscription = this.apiClient.loginSubject.subscribe(function (value) {
            if (value === __WEBPACK_IMPORTED_MODULE_2__services_api_client_service__["b" /* UserDidLogoutNotification */]) {
                _this.page = 0;
                _this.images = [];
                _this.router.navigate(['/login']);
            }
        });
    };
    // Component lifecycle
    ProfileComponent.prototype.ngOnDestroy = function () {
        this.loginSubscription.unsubscribe();
    };
    // Data
    ProfileComponent.prototype.loadUser = function (userId) {
        var self = this;
        this.apiClient.getUser(userId).then(function (result) {
            self.user = result;
            self.loadNextPage();
        }).catch(function (error) {
            console.log('Loading user failed: ' + error);
        });
    };
    ProfileComponent.prototype.loadNextPage = function () {
        var _this = this;
        this.apiClient.getUsersImages(this.user.id, this.page).then(function (result) {
            if (result.length) {
                (_a = _this.images).push.apply(_a, result);
                _this.page += 1;
            }
            var _a;
        }).catch(function (error) {
            console.log('Error loading images: ' + error);
        });
    };
    // Actions
    ProfileComponent.prototype.onOpenSettings = function () {
        this.router.navigate(['/account/settings']);
    };
    ProfileComponent.prototype.onOpenEditProfile = function () {
        this.router.navigate(['/account/edit']);
    };
    ProfileComponent.prototype.onNextClick = function () {
        this.loadNextPage();
    };
    ProfileComponent.prototype.onOpenImage = function (imageId) {
        this.router.navigate(['/image', imageId]);
    };
    ProfileComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-profile',
            template: __webpack_require__("../../../../../src/app/screens/profile/profile.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/profile/profile.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__services_api_client_service__["a" /* APIClient */], __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__services_user_cache_service__["a" /* UserCache */], __WEBPACK_IMPORTED_MODULE_3__services_session_service__["a" /* Session */],
            __WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* ActivatedRoute */]])
    ], ProfileComponent);
    return ProfileComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/profile/profile.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProfileModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/auth-guard.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shared_shared_module__ = __webpack_require__("../../../../../src/app/shared/shared.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__profile_component__ = __webpack_require__("../../../../../src/app/screens/profile/profile.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__edit_profile_edit_profile_component__ = __webpack_require__("../../../../../src/app/screens/profile/edit-profile/edit-profile.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__profile_header_profile_header_component__ = __webpack_require__("../../../../../src/app/screens/profile/profile-header/profile-header.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__thumbnail_thumbnail_component__ = __webpack_require__("../../../../../src/app/screens/profile/thumbnail/thumbnail.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};








var routes = [
    {
        path: 'user/:id',
        component: __WEBPACK_IMPORTED_MODULE_4__profile_component__["a" /* ProfileComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    },
    {
        path: 'account/edit',
        component: __WEBPACK_IMPORTED_MODULE_5__edit_profile_edit_profile_component__["a" /* EditProfileComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_2__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    }
];
var ProfileModule = (function () {
    function ProfileModule() {
    }
    ProfileModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_4__profile_component__["a" /* ProfileComponent */],
                __WEBPACK_IMPORTED_MODULE_5__edit_profile_edit_profile_component__["a" /* EditProfileComponent */],
                __WEBPACK_IMPORTED_MODULE_6__profile_header_profile_header_component__["a" /* ProfileHeaderComponent */],
                __WEBPACK_IMPORTED_MODULE_7__thumbnail_thumbnail_component__["a" /* ThumbnailComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_3__shared_shared_module__["a" /* SharedModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* RouterModule */].forChild(routes)
            ]
        })
    ], ProfileModule);
    return ProfileModule;
}());



/***/ }),

/***/ "../../../../../src/app/screens/profile/thumbnail/thumbnail.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n\n  <img class=\"avatar\" [src]=\"image.filename | image\"\n    (click)=\"onClick()\">\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/profile/thumbnail/thumbnail.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".container {\n  display: inline-block; }\n\n.container img {\n  width: 220px;\n  height: 220px;\n  -o-object-fit: cover;\n     object-fit: cover; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/profile/thumbnail/thumbnail.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ThumbnailComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models_image_model__ = __webpack_require__("../../../../../src/app/models/image.model.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var ThumbnailComponent = (function () {
    function ThumbnailComponent() {
        this.openImage = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["v" /* EventEmitter */]();
    }
    ThumbnailComponent.prototype.onClick = function () {
        this.openImage.emit(this.image.id);
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["D" /* Input */])(),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1__models_image_model__["a" /* Image */])
    ], ThumbnailComponent.prototype, "image", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ThumbnailComponent.prototype, "openImage", void 0);
    ThumbnailComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-thumbnail',
            template: __webpack_require__("../../../../../src/app/screens/profile/thumbnail/thumbnail.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/profile/thumbnail/thumbnail.component.scss")]
        })
    ], ThumbnailComponent);
    return ThumbnailComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/settings/change-password/change-password.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <h1 class=\"title\">Change Password</h1>\n\n  <form (ngSubmit)=\"onSubmit()\" #form=\"ngForm\">\n\n    <div class=\"fieldset\">\n      <label for=\"old-password\">Old Password</label>\n      <input type={{oldPasswordFieldType}} id=\"old-password\"\n        name=\"old-password\" #oldPassword=\"ngModel\" [(ngModel)]=\"oldPasswordValue\"\n        placeholder=\"old password\" minlength=\"4\" maxlength=\"30\" required>\n      <button type=\"button\" class=\"round-corners outline-button\"\n        (click)=\"onVisibilityToggle($event, oldPassword)\">\n        {{oldPasswordShowButtonTitle | uppercase}}\n      </button>\n    </div> <!-- End of password field -->\n\n    <div class=\"fieldset\">\n      <label for=\"password\">New Password</label>\n      <input type={{passwordFieldType}} id=\"password\"\n        name=\"password\" #password=\"ngModel\" [(ngModel)]=\"passwordValue\"\n        placeholder=\"password\" minlength=\"4\" maxlength=\"30\" required>\n      <button type=\"button\" class=\"round-corners outline-button\"\n        (click)=\"onVisibilityToggle($event, password)\">\n        {{passwordShowButtonTitle | uppercase}}\n      </button>\n    </div> <!-- End of password field -->\n\n    <button type=\"submit\" class=\"round-corners outline-button\" [disabled]=\"!form.form.valid\">Change Password</button>\n\n  </form> <!-- End of form -->\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/settings/change-password/change-password.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".description {\n  width: 75%; }\n\n.title, .description, .reference {\n  text-align: center; }\n\n.title, .description, form, button[type=submit] {\n  margin-top: 20px; }\n\n.reference {\n  margin-top: 40px;\n  margin-bottom: 20px; }\n\n.title, .fieldset, button[type=submit], .reference, .alert {\n  margin-left: 0.75rem;\n  margin-right: 0.75rem; }\n\nbutton[type=submit] {\n  width: 40%;\n  display: block;\n  margin-left: auto;\n  margin-right: auto; }\n\n.fieldset {\n  margin-top: 10px;\n  height: 40px; }\n\n.fieldset {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  border-bottom: 2px solid #C0C1C0; }\n  .fieldset label {\n    width: 30%; }\n  .fieldset input {\n    -ms-flex: 1;\n    flex: 1;\n    border: none; }\n  .fieldset button, .fieldset label {\n    margin-top: auto;\n    margin-bottom: auto; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/settings/change-password/change-password.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ChangePasswordComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_common__ = __webpack_require__("../../../common/esm5/common.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_error_service__ = __webpack_require__("../../../../../src/app/services/error.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var ChangePasswordComponent = (function () {
    function ChangePasswordComponent(apiClient, router, errorService, session, location) {
        this.apiClient = apiClient;
        this.router = router;
        this.errorService = errorService;
        this.session = session;
        this.location = location;
        this.oldPasswordValue = '';
        this.oldPasswordFieldType = 'password';
        this.oldPasswordShowButtonTitle = 'Show';
        this.passwordValue = '';
        this.passwordFieldType = 'password';
        this.passwordShowButtonTitle = 'Show';
    }
    ChangePasswordComponent.prototype.onSubmit = function () {
        var _this = this;
        var userId = this.session.userId();
        this.apiClient.changePassword(userId, this.oldPasswordValue, this.passwordValue).then(function (result) {
            _this.location.back();
        }).catch(function (error) {
            _this.errorService.error = error.error;
        });
    };
    ChangePasswordComponent.prototype.onVisibilityToggle = function (event, element) {
        if (element.name === 'old-password') {
            this.toggleOldPasswordVisibility();
        }
        else if (element.name === 'password') {
            this.toggleNewPasswordVisibility();
        }
    };
    ChangePasswordComponent.prototype.toggleOldPasswordVisibility = function () {
        if (this.oldPasswordFieldType === 'password') {
            this.oldPasswordFieldType = 'text';
            this.oldPasswordShowButtonTitle = 'Hide';
        }
        else {
            this.oldPasswordFieldType = 'password';
            this.oldPasswordShowButtonTitle = 'Show';
        }
    };
    ChangePasswordComponent.prototype.toggleNewPasswordVisibility = function () {
        if (this.passwordFieldType === 'password') {
            this.passwordFieldType = 'text';
            this.passwordShowButtonTitle = 'Hide';
        }
        else {
            this.passwordFieldType = 'password';
            this.passwordShowButtonTitle = 'Show';
        }
    };
    ChangePasswordComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-change-password',
            template: __webpack_require__("../../../../../src/app/screens/settings/change-password/change-password.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/settings/change-password/change-password.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_3__services_api_client_service__["a" /* APIClient */], __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__services_error_service__["a" /* ErrorService */], __WEBPACK_IMPORTED_MODULE_5__services_session_service__["a" /* Session */],
            __WEBPACK_IMPORTED_MODULE_2__angular_common__["f" /* Location */]])
    ], ChangePasswordComponent);
    return ChangePasswordComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/settings/settings.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <ul>\n    <li (click)=\"onChangePasswordClick()\">\n      <span>Change Password</span>\n      <span class=\"disclosure\"></span>\n    </li>\n\n    <li (click)=\"onLikedPostsClick()\">\n      <span>Posts you've liked</span>\n      <span class=\"disclosure\"></span>\n    </li>\n\n    <li (click)=\"onLogoutClick()\">\n      <span>Logout</span>\n    </li>\n  </ul>\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/settings/settings.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "li {\n  list-style: none;\n  border-bottom: 1px black solid;\n  height: 40px;\n  vertical-align: middle;\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  -moz-justify-content: space-between;\n  -ms-justify-content: space-between;\n  justify-content: space-between;\n  -ms-flex-pack: space-between; }\n  li span {\n    margin-top: auto;\n    margin-bottom: auto; }\n  li .disclosure {\n    background-image: url(\"/assets/images/forward.svg\");\n    background-repeat: no-repeat;\n    width: 10px;\n    height: 16px; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/settings/settings.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SettingsComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var SettingsComponent = (function () {
    function SettingsComponent(apiClient, session, router) {
        this.apiClient = apiClient;
        this.session = session;
        this.router = router;
        this.subscribeToLogout();
    }
    // Subscriptions
    SettingsComponent.prototype.subscribeToLogout = function () {
        var _this = this;
        this.loginSubscription = this.apiClient.loginSubject.subscribe(function (value) {
            if (value === __WEBPACK_IMPORTED_MODULE_2__services_api_client_service__["b" /* UserDidLogoutNotification */]) {
                _this.router.navigate(['/login']);
            }
        });
    };
    SettingsComponent.prototype.onChangePasswordClick = function () {
        this.router.navigate(['account/change_password']);
    };
    SettingsComponent.prototype.onLikedPostsClick = function () {
        var userId = this.session.userId();
        this.router.navigate(["/user/" + userId + "/likes"]);
    };
    SettingsComponent.prototype.onLogoutClick = function () {
        this.apiClient.logoutUser();
    };
    SettingsComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-settings',
            template: __webpack_require__("../../../../../src/app/screens/settings/settings.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/settings/settings.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__services_api_client_service__["a" /* APIClient */], __WEBPACK_IMPORTED_MODULE_3__services_session_service__["a" /* Session */],
            __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */]])
    ], SettingsComponent);
    return SettingsComponent;
}());



/***/ }),

/***/ "../../../../../src/app/screens/settings/settings.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SettingsModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__settings_component__ = __webpack_require__("../../../../../src/app/screens/settings/settings.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__change_password_change_password_component__ = __webpack_require__("../../../../../src/app/screens/settings/change-password/change-password.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__shared_services_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/auth-guard.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__shared_shared_module__ = __webpack_require__("../../../../../src/app/shared/shared.module.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






var routes = [
    {
        path: 'account/settings',
        component: __WEBPACK_IMPORTED_MODULE_2__settings_component__["a" /* SettingsComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_4__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    },
    {
        path: 'account/change_password',
        component: __WEBPACK_IMPORTED_MODULE_3__change_password_change_password_component__["a" /* ChangePasswordComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_4__shared_services_auth_guard_service__["a" /* AuthGuard */]]
    }
];
var SettingsModule = (function () {
    function SettingsModule() {
    }
    SettingsModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_2__settings_component__["a" /* SettingsComponent */],
                __WEBPACK_IMPORTED_MODULE_3__change_password_change_password_component__["a" /* ChangePasswordComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_5__shared_shared_module__["a" /* SharedModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* RouterModule */].forChild(routes)
            ]
        })
    ], SettingsModule);
    return SettingsModule;
}());



/***/ }),

/***/ "../../../../../src/app/screens/signup/signup.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container full-width\">\n\n  <h1 class=\"title\">Register</h1>\n\n  <p class=\"description subtitle centered\">Create account to post amazing images and see what the community has created</p>\n\n  <form (ngSubmit)=\"onSubmit()\" #form=\"ngForm\">\n\n    <div class=\"fieldset\">\n      <label for=\"name\">Name</label>\n      <input type=\"text\" id=\"name\" name=\"name\" #name=\"ngModel\" [(ngModel)]=\"nameValue\"\n        placeholder=\"John Doe\" required>\n    </div> <!-- End of name field -->\n\n    <div class=\"fieldset\">\n      <label for=\"username\">Username</label>\n      <input type=\"text\" id=\"username\" name=\"username\" #username=\"ngModel\" [(ngModel)]=\"usernameValue\"\n        placeholder=\"johndoe\" required>\n    </div> <!-- End of username field -->\n\n    <div class=\"fieldset\">\n      <label for=\"email\">Email</label>\n      <input type=\"email\" id=\"email\" name=\"email\" #email=\"ngModel\" [(ngModel)]=\"emailValue\"\n        placeholder=\"johndoe@mail.com\" pattern=\"[^@]+@[^@]+\\.[^@]+\" required>\n    </div> <!-- End of email field -->\n\n    <div class=\"fieldset\">\n      <label for=\"password\">Password</label>\n      <input type={{passwordFieldType}} id=\"password\" name=\"password\" #password=\"ngModel\" [(ngModel)]=\"passwordValue\"\n        placeholder=\"password\" minlength=\"4\" maxlength=\"30\" required>\n      <button type=\"button\" class=\"round-corners outline-button\" (click)=\"onVisibilityToggle()\">{{showButtonTitle | uppercase}}</button>\n    </div> <!-- End of password field -->\n\n    <button type=\"submit\" class=\"round-corners outline-button\" [disabled]=\"!form.form.valid\">Create Account</button>\n\n  </form> <!-- End of form -->\n\n  <div class=\"reference\">\n    <span>Already have an accout?</span>\n    <a routerLink=\"/login\">Login</a>\n  </div> <!-- End of reference -->\n\n</div> <!-- End of container -->\n"

/***/ }),

/***/ "../../../../../src/app/screens/signup/signup.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".description {\n  width: 75%; }\n\n.title, .description, .reference {\n  text-align: center; }\n\n.title, .description, form, button[type=submit] {\n  margin-top: 20px; }\n\n.reference {\n  margin-top: 40px;\n  margin-bottom: 20px; }\n\n.title, .fieldset, button[type=submit], .reference, .alert {\n  margin-left: 0.75rem;\n  margin-right: 0.75rem; }\n\nbutton[type=submit] {\n  width: 40%;\n  display: block;\n  margin-left: auto;\n  margin-right: auto; }\n\n.fieldset {\n  margin-top: 10px;\n  height: 40px; }\n\n.fieldset {\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  border-bottom: 2px solid #C0C1C0; }\n  .fieldset label {\n    width: 30%; }\n  .fieldset input {\n    -ms-flex: 1;\n    flex: 1;\n    border: none; }\n  .fieldset button, .fieldset label {\n    margin-top: auto;\n    margin-bottom: auto; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/screens/signup/signup.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SignupComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core___ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shared_components_form_form_component__ = __webpack_require__("../../../../../src/app/shared/components/form/form.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__services_error_service__ = __webpack_require__("../../../../../src/app/services/error.service.ts");
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var SignupComponent = (function (_super) {
    __extends(SignupComponent, _super);
    function SignupComponent(apiClient, router, errorService) {
        var _this = _super.call(this, apiClient) || this;
        _this.router = router;
        _this.errorService = errorService;
        _this.nameValue = '';
        _this.usernameValue = '';
        _this.emailValue = '';
        _this.passwordValue = '';
        return _this;
    }
    SignupComponent.prototype.onSubmit = function () {
        var _this = this;
        this.apiClient.createUser(this.nameValue, this.usernameValue, this.emailValue, this.passwordValue).then(function (result) {
            _this.apiClient.loginUser(_this.emailValue, _this.passwordValue).then(function (result) {
                _this.router.navigate(['/']);
            });
        }).catch(function (error) {
            _this.errorService.error = error.error;
        });
    };
    SignupComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core___["n" /* Component */])({
            selector: 'pg-signup',
            template: __webpack_require__("../../../../../src/app/screens/signup/signup.component.html"),
            styles: [__webpack_require__("../../../../../src/app/screens/signup/signup.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_2__services_api_client_service__["a" /* APIClient */], __WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */],
            __WEBPACK_IMPORTED_MODULE_4__services_error_service__["a" /* ErrorService */]])
    ], SignupComponent);
    return SignupComponent;
}(__WEBPACK_IMPORTED_MODULE_3__shared_components_form_form_component__["a" /* FormComponent */]));



/***/ }),

/***/ "../../../../../src/app/screens/signup/signup.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SignupModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_shared_module__ = __webpack_require__("../../../../../src/app/shared/shared.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__signup_component__ = __webpack_require__("../../../../../src/app/screens/signup/signup.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__shared_services_not_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/not-auth-guard.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};





var routes = [
    {
        path: 'signup',
        component: __WEBPACK_IMPORTED_MODULE_3__signup_component__["a" /* SignupComponent */],
        canActivate: [__WEBPACK_IMPORTED_MODULE_4__shared_services_not_auth_guard_service__["a" /* NotAuthGuard */]]
    },
];
var SignupModule = (function () {
    function SignupModule() {
    }
    SignupModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__signup_component__["a" /* SignupComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_2__shared_shared_module__["a" /* SharedModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* RouterModule */].forChild(routes)
            ]
        })
    ], SignupModule);
    return SignupModule;
}());



/***/ }),

/***/ "../../../../../src/app/services/api-client.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return UserDidLogoutNotification; });
/* unused harmony export UserDidLoginNotification */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return APIClient; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common_http__ = __webpack_require__("../../../common/esm5/http.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_rxjs_Subject__ = __webpack_require__("../../../../rxjs/_esm5/Subject.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_map__ = __webpack_require__("../../../../rxjs/_esm5/add/operator/map.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_add_operator_share__ = __webpack_require__("../../../../rxjs/_esm5/add/operator/share.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_rxjs_add_operator_catch__ = __webpack_require__("../../../../rxjs/_esm5/add/operator/catch.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_rxjs_add_operator_delay__ = __webpack_require__("../../../../rxjs/_esm5/add/operator/delay.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_rxjs_add_operator_finally__ = __webpack_require__("../../../../rxjs/_esm5/add/operator/finally.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__image_factory_service__ = __webpack_require__("../../../../../src/app/services/image-factory.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__user_factory_service__ = __webpack_require__("../../../../../src/app/services/user-factory.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__config_client_config__ = __webpack_require__("../../../../../src/app/config/client.config.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};












var StatusCode;
(function (StatusCode) {
    StatusCode[StatusCode["Ok"] = 200] = "Ok";
    StatusCode[StatusCode["BadRequest"] = 400] = "BadRequest";
    StatusCode[StatusCode["Unauthorized"] = 401] = "Unauthorized";
    StatusCode[StatusCode["Forbidden"] = 403] = "Forbidden";
    StatusCode[StatusCode["NotFound"] = 404] = "NotFound";
})(StatusCode || (StatusCode = {}));
var HTTPMethod;
(function (HTTPMethod) {
    HTTPMethod["Get"] = "GET";
    HTTPMethod["Post"] = "POST";
    HTTPMethod["Put"] = "PUT";
    HTTPMethod["Delete"] = "DELETE";
})(HTTPMethod || (HTTPMethod = {}));
var UserDidLogoutNotification = 'UserDidLogoutNotification';
var UserDidLoginNotification = 'UserDidLoginNotification';
var APIClient = (function () {
    function APIClient(http, session) {
        this.http = http;
        this.session = session;
        this.apiRoot = __WEBPACK_IMPORTED_MODULE_11__config_client_config__["a" /* apiRoot */];
        this.activeRequests = {};
        this.loginSubject = new __WEBPACK_IMPORTED_MODULE_2_rxjs_Subject__["a" /* Subject */]();
    }
    // Internal
    APIClient.prototype.headers = function () {
        var headers = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["c" /* HttpHeaders */]({
            'Content-Type': 'application/x-www-form-urlencoded'
        });
        var token = this.session.token();
        if (token !== null) {
            headers = headers.set('X-Access-Token', token);
        }
        return headers;
    };
    // Use this method for all requests
    APIClient.prototype.request = function (method, urlPath, body, otherHeaders) {
        var key = method + ":" + urlPath;
        if (this.activeRequests[key]) {
            return this.activeRequests[key];
        }
        var headers = otherHeaders || this.headers();
        var url = this.apiRoot + urlPath;
        var self = this;
        var observable = this.http.request(method, url, {
            body: body, headers: headers
        }).finally(function () {
            delete self.activeRequests[key];
        }).share();
        this.activeRequests[key] = observable;
        return observable;
    };
    // User
    APIClient.prototype.createUser = function (name, username, email, password) {
        var url = '/users';
        var body = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["d" /* HttpParams */]()
            .set('name', name)
            .set('username', username)
            .set('email', email)
            .set('password', password);
        var request = this.request(HTTPMethod.Post, url, body);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                reject(error.error);
            });
        });
    };
    APIClient.prototype.loginUser = function (email, password) {
        var _this = this;
        var url = '/sessions';
        var body = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["d" /* HttpParams */]()
            .set('email', email)
            .set('password', password);
        var request = this.request(HTTPMethod.Post, url, body);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                _this.session.setToken(response['token']);
                _this.session.setUserId(response['user']['_id']);
                _this.loginSubject.next(UserDidLoginNotification);
                resolve();
            }).catch(function (error) {
                reject(error.error);
            });
        });
    };
    APIClient.prototype.logoutUser = function () {
        this.session.reset();
        this.loginSubject.next(UserDidLogoutNotification);
    };
    APIClient.prototype.getUser = function (userId) {
        var _this = this;
        var url = "/users/" + userId;
        var request = this.request(HTTPMethod.Get, url);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                var responseUser = response['user'];
                var user = __WEBPACK_IMPORTED_MODULE_10__user_factory_service__["a" /* UserFactory */].userFromObject(responseUser);
                resolve(user);
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.updateUser = function (userId, name, username, email, bio, avatar) {
        var _this = this;
        var url = "/users/" + userId;
        var body = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["d" /* HttpParams */]()
            .set('name', name)
            .set('username', username)
            .set('email', email)
            .set('bio', bio);
        if (avatar) {
            body = body.set('avatar', avatar);
        }
        var request = this.request(HTTPMethod.Put, url, body);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.changePassword = function (userId, oldPassword, password) {
        var _this = this;
        var url = "/users/" + userId;
        var body = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["d" /* HttpParams */]()
            .set('password', password)
            .set('oldPassword', oldPassword);
        var request = this.request(HTTPMethod.Put, url, body);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    // Image
    APIClient.prototype.createImage = function (filename, description) {
        var url = '/images';
        var body = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["d" /* HttpParams */]()
            .set('filename', filename)
            .set('description', description);
        var request = this.request(HTTPMethod.Post, url, body);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                reject(error.error);
            });
        });
    };
    APIClient.prototype.getImages = function (url) {
        var _this = this;
        var request = this.request(HTTPMethod.Get, url);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                var images = [];
                var responseImages = response['images'];
                for (var i = 0; i < responseImages.length; i++) {
                    var imageObject = responseImages[i];
                    var image = __WEBPACK_IMPORTED_MODULE_9__image_factory_service__["a" /* ImageFactory */].imageFromObject(imageObject);
                    images.push(image);
                }
                resolve(images);
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.getUsersImages = function (userId, page, limit) {
        if (limit === void 0) { limit = 10; }
        var url = "/users/" + userId + "/images?page=" + page + "&limit=" + limit;
        return this.getImages(url);
    };
    APIClient.prototype.getAllImages = function (page, limit) {
        if (limit === void 0) { limit = 10; }
        var url = "/images?page=" + page + "&limit=" + limit;
        return this.getImages(url);
    };
    APIClient.prototype.getUsersLikedImages = function (userId, page, limit) {
        if (limit === void 0) { limit = 10; }
        var url = "/users/" + userId + "/likes?page=" + page + "&limit=" + limit;
        return this.getImages(url);
    };
    APIClient.prototype.getImage = function (imageId) {
        var _this = this;
        var url = "/images/" + imageId;
        var request = this.request(HTTPMethod.Get, url);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                var responseImage = response['image'];
                var image = __WEBPACK_IMPORTED_MODULE_9__image_factory_service__["a" /* ImageFactory */].imageFromObject(responseImage);
                resolve(image);
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.updateImage = function (imageId, description) {
        var _this = this;
        var url = "/images/" + imageId;
        var body = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["d" /* HttpParams */]()
            .set('description', description);
        var request = this.request(HTTPMethod.Put, url);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.deleteImage = function (imageId) {
        var _this = this;
        var url = "/images/" + imageId;
        var request = this.request(HTTPMethod.Delete, url);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.uploadImage = function (file) {
        var _this = this;
        var url = "/upload";
        var headers = new __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["c" /* HttpHeaders */]();
        var token = this.session.token();
        if (token !== null) {
            headers = headers.set('X-Access-Token', token);
        }
        var formData = new FormData();
        formData.append('image', file, file.name);
        var request = this.request(HTTPMethod.Post, url, formData, headers);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve(response);
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.likeImage = function (imageId) {
        var _this = this;
        var url = "/images/" + imageId + "/likes";
        var request = this.request(HTTPMethod.Post, url);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient.prototype.unlikeImage = function (userId, imageId) {
        var _this = this;
        var url = "/images/" + imageId + "/likes/" + userId;
        var request = this.request(HTTPMethod.Delete, url);
        return new Promise(function (resolve, reject) {
            request.toPromise().then(function (response) {
                resolve();
            }).catch(function (error) {
                if (error.status === StatusCode.Unauthorized) {
                    _this.logoutUser();
                }
                reject(error.error);
            });
        });
    };
    APIClient = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__angular_common_http__["a" /* HttpClient */], __WEBPACK_IMPORTED_MODULE_8__session_service__["a" /* Session */]])
    ], APIClient);
    return APIClient;
}());



/***/ }),

/***/ "../../../../../src/app/services/error.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ErrorService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var ErrorService = (function () {
    function ErrorService() {
    }
    ErrorService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])()
    ], ErrorService);
    return ErrorService;
}());



/***/ }),

/***/ "../../../../../src/app/services/image-factory.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ImageFactory; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_image_model__ = __webpack_require__("../../../../../src/app/models/image.model.ts");

var ImageFactory = (function () {
    function ImageFactory() {
    }
    ImageFactory.imageFromObject = function (object) {
        var image = new __WEBPACK_IMPORTED_MODULE_0__models_image_model__["a" /* Image */](object['_id'], object['ownerId'], object['filename'], new Date(object['dateCreated']), object['description'], object['likes'], object['isLiked']);
        return image;
    };
    return ImageFactory;
}());



/***/ }),

/***/ "../../../../../src/app/services/services.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ServicesModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common_http__ = __webpack_require__("../../../common/esm5/http.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__error_service__ = __webpack_require__("../../../../../src/app/services/error.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__user_cache_service__ = __webpack_require__("../../../../../src/app/services/user-cache.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






var ServicesModule = (function () {
    function ServicesModule() {
    }
    ServicesModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_common_http__["b" /* HttpClientModule */]
            ],
            providers: [
                __WEBPACK_IMPORTED_MODULE_2__api_client_service__["a" /* APIClient */],
                __WEBPACK_IMPORTED_MODULE_3__error_service__["a" /* ErrorService */],
                __WEBPACK_IMPORTED_MODULE_4__session_service__["a" /* Session */],
                __WEBPACK_IMPORTED_MODULE_5__user_cache_service__["a" /* UserCache */]
            ]
        })
    ], ServicesModule);
    return ServicesModule;
}());



/***/ }),

/***/ "../../../../../src/app/services/session.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Session; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var Session = (function () {
    function Session() {
    }
    // Getters and setters
    Session.prototype.token = function () {
        return this.value('token');
    };
    Session.prototype.setToken = function (token) {
        this.setValue('token', token);
    };
    Session.prototype.userId = function () {
        return this.value('userId');
    };
    Session.prototype.setUserId = function (userId) {
        this.setValue('userId', userId);
    };
    // Reset
    Session.prototype.reset = function () {
        localStorage.clear();
    };
    // Internal
    Session.prototype.value = function (key) {
        return localStorage.getItem(key);
    };
    Session.prototype.setValue = function (key, value) {
        if (value === null) {
            localStorage.removeItem(key);
        }
        else {
            localStorage.setItem(key, value);
        }
    };
    Session = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])()
    ], Session);
    return Session;
}());



/***/ }),

/***/ "../../../../../src/app/services/user-cache.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return UserCache; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var UserCache = (function () {
    function UserCache(apiClient) {
        this.apiClient = apiClient;
        this.users = {};
    }
    UserCache.prototype.userWithId = function (userId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var user = _this.users['user'];
            if (user) {
                return resolve(user);
            }
            _this.apiClient.getUser(userId).then(function (result) {
                _this.users[userId] = result;
                return resolve(result);
            }).catch(function (error) {
                console.log('Error getting user');
                reject(error);
            });
        });
    };
    UserCache.prototype.deleteCache = function () {
        this.users = {};
    };
    UserCache = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__api_client_service__["a" /* APIClient */]])
    ], UserCache);
    return UserCache;
}());



/***/ }),

/***/ "../../../../../src/app/services/user-factory.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return UserFactory; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_user_model__ = __webpack_require__("../../../../../src/app/models/user.model.ts");

var UserFactory = (function () {
    function UserFactory() {
    }
    UserFactory.userFromObject = function (object) {
        var image = new __WEBPACK_IMPORTED_MODULE_0__models_user_model__["a" /* User */](object['_id'], object['name'], object['username'], object['email'], object['avatar'], object['bio'], object['images'], object['likes']);
        return image;
    };
    return UserFactory;
}());



/***/ }),

/***/ "../../../../../src/app/shared/components/form/form.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return FormComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var FormComponent = (function () {
    function FormComponent(apiClient) {
        this.apiClient = apiClient;
        this.passwordFieldType = 'password';
        this.showButtonTitle = 'Show';
    }
    FormComponent.prototype.onSubmit = function () {
        // Implemented in subclasses
    };
    FormComponent.prototype.onVisibilityToggle = function () {
        if (this.passwordFieldType === 'password') {
            this.passwordFieldType = 'text';
            this.showButtonTitle = 'Hide';
        }
        else {
            this.passwordFieldType = 'password';
            this.showButtonTitle = 'Show';
        }
    };
    FormComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            template: ''
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_api_client_service__["a" /* APIClient */]])
    ], FormComponent);
    return FormComponent;
}());



/***/ }),

/***/ "../../../../../src/app/shared/components/header/header.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n\n    <a class=\"logo\" routerLink=\"/\"><img src=\"/assets/images/logo.svg\" alt=\"PixelGram Logo\"></a>\n\n    <div class=\"navigation\">\n      <ul *ngIf=\"isAuthed()\">\n        <li><a class=\"image-button nav-button nav-home\"\n          routerLinkActive=\"active\"\n          aria-label=\"Feed\"\n          routerLink=\"/feed\">\n        </a></li>\n\n        <li><a class=\"image-button nav-button nav-new\"\n          routerLinkActive=\"active\"\n          aria-label=\"New Image\"\n          routerLink=\"/upload\">\n        </a></li>\n\n        <li><a class=\"image-button nav-button nav-profile\"\n          routerLinkActive=\"active\"\n          aria-label=\"My Profile\"\n          [routerLink]=\"['user', userId()]\">\n        </a></li>\n      </ul>\n\n      <ul *ngIf=\"!isAuthed()\">\n        <li><a class=\"outline-button round-corners\" routerLink=\"/login\">Log In</a></li>\n        <li><a class=\"outline-button round-corners\" routerLink=\"/signup\">Sign Up</a></li>\n      </ul>\n    </div>\n\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/shared/components/header/header.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".container {\n  height: 50px;\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  -moz-justify-content: space-between;\n  -ms-justify-content: space-between;\n  justify-content: space-between;\n  -ms-flex-pack: space-between;\n  background-color: #FFFFFF; }\n\n.logo {\n  margin: 10px; }\n  .logo img {\n    margin-top: 5px; }\n\n.logo, ul {\n  margin-left: 10px;\n  margin-right: 10px; }\n\n.nav-button {\n  width: 26px;\n  height: 26px;\n  background-repeat: no-repeat; }\n\n.nav-home {\n  background-image: url(\"/assets/images/home.svg\"); }\n\n.nav-new {\n  background-image: url(\"/assets/images/add_new.svg\"); }\n\n.nav-profile {\n  background-image: url(\"/assets/images/profile.svg\"); }\n\nul {\n  list-style-type: none;\n  padding: 0;\n  /* OLD - iOS 6-, Safari 3.1-6 */\n  /* OLD - Firefox 19- (doesn't work very well) */\n  display: -ms-flexbox;\n  /* TWEENER - IE 10 */\n  /* NEW - Chrome */\n  display: flex;\n  /* NEW, Spec - Opera 12.1, Firefox 20+ */\n  margin: 0;\n  height: 100%;\n  margin-right: 10px; }\n  ul li {\n    text-align: center;\n    margin-top: auto;\n    margin-bottom: auto;\n    margin-left: 10px;\n    margin-right: 10px; }\n  ul li a {\n    display: block; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/shared/components/header/header.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HeaderComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var HeaderComponent = (function () {
    function HeaderComponent(session) {
        this.session = session;
    }
    HeaderComponent.prototype.isAuthed = function () {
        return this.session.token() !== null;
    };
    HeaderComponent.prototype.userId = function () {
        return this.session.userId();
    };
    HeaderComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-header',
            template: __webpack_require__("../../../../../src/app/shared/components/header/header.component.html"),
            styles: [__webpack_require__("../../../../../src/app/shared/components/header/header.component.scss")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_session_service__["a" /* Session */]])
    ], HeaderComponent);
    return HeaderComponent;
}());



/***/ }),

/***/ "../../../../../src/app/shared/components/not-found/not-found.component.html":
/***/ (function(module, exports) {

module.exports = "<h1>404 - The item doesn't exist.</h1>\n"

/***/ }),

/***/ "../../../../../src/app/shared/components/not-found/not-found.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return NotFoundComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var NotFoundComponent = (function () {
    function NotFoundComponent() {
    }
    NotFoundComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
            selector: 'pg-not-found',
            template: __webpack_require__("../../../../../src/app/shared/components/not-found/not-found.component.html")
        })
    ], NotFoundComponent);
    return NotFoundComponent;
}());



/***/ }),

/***/ "../../../../../src/app/shared/components/toast/toast.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"toast-container round-corners centered\" (click)=\"onClick()\">\n  <div class=\"labels\">\n    <p class=\"content\">{{content}}</p>\n  </div>\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/shared/components/toast/toast.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".toast-container {\n  width: 280px;\n  border-width: 2px;\n  border-color: red;\n  border-style: solid;\n  background-color: #ffcccc;\n  padding: 5px;\n  margin-top: 20px; }\n  .toast-container .content {\n    font-size: 1rem; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/shared/components/toast/toast.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ToastComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core___ = __webpack_require__("../../../core/esm5/core.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var ToastComponent = (function () {
    function ToastComponent() {
        this.content = '';
        this.onClose = new __WEBPACK_IMPORTED_MODULE_0__angular_core___["v" /* EventEmitter */]();
    }
    ToastComponent.prototype.onClick = function () {
        this.onClose.emit();
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core___["D" /* Input */])(),
        __metadata("design:type", Object)
    ], ToastComponent.prototype, "content", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core___["P" /* Output */])(),
        __metadata("design:type", Object)
    ], ToastComponent.prototype, "onClose", void 0);
    ToastComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core___["n" /* Component */])({
            selector: 'pg-toast',
            template: __webpack_require__("../../../../../src/app/shared/components/toast/toast.component.html"),
            styles: [__webpack_require__("../../../../../src/app/shared/components/toast/toast.component.scss")]
        })
    ], ToastComponent);
    return ToastComponent;
}());



/***/ }),

/***/ "../../../../../src/app/shared/pipes/image.pipe.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ImagePipe; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__config_client_config__ = __webpack_require__("../../../../../src/app/config/client.config.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};


var ImagePipe = (function () {
    function ImagePipe() {
    }
    ImagePipe.prototype.transform = function (value, placeholder) {
        if (value === null || value.length === 0) {
            return placeholder || '';
        }
        return __WEBPACK_IMPORTED_MODULE_1__config_client_config__["a" /* apiRoot */] + "/uploads/" + value;
    };
    ImagePipe = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Pipe */])({
            name: 'image'
        })
    ], ImagePipe);
    return ImagePipe;
}());



/***/ }),

/***/ "../../../../../src/app/shared/pipes/moment.pipe.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MomentPipe; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_moment__ = __webpack_require__("../../../../moment/moment.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_moment___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_moment__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};


var MomentPipe = (function () {
    function MomentPipe() {
    }
    MomentPipe.prototype.transform = function (value) {
        var now = new Date();
        if (__WEBPACK_IMPORTED_MODULE_1_moment__(now).isBefore(__WEBPACK_IMPORTED_MODULE_1_moment__(value).add(1, 'day'))) {
            return __WEBPACK_IMPORTED_MODULE_1_moment__(value).fromNow();
        }
        else if (__WEBPACK_IMPORTED_MODULE_1_moment__(now).isBefore(__WEBPACK_IMPORTED_MODULE_1_moment__(value).add(7, 'days'))) {
            return __WEBPACK_IMPORTED_MODULE_1_moment__(value).calendar();
        }
        else if (value.getFullYear === now.getFullYear) {
            return __WEBPACK_IMPORTED_MODULE_1_moment__(value).format('MMMM DD');
        }
        return __WEBPACK_IMPORTED_MODULE_1_moment__(value).format('MMMM DD, YYYY');
    };
    MomentPipe = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Pipe */])({
            name: 'moment'
        })
    ], MomentPipe);
    return MomentPipe;
}());



/***/ }),

/***/ "../../../../../src/app/shared/pipes/user.pipe.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return UserPipe; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_user_cache_service__ = __webpack_require__("../../../../../src/app/services/user-cache.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var UserPipe = (function () {
    function UserPipe(userCache) {
        this.userCache = userCache;
    }
    UserPipe.prototype.transform = function (value, userId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.userCache.userWithId(userId).then(function (result) {
                if (value === 'name') {
                    return resolve(result.name);
                }
                else if (value === 'username') {
                    return resolve(result.username);
                }
                else if (value === 'avatar') {
                    return resolve(result.avatar);
                }
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    UserPipe = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["T" /* Pipe */])({
            name: 'user'
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__services_user_cache_service__["a" /* UserCache */]])
    ], UserPipe);
    return UserPipe;
}());



/***/ }),

/***/ "../../../../../src/app/shared/services/auth-guard.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AuthGuard; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var AuthGuard = (function () {
    function AuthGuard(router, session, apiClient) {
        this.router = router;
        this.session = session;
        this.apiClient = apiClient;
    }
    AuthGuard.prototype.canActivate = function (route, state) {
        var token = this.session.token();
        if (token === null) {
            this.router.navigate(['/login']);
            return false;
        }
        return true;
    };
    AuthGuard = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */], __WEBPACK_IMPORTED_MODULE_2__services_session_service__["a" /* Session */], __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__["a" /* APIClient */]])
    ], AuthGuard);
    return AuthGuard;
}());



/***/ }),

/***/ "../../../../../src/app/shared/services/not-auth-guard.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return NotAuthGuard; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__services_session_service__ = __webpack_require__("../../../../../src/app/services/session.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__ = __webpack_require__("../../../../../src/app/services/api-client.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var NotAuthGuard = (function () {
    function NotAuthGuard(router, session, apiClient) {
        this.router = router;
        this.session = session;
        this.apiClient = apiClient;
    }
    NotAuthGuard.prototype.canActivate = function (route, state) {
        var token = this.session.token();
        if (token !== null) {
            this.router.navigate(['/']);
            return false;
        }
        return true;
    };
    NotAuthGuard = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["A" /* Injectable */])(),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__angular_router__["b" /* Router */], __WEBPACK_IMPORTED_MODULE_2__services_session_service__["a" /* Session */], __WEBPACK_IMPORTED_MODULE_3__services_api_client_service__["a" /* APIClient */]])
    ], NotAuthGuard);
    return NotAuthGuard;
}());



/***/ }),

/***/ "../../../../../src/app/shared/shared.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SharedModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_forms__ = __webpack_require__("../../../forms/esm5/forms.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("../../../router/esm5/router.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_common__ = __webpack_require__("../../../common/esm5/common.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__components_form_form_component__ = __webpack_require__("../../../../../src/app/shared/components/form/form.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__components_header_header_component__ = __webpack_require__("../../../../../src/app/shared/components/header/header.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__components_not_found_not_found_component__ = __webpack_require__("../../../../../src/app/shared/components/not-found/not-found.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__components_toast_toast_component__ = __webpack_require__("../../../../../src/app/shared/components/toast/toast.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__pipes_image_pipe__ = __webpack_require__("../../../../../src/app/shared/pipes/image.pipe.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__pipes_moment_pipe__ = __webpack_require__("../../../../../src/app/shared/pipes/moment.pipe.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__pipes_user_pipe__ = __webpack_require__("../../../../../src/app/shared/pipes/user.pipe.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__services_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/auth-guard.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__services_not_auth_guard_service__ = __webpack_require__("../../../../../src/app/shared/services/not-auth-guard.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};













var SharedModule = (function () {
    function SharedModule() {
    }
    SharedModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_4__components_form_form_component__["a" /* FormComponent */],
                __WEBPACK_IMPORTED_MODULE_5__components_header_header_component__["a" /* HeaderComponent */],
                __WEBPACK_IMPORTED_MODULE_6__components_not_found_not_found_component__["a" /* NotFoundComponent */],
                __WEBPACK_IMPORTED_MODULE_7__components_toast_toast_component__["a" /* ToastComponent */],
                __WEBPACK_IMPORTED_MODULE_8__pipes_image_pipe__["a" /* ImagePipe */],
                __WEBPACK_IMPORTED_MODULE_9__pipes_moment_pipe__["a" /* MomentPipe */],
                __WEBPACK_IMPORTED_MODULE_10__pipes_user_pipe__["a" /* UserPipe */]
            ],
            providers: [
                __WEBPACK_IMPORTED_MODULE_11__services_auth_guard_service__["a" /* AuthGuard */],
                __WEBPACK_IMPORTED_MODULE_12__services_not_auth_guard_service__["a" /* NotAuthGuard */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_3__angular_common__["b" /* CommonModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_forms__["a" /* FormsModule */],
                __WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* RouterModule */]
            ],
            exports: [
                __WEBPACK_IMPORTED_MODULE_3__angular_common__["b" /* CommonModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_forms__["a" /* FormsModule */],
                __WEBPACK_IMPORTED_MODULE_2__angular_router__["c" /* RouterModule */],
                __WEBPACK_IMPORTED_MODULE_4__components_form_form_component__["a" /* FormComponent */],
                __WEBPACK_IMPORTED_MODULE_5__components_header_header_component__["a" /* HeaderComponent */],
                __WEBPACK_IMPORTED_MODULE_6__components_not_found_not_found_component__["a" /* NotFoundComponent */],
                __WEBPACK_IMPORTED_MODULE_7__components_toast_toast_component__["a" /* ToastComponent */],
                __WEBPACK_IMPORTED_MODULE_8__pipes_image_pipe__["a" /* ImagePipe */],
                __WEBPACK_IMPORTED_MODULE_9__pipes_moment_pipe__["a" /* MomentPipe */],
                __WEBPACK_IMPORTED_MODULE_10__pipes_user_pipe__["a" /* UserPipe */]
            ]
        })
    ], SharedModule);
    return SharedModule;
}());



/***/ }),

/***/ "../../../../../src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
var environment = {
    production: false
};


/***/ }),

/***/ "../../../../../src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("../../../platform-browser-dynamic/esm5/platform-browser-dynamic.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("../../../../../src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("../../../../../src/environments/environment.ts");




if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_13" /* enableProdMode */])();
}
Object(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */])
    .catch(function (err) { return console.log(err); });


/***/ }),

/***/ "../../../../moment/locale recursive ^\\.\\/.*$":
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./af": "../../../../moment/locale/af.js",
	"./af.js": "../../../../moment/locale/af.js",
	"./ar": "../../../../moment/locale/ar.js",
	"./ar-dz": "../../../../moment/locale/ar-dz.js",
	"./ar-dz.js": "../../../../moment/locale/ar-dz.js",
	"./ar-kw": "../../../../moment/locale/ar-kw.js",
	"./ar-kw.js": "../../../../moment/locale/ar-kw.js",
	"./ar-ly": "../../../../moment/locale/ar-ly.js",
	"./ar-ly.js": "../../../../moment/locale/ar-ly.js",
	"./ar-ma": "../../../../moment/locale/ar-ma.js",
	"./ar-ma.js": "../../../../moment/locale/ar-ma.js",
	"./ar-sa": "../../../../moment/locale/ar-sa.js",
	"./ar-sa.js": "../../../../moment/locale/ar-sa.js",
	"./ar-tn": "../../../../moment/locale/ar-tn.js",
	"./ar-tn.js": "../../../../moment/locale/ar-tn.js",
	"./ar.js": "../../../../moment/locale/ar.js",
	"./az": "../../../../moment/locale/az.js",
	"./az.js": "../../../../moment/locale/az.js",
	"./be": "../../../../moment/locale/be.js",
	"./be.js": "../../../../moment/locale/be.js",
	"./bg": "../../../../moment/locale/bg.js",
	"./bg.js": "../../../../moment/locale/bg.js",
	"./bm": "../../../../moment/locale/bm.js",
	"./bm.js": "../../../../moment/locale/bm.js",
	"./bn": "../../../../moment/locale/bn.js",
	"./bn.js": "../../../../moment/locale/bn.js",
	"./bo": "../../../../moment/locale/bo.js",
	"./bo.js": "../../../../moment/locale/bo.js",
	"./br": "../../../../moment/locale/br.js",
	"./br.js": "../../../../moment/locale/br.js",
	"./bs": "../../../../moment/locale/bs.js",
	"./bs.js": "../../../../moment/locale/bs.js",
	"./ca": "../../../../moment/locale/ca.js",
	"./ca.js": "../../../../moment/locale/ca.js",
	"./cs": "../../../../moment/locale/cs.js",
	"./cs.js": "../../../../moment/locale/cs.js",
	"./cv": "../../../../moment/locale/cv.js",
	"./cv.js": "../../../../moment/locale/cv.js",
	"./cy": "../../../../moment/locale/cy.js",
	"./cy.js": "../../../../moment/locale/cy.js",
	"./da": "../../../../moment/locale/da.js",
	"./da.js": "../../../../moment/locale/da.js",
	"./de": "../../../../moment/locale/de.js",
	"./de-at": "../../../../moment/locale/de-at.js",
	"./de-at.js": "../../../../moment/locale/de-at.js",
	"./de-ch": "../../../../moment/locale/de-ch.js",
	"./de-ch.js": "../../../../moment/locale/de-ch.js",
	"./de.js": "../../../../moment/locale/de.js",
	"./dv": "../../../../moment/locale/dv.js",
	"./dv.js": "../../../../moment/locale/dv.js",
	"./el": "../../../../moment/locale/el.js",
	"./el.js": "../../../../moment/locale/el.js",
	"./en-au": "../../../../moment/locale/en-au.js",
	"./en-au.js": "../../../../moment/locale/en-au.js",
	"./en-ca": "../../../../moment/locale/en-ca.js",
	"./en-ca.js": "../../../../moment/locale/en-ca.js",
	"./en-gb": "../../../../moment/locale/en-gb.js",
	"./en-gb.js": "../../../../moment/locale/en-gb.js",
	"./en-ie": "../../../../moment/locale/en-ie.js",
	"./en-ie.js": "../../../../moment/locale/en-ie.js",
	"./en-il": "../../../../moment/locale/en-il.js",
	"./en-il.js": "../../../../moment/locale/en-il.js",
	"./en-nz": "../../../../moment/locale/en-nz.js",
	"./en-nz.js": "../../../../moment/locale/en-nz.js",
	"./eo": "../../../../moment/locale/eo.js",
	"./eo.js": "../../../../moment/locale/eo.js",
	"./es": "../../../../moment/locale/es.js",
	"./es-do": "../../../../moment/locale/es-do.js",
	"./es-do.js": "../../../../moment/locale/es-do.js",
	"./es-us": "../../../../moment/locale/es-us.js",
	"./es-us.js": "../../../../moment/locale/es-us.js",
	"./es.js": "../../../../moment/locale/es.js",
	"./et": "../../../../moment/locale/et.js",
	"./et.js": "../../../../moment/locale/et.js",
	"./eu": "../../../../moment/locale/eu.js",
	"./eu.js": "../../../../moment/locale/eu.js",
	"./fa": "../../../../moment/locale/fa.js",
	"./fa.js": "../../../../moment/locale/fa.js",
	"./fi": "../../../../moment/locale/fi.js",
	"./fi.js": "../../../../moment/locale/fi.js",
	"./fo": "../../../../moment/locale/fo.js",
	"./fo.js": "../../../../moment/locale/fo.js",
	"./fr": "../../../../moment/locale/fr.js",
	"./fr-ca": "../../../../moment/locale/fr-ca.js",
	"./fr-ca.js": "../../../../moment/locale/fr-ca.js",
	"./fr-ch": "../../../../moment/locale/fr-ch.js",
	"./fr-ch.js": "../../../../moment/locale/fr-ch.js",
	"./fr.js": "../../../../moment/locale/fr.js",
	"./fy": "../../../../moment/locale/fy.js",
	"./fy.js": "../../../../moment/locale/fy.js",
	"./gd": "../../../../moment/locale/gd.js",
	"./gd.js": "../../../../moment/locale/gd.js",
	"./gl": "../../../../moment/locale/gl.js",
	"./gl.js": "../../../../moment/locale/gl.js",
	"./gom-latn": "../../../../moment/locale/gom-latn.js",
	"./gom-latn.js": "../../../../moment/locale/gom-latn.js",
	"./gu": "../../../../moment/locale/gu.js",
	"./gu.js": "../../../../moment/locale/gu.js",
	"./he": "../../../../moment/locale/he.js",
	"./he.js": "../../../../moment/locale/he.js",
	"./hi": "../../../../moment/locale/hi.js",
	"./hi.js": "../../../../moment/locale/hi.js",
	"./hr": "../../../../moment/locale/hr.js",
	"./hr.js": "../../../../moment/locale/hr.js",
	"./hu": "../../../../moment/locale/hu.js",
	"./hu.js": "../../../../moment/locale/hu.js",
	"./hy-am": "../../../../moment/locale/hy-am.js",
	"./hy-am.js": "../../../../moment/locale/hy-am.js",
	"./id": "../../../../moment/locale/id.js",
	"./id.js": "../../../../moment/locale/id.js",
	"./is": "../../../../moment/locale/is.js",
	"./is.js": "../../../../moment/locale/is.js",
	"./it": "../../../../moment/locale/it.js",
	"./it.js": "../../../../moment/locale/it.js",
	"./ja": "../../../../moment/locale/ja.js",
	"./ja.js": "../../../../moment/locale/ja.js",
	"./jv": "../../../../moment/locale/jv.js",
	"./jv.js": "../../../../moment/locale/jv.js",
	"./ka": "../../../../moment/locale/ka.js",
	"./ka.js": "../../../../moment/locale/ka.js",
	"./kk": "../../../../moment/locale/kk.js",
	"./kk.js": "../../../../moment/locale/kk.js",
	"./km": "../../../../moment/locale/km.js",
	"./km.js": "../../../../moment/locale/km.js",
	"./kn": "../../../../moment/locale/kn.js",
	"./kn.js": "../../../../moment/locale/kn.js",
	"./ko": "../../../../moment/locale/ko.js",
	"./ko.js": "../../../../moment/locale/ko.js",
	"./ky": "../../../../moment/locale/ky.js",
	"./ky.js": "../../../../moment/locale/ky.js",
	"./lb": "../../../../moment/locale/lb.js",
	"./lb.js": "../../../../moment/locale/lb.js",
	"./lo": "../../../../moment/locale/lo.js",
	"./lo.js": "../../../../moment/locale/lo.js",
	"./lt": "../../../../moment/locale/lt.js",
	"./lt.js": "../../../../moment/locale/lt.js",
	"./lv": "../../../../moment/locale/lv.js",
	"./lv.js": "../../../../moment/locale/lv.js",
	"./me": "../../../../moment/locale/me.js",
	"./me.js": "../../../../moment/locale/me.js",
	"./mi": "../../../../moment/locale/mi.js",
	"./mi.js": "../../../../moment/locale/mi.js",
	"./mk": "../../../../moment/locale/mk.js",
	"./mk.js": "../../../../moment/locale/mk.js",
	"./ml": "../../../../moment/locale/ml.js",
	"./ml.js": "../../../../moment/locale/ml.js",
	"./mn": "../../../../moment/locale/mn.js",
	"./mn.js": "../../../../moment/locale/mn.js",
	"./mr": "../../../../moment/locale/mr.js",
	"./mr.js": "../../../../moment/locale/mr.js",
	"./ms": "../../../../moment/locale/ms.js",
	"./ms-my": "../../../../moment/locale/ms-my.js",
	"./ms-my.js": "../../../../moment/locale/ms-my.js",
	"./ms.js": "../../../../moment/locale/ms.js",
	"./mt": "../../../../moment/locale/mt.js",
	"./mt.js": "../../../../moment/locale/mt.js",
	"./my": "../../../../moment/locale/my.js",
	"./my.js": "../../../../moment/locale/my.js",
	"./nb": "../../../../moment/locale/nb.js",
	"./nb.js": "../../../../moment/locale/nb.js",
	"./ne": "../../../../moment/locale/ne.js",
	"./ne.js": "../../../../moment/locale/ne.js",
	"./nl": "../../../../moment/locale/nl.js",
	"./nl-be": "../../../../moment/locale/nl-be.js",
	"./nl-be.js": "../../../../moment/locale/nl-be.js",
	"./nl.js": "../../../../moment/locale/nl.js",
	"./nn": "../../../../moment/locale/nn.js",
	"./nn.js": "../../../../moment/locale/nn.js",
	"./pa-in": "../../../../moment/locale/pa-in.js",
	"./pa-in.js": "../../../../moment/locale/pa-in.js",
	"./pl": "../../../../moment/locale/pl.js",
	"./pl.js": "../../../../moment/locale/pl.js",
	"./pt": "../../../../moment/locale/pt.js",
	"./pt-br": "../../../../moment/locale/pt-br.js",
	"./pt-br.js": "../../../../moment/locale/pt-br.js",
	"./pt.js": "../../../../moment/locale/pt.js",
	"./ro": "../../../../moment/locale/ro.js",
	"./ro.js": "../../../../moment/locale/ro.js",
	"./ru": "../../../../moment/locale/ru.js",
	"./ru.js": "../../../../moment/locale/ru.js",
	"./sd": "../../../../moment/locale/sd.js",
	"./sd.js": "../../../../moment/locale/sd.js",
	"./se": "../../../../moment/locale/se.js",
	"./se.js": "../../../../moment/locale/se.js",
	"./si": "../../../../moment/locale/si.js",
	"./si.js": "../../../../moment/locale/si.js",
	"./sk": "../../../../moment/locale/sk.js",
	"./sk.js": "../../../../moment/locale/sk.js",
	"./sl": "../../../../moment/locale/sl.js",
	"./sl.js": "../../../../moment/locale/sl.js",
	"./sq": "../../../../moment/locale/sq.js",
	"./sq.js": "../../../../moment/locale/sq.js",
	"./sr": "../../../../moment/locale/sr.js",
	"./sr-cyrl": "../../../../moment/locale/sr-cyrl.js",
	"./sr-cyrl.js": "../../../../moment/locale/sr-cyrl.js",
	"./sr.js": "../../../../moment/locale/sr.js",
	"./ss": "../../../../moment/locale/ss.js",
	"./ss.js": "../../../../moment/locale/ss.js",
	"./sv": "../../../../moment/locale/sv.js",
	"./sv.js": "../../../../moment/locale/sv.js",
	"./sw": "../../../../moment/locale/sw.js",
	"./sw.js": "../../../../moment/locale/sw.js",
	"./ta": "../../../../moment/locale/ta.js",
	"./ta.js": "../../../../moment/locale/ta.js",
	"./te": "../../../../moment/locale/te.js",
	"./te.js": "../../../../moment/locale/te.js",
	"./tet": "../../../../moment/locale/tet.js",
	"./tet.js": "../../../../moment/locale/tet.js",
	"./tg": "../../../../moment/locale/tg.js",
	"./tg.js": "../../../../moment/locale/tg.js",
	"./th": "../../../../moment/locale/th.js",
	"./th.js": "../../../../moment/locale/th.js",
	"./tl-ph": "../../../../moment/locale/tl-ph.js",
	"./tl-ph.js": "../../../../moment/locale/tl-ph.js",
	"./tlh": "../../../../moment/locale/tlh.js",
	"./tlh.js": "../../../../moment/locale/tlh.js",
	"./tr": "../../../../moment/locale/tr.js",
	"./tr.js": "../../../../moment/locale/tr.js",
	"./tzl": "../../../../moment/locale/tzl.js",
	"./tzl.js": "../../../../moment/locale/tzl.js",
	"./tzm": "../../../../moment/locale/tzm.js",
	"./tzm-latn": "../../../../moment/locale/tzm-latn.js",
	"./tzm-latn.js": "../../../../moment/locale/tzm-latn.js",
	"./tzm.js": "../../../../moment/locale/tzm.js",
	"./ug-cn": "../../../../moment/locale/ug-cn.js",
	"./ug-cn.js": "../../../../moment/locale/ug-cn.js",
	"./uk": "../../../../moment/locale/uk.js",
	"./uk.js": "../../../../moment/locale/uk.js",
	"./ur": "../../../../moment/locale/ur.js",
	"./ur.js": "../../../../moment/locale/ur.js",
	"./uz": "../../../../moment/locale/uz.js",
	"./uz-latn": "../../../../moment/locale/uz-latn.js",
	"./uz-latn.js": "../../../../moment/locale/uz-latn.js",
	"./uz.js": "../../../../moment/locale/uz.js",
	"./vi": "../../../../moment/locale/vi.js",
	"./vi.js": "../../../../moment/locale/vi.js",
	"./x-pseudo": "../../../../moment/locale/x-pseudo.js",
	"./x-pseudo.js": "../../../../moment/locale/x-pseudo.js",
	"./yo": "../../../../moment/locale/yo.js",
	"./yo.js": "../../../../moment/locale/yo.js",
	"./zh-cn": "../../../../moment/locale/zh-cn.js",
	"./zh-cn.js": "../../../../moment/locale/zh-cn.js",
	"./zh-hk": "../../../../moment/locale/zh-hk.js",
	"./zh-hk.js": "../../../../moment/locale/zh-hk.js",
	"./zh-tw": "../../../../moment/locale/zh-tw.js",
	"./zh-tw.js": "../../../../moment/locale/zh-tw.js"
};
function webpackContext(req) {
	return __webpack_require__(webpackContextResolve(req));
};
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) // check for number or string
		throw new Error("Cannot find module '" + req + "'.");
	return id;
};
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "../../../../moment/locale recursive ^\\.\\/.*$";

/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("../../../../../src/main.ts");


/***/ })

},[0]);
//# sourceMappingURL=main.bundle.js.map