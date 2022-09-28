import express from "express";

export type LocalObject = Record<string, any>;

export interface LocalRequest extends express.Request {
  // auth: typeof Auth;
  auth: any;
  config: any;
  userFromJWT: any;
  applicationId: string;
  query: Record<string, any>;
  body: Record<string, any>;
  info: {
    appId: string;
    sessionToken: string;
    masterKey: string;
    installationId: string;
    clientKey: string;
    javascriptKey: string;
    dotNetKey: string;
    restAPIKey: string;
    clientVersion: string;
    context: any;
    clientSDK?: {
      sdk: string;
      version: string;
    };
  };
}

export interface LocalResponse<T = any> {
  headers?: any;
  status?: number;
  location?: string;
  response: T;
  text?: string;
}