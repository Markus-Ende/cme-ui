import { Subject } from 'rxjs/Subject';
import Amplify, { Logger } from 'aws-amplify';

import { AuthState } from './auth.state';

const logger = new Logger('AuthDecorator');

function check(authState: Subject<AuthState>) {
  // check for current authenticated user to init authState
  Amplify.Auth.currentAuthenticatedUser()
    .then(user => {
      logger.debug('has authenticated user', user);
      authState.next({ state: 'signedIn', user: user });
    })
    .catch(err => {
      logger.debug('no authenticated user', err);
      authState.next({ state: 'signedOut', user: null });
    });
}

function decorateSignIn(authState: Subject<AuthState>) {
  const _signIn = Amplify.Auth.signIn;
  Amplify.Auth.signIn = (username: string, password: string): Promise<any> => {
    return _signIn
      .call(Amplify.Auth, username, password)
      .then((user: any) => {
        logger.debug('signIn success');
        if (!user.challengeName) {
          authState.next({ state: 'signedIn', user: user });
          return user;
        }

        logger.debug('signIn challenge: ' + user.challengeName);
        if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
          authState.next({ state: 'requireNewPassword', user: user });
        } else if (user.challengeName === 'MFA_SETUP') {
          authState.next({ state: 'setupMFA', user: user });
        } else if (user.challengeName === 'SMS_MFA' || user.challengeName === 'SOFTWARE_TOKEN_MFA') {
          authState.next({ state: 'confirmSignIn', user: user });
        } else {
          logger.debug('warning: unhandled challengeName ' + user.challengeName);
        }
        return user;
      })
      .catch((err: any) => {
        logger.debug('signIn error', err);
        throw err;
      });
  };
}

function decorateSignOut(authState: Subject<AuthState>) {
  const _signOut = Amplify.Auth.signOut;
  Amplify.Auth.signOut = (): Promise<any> => {
    return _signOut
      .call(Amplify.Auth)
      .then((data: any) => {
        logger.debug('signOut success');
        authState.next({ state: 'signedOut', user: null });
        return data;
      })
      .catch((err: any) => {
        logger.debug('signOut error', err);
        throw err;
      });
  };
}

function decorateSignUp(authState: Subject<AuthState>) {
  const _signUp = Amplify.Auth.signUp;
  Amplify.Auth.signUp = (username: string, password: string, email: string, phone_number: string): Promise<any> => {
    return _signUp
      .call(Amplify.Auth, username, password, email, phone_number)
      .then((data: any) => {
        logger.debug('signUp success');
        authState.next({ state: 'confirmSignUp', user: { username: username } });
        return data;
      })
      .catch((err: any) => {
        logger.debug('signUp error', err);
        throw err;
      });
  };
}

function decorateConfirmSignUp(authState: Subject<AuthState>) {
  const _confirmSignUp = Amplify.Auth.confirmSignUp;
  Amplify.Auth.confirmSignUp = (username: string, code: string): Promise<any> => {
    return _confirmSignUp
      .call(Amplify.Auth, username, code)
      .then((data: any) => {
        logger.debug('confirmSignUp success');
        authState.next({ state: 'signIn', user: { username: username } });
        return data;
      })
      .catch((err: any) => {
        logger.debug('confirmSignUp error', err);
        throw err;
      });
  };
}

export function authDecorator(authState: Subject<AuthState>) {
  check(authState);

  decorateSignIn(authState);
  decorateSignOut(authState);
  decorateSignUp(authState);
  decorateConfirmSignUp(authState);
}
