import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
    Profile,
    Strategy,
    StrategyOptions,
    VerifyCallback,
} from 'passport-google-oauth20';
import { google, people_v1 } from 'googleapis';
import { ConfigType } from '@nestjs/config';
import googleOauthConfig from '../config/google-oauth.config';
import { AuthService } from '../auth.service';
import { UserRole } from '~/entities/user.entity';

export async function fetchBirthDate(
    accessToken: string
): Promise<Date | undefined> {
    try {
        const people = google.people({
            version: 'v1',
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const me = (await people.people.get({
            resourceName: 'people/me',
            personFields: 'birthdays',
        })) as people_v1.Params$Resource$People$Get & {
            data: people_v1.Schema$Person;
        };

        const birthday = me.data.birthdays?.[0]?.date;
        const year = birthday?.year ?? undefined;
        const month = birthday?.month ?? undefined;
        const day = birthday?.day ?? undefined;

        if (year && month && day) {
            return new Date(year, month - 1, day);
        }
    } catch {
        console.warn('Failed to fetch birth date');
    }
    return undefined;
}

@Injectable()
export class GoogleUserStrategy extends PassportStrategy(
    Strategy,
    'google-user'
) {
    constructor(
        @Inject(googleOauthConfig.KEY)
        private readonly googleConfig: ConfigType<typeof googleOauthConfig>,
        private readonly authService: AuthService
    ) {
        const options: StrategyOptions = {
            clientID: googleConfig.clientID!,
            clientSecret: googleConfig.clientSecret!,
            callbackURL: googleConfig.callbackURI!,
            scope: [
                'profile',
                'email',
                'https://www.googleapis.com/auth/user.birthday.read',
            ],
        };
        super(options);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
    ): Promise<void> {
        const { emails, name, photos, id } = profile;
        const birthDate = await fetchBirthDate(accessToken);

        const user = await this.authService.validateGoogleUser(
            {
                provider: 'google',
                providerId: id,
                email: emails?.[0]?.value ?? '',
                firstName: name?.givenName ?? '',
                lastName: name?.familyName ?? '',
                avatarUrl: photos?.[0]?.value ?? '',
                birthDate,
            },
            UserRole.USER
        );

        done(null, user);
    }
}

@Injectable()
export class GoogleAdminStrategy extends PassportStrategy(
    Strategy,
    'google-admin'
) {
    constructor(
        @Inject(googleOauthConfig.KEY)
        private readonly googleConfig: ConfigType<typeof googleOauthConfig>,
        private readonly authService: AuthService
    ) {
        const options: StrategyOptions = {
            clientID: googleConfig.clientID!,
            clientSecret: googleConfig.clientSecret!,
            callbackURL: googleConfig.adminCallbackURI!,
            scope: [
                'profile',
                'email',
                'https://www.googleapis.com/auth/user.birthday.read',
            ],
        };
        super(options);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
    ): Promise<void> {
        const { emails, name, photos, id } = profile;
        const birthDate = await fetchBirthDate(accessToken);

        const user = await this.authService.validateGoogleUser(
            {
                provider: 'google',
                providerId: id,
                email: emails?.[0]?.value ?? '',
                firstName: name?.givenName ?? '',
                lastName: name?.familyName ?? '',
                avatarUrl: photos?.[0]?.value ?? '',
                birthDate,
            },
            UserRole.ADMIN
        );

        done(null, user);
    }
}
