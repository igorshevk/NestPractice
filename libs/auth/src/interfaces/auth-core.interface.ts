export interface IAuthCoreConfig {
  port?: number;
  externalPort?: number;
  domain?: string;
  protocol?: 'http' | 'https';
  indexFile?: string;
}
