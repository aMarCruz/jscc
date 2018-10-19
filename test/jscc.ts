/// <reference path="../index.d.ts" />
/*
  Hack to avoid the "is not a module" error when importing '..'
*/
// @ts-ignore
import jscc from '..'
export default (jscc as Jscc)
