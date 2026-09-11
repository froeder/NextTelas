import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.join(__dirname, '../src/version.json');
const pkgFilePath = path.join(__dirname, '../package.json');

let versionData = { version: '1.0.0', buildNumber: 0, buildTime: '' };

if (fs.existsSync(versionFilePath)) {
  try {
    versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
  } catch (e) {
    console.error('Erro ao ler version.json:', e);
  }
}

const currentBuild = (versionData.buildNumber || 0) + 1;

// Incrementar patch version (ex: 1.0.0 -> 1.0.1)
const parts = (versionData.version || '1.0.0').split('.');
let major = parseInt(parts[0], 10) || 1;
let minor = parseInt(parts[1], 10) || 0;
let patch = (parseInt(parts[2], 10) || 0) + 1;

const newVersion = `${major}.${minor}.${patch}`;

// Format timestamp: DD/MM/YYYY HH:mm
const now = new Date();
const formattedDate = now.toLocaleDateString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});
const formattedTime = now.toLocaleTimeString('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const buildTimestamp = `${formattedDate} ${formattedTime}`;

const updatedData = {
  version: newVersion,
  buildNumber: currentBuild,
  buildTime: buildTimestamp,
};

fs.writeFileSync(versionFilePath, JSON.stringify(updatedData, null, 2));

// Atualizar package.json
if (fs.existsSync(pkgFilePath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgFilePath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgFilePath, JSON.stringify(pkg, null, 2));
  } catch (e) {
    console.error('Erro ao atualizar package.json:', e);
  }
}

console.log(`\n🚀 [Auto Version Bump] Nova versão gerada: v${newVersion} (Build #${currentBuild} • ${buildTimestamp})\n`);
