"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDescription, setErrorDescription] = useState<string>('');

  useEffect(() => {
    const error = searchParams.get('error');
    
    // Set error message based on error type
    if (error === 'Configuration') {
      setErrorMessage('Server Error');
      setErrorDescription('There is a problem with the server configuration. Please try again later or contact support.');
    } else if (error === 'AccessDenied') {
      setErrorMessage('Access Denied');
      setErrorDescription('You do not have permission to sign in. Please check your credentials or contact support.');
    } else if (error === 'Verification') {
      setErrorMessage('Unable to Verify Email');
      setErrorDescription('The verification link may have expired or been used already.');
    } else if (error === 'OAuthSignin') {
      setErrorMessage('Unable to Sign In');
      setErrorDescription('Error in the OAuth signin process. Please try again.');
    } else if (error === 'OAuthCallback') {
      setErrorMessage('OAuth Error');
      setErrorDescription('Error in the OAuth callback process. Please try again.');
    } else if (error === 'OAuthCreateAccount') {
      setErrorMessage('Unable to Create Account');
      setErrorDescription('An error occurred while creating your account. Please try again.');
    } else if (error === 'EmailCreateAccount') {
      setErrorMessage('Unable to Create Account');
      setErrorDescription('An error occurred while creating your account with email. Please try again.');
    } else if (error === 'Callback') {
      setErrorMessage('OAuth Error');
      setErrorDescription('Error in the callback process. Please try again.');
    } else if (error === 'OAuthAccountNotLinked') {
      setErrorMessage('Account Not Linked');
      setErrorDescription('Your account is already linked to a different provider. Please sign in with the same provider you used originally.');
    } else if (error === 'EmailSignin') {
      setErrorMessage('Unable to Sign In');
      setErrorDescription('Error sending the sign in email. Please try again.');
    } else if (error === 'CredentialsSignin') {
      setErrorMessage('Invalid Credentials');
      setErrorDescription('The credentials you provided are invalid. Please try again.');
    } else if (error === 'SessionRequired') {
      setErrorMessage('Authentication Required');
      setErrorDescription('You must be signed in to access this page.');
    } else {
      setErrorMessage('Authentication Error');
      setErrorDescription('An unknown error occurred during authentication. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-[#080818] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-600/10 mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{errorMessage}</h1>
          <p className="text-red-300 mb-6">{errorDescription}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-slate-700/50">
          <div className="space-y-6">
            <p className="text-slate-300 text-center">
              Please try signing in again or return to the home page.
            </p>
            <div className="flex flex-col space-y-4">
              <Link
                href="/login"
                className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="w-full flex items-center justify-center py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Need help?{' '}
            <Link href="/support" className="text-blue-400 hover:text-blue-300">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}