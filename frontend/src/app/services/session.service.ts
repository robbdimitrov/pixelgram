import { Injectable } from '@angular/core';

@Injectable()
export class Session {

    // Getters and setters

    token() {
        return this.value('token');
    }

    setToken(token: string | null) {
        this.setValue('token', token);
    }

    userId() {
        return this.value('userId');
    }

    setUserId(userId: string | null) {
        this.setValue('userId', userId);
    }

    // Reset

    reset() {
        localStorage.clear();
    }

    // Internal

    private value(key: string) {
        return localStorage.getItem(key);
    }

    private setValue(key: string, value: string | null) {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    }

}
