import RegexpParser from './src/index';
const global: typeof window & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any;
} = window;
global['RegexpParser'] = RegexpParser;
