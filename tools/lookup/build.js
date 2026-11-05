#!/usr/bin/env node
/* 학생별 조회 페이지 생성기 — 결과값을 암호화해 정적 HTML 하나로 만든다.

   사용: node tools/lookup/build.js <명단.csv> <설정.json> <출력.html>

   명단 CSV (UTF-8): 학교,학년,학번,이름,그 뒤 열은 모두 결과 항목
   설정 JSON: { "title": "...", "lede": "...", "note": "...", "end": "YYYY-MM-DD", "base": "../../" }

   - 원본 명단은 저장소 밖에 둔다. 저장소 안의 CSV는 거부한다.
   - 키는 학교·학년·학번·이름에서 만들며 페이지에 들어가지 않는다.
   - 학번과 이름을 아는 사람은 그 학생의 결과를 볼 수 있다. 명단 전체가 드러나지 않을 뿐이다.
   - 종료일이 지나면 화면이 닫히지만 파일은 남는다. 종료 후에는 파일을 내려야 한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { promisify } = require('util');
const pbkdf2 = promisify(crypto.pbkdf2);

const ITER = 600000;
const KEY_COLS = ['학교', '학년', '학번', '이름'];

function fail(msg) { console.error(msg); process.exit(1); }

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim()));
}

const norm = s => s.normalize('NFC').replace(/\s+/g, '');

function repoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: __dirname, encoding: 'utf8' }).trim();
  } catch (e) { return null; }
}

async function main() {
  const [csvPath, cfgPath, outPath] = process.argv.slice(2);
  if (!outPath) fail('사용: node tools/lookup/build.js <명단.csv> <설정.json> <출력.html>');

  const root = repoRoot();
  if (root) {
    const rel = path.relative(path.resolve(root), path.resolve(csvPath));
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) fail('명단 CSV가 저장소 안에 있습니다. 저장소 밖으로 옮기십시오.');
  }

  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cfg.end || '')) fail('설정에 종료일 end(YYYY-MM-DD)가 필요합니다.');

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const head = rows.shift().map(v => v.trim());
  if (KEY_COLS.some((k, i) => head[i] !== k)) fail('CSV 첫 네 열은 학교,학년,학번,이름이어야 합니다.');
  const cols = head.slice(4);
  if (!cols.length) fail('결과 열이 없습니다.');

  const salt = crypto.randomBytes(16);
  const seen = new Set(), schools = new Set(), table = {};
  let next = 0;
  async function work() {
    while (next < rows.length) {
      const r = rows[next++];
      const raw = [r[0], r[1], r[2], r[3]].map(norm).join('|');
      if (seen.has(raw)) fail('같은 학교·학년·학번·이름이 두 번 있습니다. 명단을 확인하십시오.');
      seen.add(raw); schools.add(r[0].trim());
      const bits = await pbkdf2(Buffer.from(raw, 'utf8'), salt, ITER, 48, 'sha256');
      const iv = crypto.randomBytes(12);
      const c = crypto.createCipheriv('aes-256-gcm', bits.subarray(16), iv);
      const ct = Buffer.concat([c.update(JSON.stringify(r.slice(4)), 'utf8'), c.final(), c.getAuthTag()]);
      table[bits.subarray(0, 16).toString('hex')] = [iv.toString('base64'), ct.toString('base64')];
    }
  }
  await Promise.all([1, 2, 3, 4].map(work));

  const data = {
    salt: salt.toString('base64'), iter: ITER, cols, end: cfg.end,
    title: cfg.title || '', lede: cfg.lede || '', note: cfg.note || '',
    schools: [...schools].sort((a, b) => a.localeCompare(b, 'ko')), r: table
  };
  const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  const html = tpl
    .split('{{BASE}}').join(cfg.base || '../../')
    .replace('{{TITLE}}', () => String(cfg.title || '').replace(/[<&]/g, ''))
    .replace('{{DATA}}', () => JSON.stringify(data).replace(/</g, '\\u003c'));
  fs.writeFileSync(outPath, html);
  console.log(`${rows.length}건 생성. 종료일 ${cfg.end}. docs/privacy/register.json에 등록하십시오.`);
}
main().catch(e => fail(e.message));
