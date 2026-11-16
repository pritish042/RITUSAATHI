import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
function token(name:string){const value=css.match(new RegExp(`--${name}:(#[A-Fa-f0-9]{6})`))?.[1];assert.ok(value,`Missing palette token ${name}`);return value;}
function luminance(hex:string){const rgb=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a:string,b:string){const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(values[0]+.05)/(values[1]+.05);}
test('actual journal text/control palette pairs meet WCAG AA normal-text contrast',()=>{
 for(const [fg,bg] of [['ink','paper'],['paper','ink'],['paper','oxblood'],['muted','paper'],['peacock','paper'],['vermilion','paper'],['brass','ink'],['brass','oxblood'],['vermilion','correction'],['muted','correction'],['peacock','correction'],['ink','notice'],['ink','field']]){
  const ratio=contrast(token(fg),token(bg));assert.ok(ratio>=4.5,`${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
 }
});
test('light and dark surface focus indicators have at least 3:1 contrast',()=>{
 for(const [fg,bg] of [['peacock','paper'],['brass','ink'],['brass','oxblood']])assert.ok(contrast(token(fg),token(bg))>=3);
});
